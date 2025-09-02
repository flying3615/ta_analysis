import type { Candle } from '../types.js';
import type { IntegrationConfig } from '../analysis/integration/IntegrationConfig.js';
import { getStockDataForTimeframe } from '../util/util.js';
import { SimpleCache } from '../analysis/integration/CacheManager.js';
import { BinanceProvider } from '../analysis/integration/BinanceProvider.js';

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
    const cacheKey = `binance_${symbol}_${timeframe}_${startDate.toISOString()}_${endDate.toISOString()}`;
    return this.cache.getOrFetch(cacheKey, async () => {
      if (timeframe === 'weekly') {
        const daily = await this.binance.getKlines(
          symbol,
          '1d',
          startDate,
          endDate
        );
        return this.aggregateDailyToWeekly(daily);
      }
      if (timeframe === 'daily') {
        return await this.binance.getKlines(symbol, '1d', startDate, endDate);
      }
      return await this.binance.getKlines(symbol, '1h', startDate, endDate);
    });
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

  /**
   * Aggregate daily candles into weekly candles (Mon-Sun window)
   */
  private aggregateDailyToWeekly(daily: Candle[]): Candle[] {
    if (!daily.length) return [];

    // Group by ISO week (year-week)
    const weekKey = (d: Date) => {
      const date = new Date(
        Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())
      );
      // ISO week calculation
      // Thursday in current week decides the year
      date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
      const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
      const weekNo = Math.ceil(((+date - +yearStart) / 86400000 + 1) / 7);
      return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
    };

    const groups = new Map<string, Candle[]>();
    for (const c of daily) {
      const key = weekKey(c.timestamp);
      const arr = groups.get(key);
      if (arr) arr.push(c);
      else groups.set(key, [c]);
    }

    const result: Candle[] = [];
    for (const [, arr] of groups) {
      // sort by time within week
      arr.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      const open = arr[0].open;
      const close = arr[arr.length - 1].close;
      const high = Math.max(...arr.map(x => x.high));
      const low = Math.min(...arr.map(x => x.low));
      const volume = arr.reduce((sum, x) => sum + (x.volume ?? 0), 0);
      const timestamp = arr[arr.length - 1].timestamp; // end of week
      result.push({
        symbol: arr[0].symbol,
        open,
        high,
        low,
        close,
        volume,
        timestamp,
      });
    }
    // Ensure ascending weekly order
    result.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
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
