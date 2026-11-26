import type { Candle } from '../types.js';
import type { IntegrationConfig } from '../analysis/integration/IntegrationConfig.js';
import {
  aggregateDailyToWeekly,
  getStockDataForTimeframe,
} from '../util/util.js';
import { SimpleCache } from '../analysis/integration/CacheManager.js';
import { BinanceProvider } from '../analysis/integration/BinanceProvider.js';

type Timeframe = 'weekly' | 'daily' | '1hour';

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
  ): Promise<{
    weeklyData: Candle[];
    dailyData: Candle[];
    hourlyData: Candle[];
  }> {
    const today = new Date();

    const weeklyStartDate = new Date(today);
    weeklyStartDate.setDate(
      weeklyStartDate.getDate() - config.timeframes.weekly.lookbackDays
    );

    const dailyStartDate = new Date(today);
    dailyStartDate.setDate(
      dailyStartDate.getDate() - config.timeframes.daily.lookbackDays
    );

    const hourlyStartDate = new Date(today);
    hourlyStartDate.setDate(
      hourlyStartDate.getDate() - config.timeframes.hourly.lookbackDays
    );

    let weeklyData: Candle[] = [];
    let dailyData: Candle[] = [];
    let hourlyData: Candle[] = [];

    if (
      symbol.endsWith('USDT') ||
      symbol.endsWith('BUSD') ||
      symbol.endsWith('USD')
    ) {
      [weeklyData, dailyData, hourlyData] = await Promise.all([
        this.getCachedBinanceData(symbol, weeklyStartDate, today, 'weekly'),
        this.getCachedBinanceData(symbol, dailyStartDate, today, 'daily'),
        this.getCachedBinanceData(symbol, hourlyStartDate, today, '1hour'),
      ]);
    } else {
      [weeklyData, dailyData, hourlyData] = await Promise.all([
        this.getCachedStockData(symbol, weeklyStartDate, today, 'weekly'),
        this.getCachedStockData(symbol, dailyStartDate, today, 'daily'),
        this.getCachedStockData(symbol, hourlyStartDate, today, '1hour'),
      ]);
    }

    return { weeklyData, dailyData, hourlyData };
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
   * 获取加密货币多周期数据（使用与股票相同的数据提供方，如 Yahoo）
   * 外部仍可传入 apiKey，但此实现不再依赖 tmai-api。
   */
  async getMultiTimeframeCryptoData(
    symbol: string,
    config: IntegrationConfig
  ): Promise<{
    weeklyData: Candle[];
    dailyData: Candle[];
    hourlyData: Candle[];
  }> {
    const today = new Date();

    const weeklyStartDate = new Date(today);
    weeklyStartDate.setDate(
      weeklyStartDate.getDate() - config.timeframes.weekly.lookbackDays
    );

    const dailyStartDate = new Date(today);
    dailyStartDate.setDate(
      dailyStartDate.getDate() - config.timeframes.daily.lookbackDays
    );

    const hourlyStartDate = new Date(today);
    hourlyStartDate.setDate(
      hourlyStartDate.getDate() - config.timeframes.hourly.lookbackDays
    );

    const [weeklyData, dailyData, hourlyData] = await Promise.all([
      this.getCachedStockData(symbol, weeklyStartDate, today, 'weekly'),
      this.getCachedStockData(symbol, dailyStartDate, today, 'daily'),
      this.getCachedStockData(symbol, hourlyStartDate, today, '1hour'),
    ]);

    return { weeklyData, dailyData, hourlyData };
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
