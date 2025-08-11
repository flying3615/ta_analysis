import type { Candle } from '../../types.js';
import type { IntegrationConfig } from './IntegrationConfig.js';
import { getStockDataForTimeframe } from '../../util/util.js';
import { SimpleCache } from './CacheManager.js';

export class DataProvider {
  private cache: SimpleCache<Candle[]>;

  constructor(maxCacheEntries: number = 100) {
    this.cache = new SimpleCache<Candle[]>(maxCacheEntries);
  }

  async getMultiTimeframeData(
    symbol: string,
    config: IntegrationConfig
  ): Promise<{ weeklyData: Candle[]; dailyData: Candle[]; hourlyData: Candle[] }>
  {
    const today = new Date();

    const weeklyStartDate = new Date(today);
    weeklyStartDate.setDate(weeklyStartDate.getDate() - config.timeframes.weekly.lookbackDays);

    const dailyStartDate = new Date(today);
    dailyStartDate.setDate(dailyStartDate.getDate() - config.timeframes.daily.lookbackDays);

    const hourlyStartDate = new Date(today);
    hourlyStartDate.setDate(hourlyStartDate.getDate() - config.timeframes.hourly.lookbackDays);

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
    const cacheKey = `${symbol}_${timeframe}_${startDate.toISOString()}_${endDate.toISOString()}`;
    return this.cache.getOrFetch(cacheKey, async () => {
      return await getStockDataForTimeframe(symbol, startDate, endDate, timeframe);
    });
  }

  stats() { return this.cache.stats(); }
  clear() { this.cache.clear(); }
}


