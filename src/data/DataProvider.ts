import type { Candle } from '../types.js';
import type { IntegrationConfig } from '../analysis/integration/IntegrationConfig.js';
import {
  aggregateDailyToWeekly,
  getStockDataForTimeframe,
} from '../util/util.js';
import { SimpleCache } from '../analysis/integration/CacheManager.js';
import {
  BinanceProvider,
  normalizeSpotSymbol,
  toBinanceSymbol,
} from '../analysis/integration/BinanceProvider.js';
import { globalLogger } from '../util/logger.js';

type Timeframe = 'weekly' | 'daily' | '1hour';

/** 获取单个周期数据的函数：参数依次为开始日期、结束日期、周期 */
// 基础规则 no-unused-vars 会把类型签名里的参数名误报为未使用
/* eslint-disable no-unused-vars */
type FetchTimeframe = (
  start: Date,
  end: Date,
  tf: Timeframe
) => Promise<Candle[]>;
/* eslint-enable no-unused-vars */

export interface MultiTimeframeCandles {
  weeklyData: Candle[];
  dailyData: Candle[];
  hourlyData: Candle[];
}

/** 各周期缓存有效期：小时线更新频繁，缓存时间更短 */
const CACHE_TTL_MS: Record<Timeframe, number> = {
  '1hour': 5 * 60 * 1000,
  daily: 30 * 60 * 1000,
  weekly: 30 * 60 * 1000,
};

/** 缓存键只精确到日期（UTC），同一天内的重复请求可以命中缓存 */
function cacheKey(
  source: string,
  symbol: string,
  timeframe: Timeframe,
  startDate: Date,
  endDate: Date
): string {
  const day = (d: Date) => d.toISOString().slice(0, 10);
  return `${source}_${symbol}_${timeframe}_${day(startDate)}_${day(endDate)}`;
}

export class DataProvider {
  private cache: SimpleCache<Candle[]>;
  private binance = new BinanceProvider();

  constructor(maxCacheEntries: number = 100) {
    this.cache = new SimpleCache<Candle[]>(maxCacheEntries);
  }

  async getMultiTimeframeData(
    symbol: string,
    config: IntegrationConfig
  ): Promise<MultiTimeframeCandles> {
    // 加密货币交易对统一走 Binance（代码先规范化为 BTCUSDT 这样的形式），其他走 Yahoo
    const binanceSymbol = toBinanceSymbol(symbol);
    return this.fetchTimeframes(symbol, config, (start, end, tf) =>
      binanceSymbol
        ? this.getCachedBinanceData(binanceSymbol, start, end, tf)
        : this.getCachedStockData(symbol, start, end, tf)
    );
  }

  /**
   * 并行获取三个周期的数据。
   * 日线是必需的，失败时抛错；周线和小时线失败时记录警告并按空数据处理。
   */
  private async fetchTimeframes(
    symbol: string,
    config: IntegrationConfig,
    fetchOne: FetchTimeframe
  ): Promise<MultiTimeframeCandles> {
    const today = new Date();
    const startFor = (lookbackDays: number) => {
      const d = new Date(today);
      d.setDate(d.getDate() - lookbackDays);
      return d;
    };

    const [weekly, daily, hourly] = await Promise.allSettled([
      fetchOne(
        startFor(config.timeframes.weekly.lookbackDays),
        today,
        'weekly'
      ),
      fetchOne(startFor(config.timeframes.daily.lookbackDays), today, 'daily'),
      fetchOne(startFor(config.timeframes.hourly.lookbackDays), today, '1hour'),
    ]);

    if (daily.status === 'rejected') throw daily.reason;

    const optional = (
      result: PromiseSettledResult<Candle[]>,
      tf: Timeframe
    ): Candle[] => {
      if (result.status === 'fulfilled') return result.value;
      const reason =
        result.reason instanceof Error
          ? result.reason.message
          : String(result.reason);
      globalLogger.warn(
        `${symbol} ${tf} 数据获取失败，按空数据处理: ${reason}`
      );
      return [];
    };

    return {
      weeklyData: optional(weekly, 'weekly'),
      dailyData: daily.value,
      hourlyData: optional(hourly, '1hour'),
    };
  }

  private async getCachedBinanceData(
    symbol: string,
    startDate: Date,
    endDate: Date,
    timeframe: 'weekly' | 'daily' | '1hour'
  ): Promise<Candle[]> {
    const key = cacheKey('binance', symbol, timeframe, startDate, endDate);
    return this.cache.getOrFetch(
      key,
      async () => {
        if (timeframe === 'weekly') {
          const daily = await this.binance.getKlines(
            symbol,
            '1d',
            startDate,
            endDate
          );
          return aggregateDailyToWeekly(daily);
        }
        if (timeframe === 'daily') {
          return await this.binance.getKlines(symbol, '1d', startDate, endDate);
        }
        return await this.binance.getKlines(symbol, '1h', startDate, endDate);
      },
      { ttl: CACHE_TTL_MS[timeframe] }
    );
  }

  /**
   * 获取加密货币多周期数据（Binance 现货）。
   * 代码会规范化为 Binance 形式：BTC-USD / BTCUSD → BTCUSDT，ETH/EUR → ETHEUR。
   */
  async getMultiTimeframeCryptoData(
    symbol: string,
    config: IntegrationConfig
  ): Promise<MultiTimeframeCandles> {
    const binanceSymbol =
      toBinanceSymbol(symbol) ?? normalizeSpotSymbol(symbol);
    return this.fetchTimeframes(symbol, config, (start, end, tf) =>
      this.getCachedBinanceData(binanceSymbol, start, end, tf)
    );
  }

  async getCachedStockData(
    symbol: string,
    startDate: Date,
    endDate: Date,
    timeframe: 'weekly' | 'daily' | '1hour'
  ): Promise<Candle[]> {
    const key = cacheKey('stock', symbol, timeframe, startDate, endDate);
    return this.cache.getOrFetch(
      key,
      () => getStockDataForTimeframe(symbol, startDate, endDate, timeframe),
      { ttl: CACHE_TTL_MS[timeframe] }
    );
  }

  stats() {
    return this.cache.stats();
  }
  clear() {
    this.cache.clear();
  }
}
