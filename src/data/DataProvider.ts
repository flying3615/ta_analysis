import type { Candle } from '../types.js';
import type { IntegrationConfig } from '../analysis/integration/IntegrationConfig.js';
import {
  aggregateDailyToWeekly,
  getStockDataForTimeframe,
} from '../util/util.js';
import { SimpleCache } from '../analysis/integration/CacheManager.js';
import { BinanceProvider } from '../analysis/integration/BinanceProvider.js';

// 定义一个更灵活的返回类型
export type MultiTimeframeDataResult = {
  weeklyData?: Candle[];
  dailyData?: Candle[];
  hourlyData?: Candle[];
};

export class DataProvider {
  private cache: SimpleCache<Candle[]>;
  private binance = new BinanceProvider();

  constructor(maxCacheEntries: number = 100) {
    this.cache = new SimpleCache<Candle[]>(maxCacheEntries);
  }

  async getMultiTimeframeData(
    symbol: string,
    config: IntegrationConfig
  ): Promise<MultiTimeframeDataResult> {
    const today = new Date();
    const result: MultiTimeframeDataResult = {};
    const fetchPromises: Promise<void>[] = [];

    const isCrypto =
      symbol.endsWith('USDT') ||
      symbol.endsWith('BUSD') ||
      symbol.endsWith('USD');
    const dataFetcher = isCrypto
      ? this.getCachedBinanceData.bind(this)
      : this.getCachedStockData.bind(this);

    // 仅当配置中存在 weekly 时才获取周线数据
    if (config.timeframes.weekly) {
      const weeklyStartDate = new Date(today);
      weeklyStartDate.setDate(
        weeklyStartDate.getDate() - config.timeframes.weekly.lookbackDays
      );
      fetchPromises.push(
        dataFetcher(symbol, weeklyStartDate, today, 'weekly').then(data => {
          result.weeklyData = data;
        })
      );
    }

    // 仅当配置中存在 daily 时才获取日线数据
    if (config.timeframes.daily) {
      const dailyStartDate = new Date(today);
      dailyStartDate.setDate(
        dailyStartDate.getDate() - config.timeframes.daily.lookbackDays
      );
      fetchPromises.push(
        dataFetcher(symbol, dailyStartDate, today, 'daily').then(data => {
          result.dailyData = data;
        })
      );
    }

    // 仅当配置中存在 hourly 时才获取小时线数据
    if (config.timeframes.hourly) {
      const hourlyStartDate = new Date(today);
      hourlyStartDate.setDate(
        hourlyStartDate.getDate() - config.timeframes.hourly.lookbackDays
      );
      fetchPromises.push(
        dataFetcher(symbol, hourlyStartDate, today, '1hour').then(data => {
          result.hourlyData = data;
        })
      );
    }

    await Promise.all(fetchPromises);
    return result;
  }

  private async getCachedBinanceData(
    symbol: string,
    startDate: Date,
    endDate: Date,
    timeframe: 'weekly' | 'daily' | '1hour'
  ): Promise<Candle[]> {
    const cacheKey = `binance_${symbol}_${timeframe}_${startDate.toISOString()}_${endDate.toISOString()}`;
    return this.cache.getOrFetch(cacheKey, async () => {
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
    });
  }

  /**
   * 获取加密货币多周期数据（使用与股票相同的数据提供方，如 Yahoo）
   */
  async getMultiTimeframeCryptoData(
    symbol: string,
    config: IntegrationConfig
  ): Promise<MultiTimeframeDataResult> {
    const today = new Date();
    const result: MultiTimeframeDataResult = {};
    const fetchPromises: Promise<void>[] = [];

    // 仅当配置中存在 weekly 时才获取周线数据
    if (config.timeframes.weekly) {
      const weeklyStartDate = new Date(today);
      weeklyStartDate.setDate(
        weeklyStartDate.getDate() - config.timeframes.weekly.lookbackDays
      );
      fetchPromises.push(
        this.getCachedBinanceData(
          symbol,
          weeklyStartDate,
          today,
          'weekly'
        ).then(data => {
          result.weeklyData = data;
        })
      );
    }

    // 仅当配置中存在 daily 时才获取日线数据
    if (config.timeframes.daily) {
      const dailyStartDate = new Date(today);
      dailyStartDate.setDate(
        dailyStartDate.getDate() - config.timeframes.daily.lookbackDays
      );
      fetchPromises.push(
        this.getCachedBinanceData(symbol, dailyStartDate, today, 'daily').then(
          data => {
            result.dailyData = data;
          }
        )
      );
    }

    // 仅当配置中存在 hourly 时才获取小时线数据
    if (config.timeframes.hourly) {
      const hourlyStartDate = new Date(today);
      hourlyStartDate.setDate(
        hourlyStartDate.getDate() - config.timeframes.hourly.lookbackDays
      );
      fetchPromises.push(
        this.getCachedBinanceData(symbol, hourlyStartDate, today, '1hour').then(
          data => {
            result.hourlyData = data;
          }
        )
      );
    }

    await Promise.all(fetchPromises);
    return result;
  }

  async getCachedStockData(
    symbol: string,
    startDate: Date,
    endDate: Date,
    timeframe: 'weekly' | 'daily' | '1hour'
  ): Promise<Candle[]> {
    const cacheKey = `${symbol}_${timeframe}_${startDate.toISOString()}_${endDate.toISOString()}`;
    return this.cache.getOrFetch(cacheKey, async () => {
      return await getStockDataForTimeframe(
        symbol,
        startDate,
        endDate,
        timeframe
      );
    });
  }

  stats() {
    return this.cache.stats();
  }
  clear() {
    this.cache.clear();
  }
}
