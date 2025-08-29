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
   * Get multi-timeframe crypto OHLCV data using Token Metrics tmai-api SDK.
   * - Respects IntegrationConfig.timeframes.lookbackDays for weekly/daily/hourly
   * - Accepts API key as a parameter (no global config required)
   * - Uses internal cache to avoid redundant requests
   */
  async getMultiTimeframeCryptoData(
    symbol: string,
    config: IntegrationConfig,
    apiKey: string
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

    // Fetch daily and hourly from API; weekly is aggregated from daily
    const [dailyData, hourlyData] = await Promise.all([
      this.getCachedCryptoData(symbol, dailyStartDate, today, 'daily', apiKey),
      this.getCachedCryptoData(symbol, hourlyStartDate, today, '1hour', apiKey),
    ]);

    // Weekly aggregation from daily (then cached)
    const weeklyData = await this.getCachedCryptoData(
      symbol,
      weeklyStartDate,
      today,
      'weekly',
      apiKey,
      dailyData // pass daily data to avoid re-fetch
    );

    return { weeklyData, dailyData, hourlyData };
  }

  /**
   * Cached crypto data retrieval.
   * timeframe:
   *  - 'daily'  -> fetch from tmai-api dailyOhlcv
   *  - '1hour'  -> fetch from tmai-api hourlyOhlcv
   *  - 'weekly' -> aggregate from daily to weekly
   */
  async getCachedCryptoData(
    symbol: string,
    startDate: Date,
    endDate: Date,
    timeframe: 'weekly' | 'daily' | '1hour',
    apiKey: string,
    preFetchedDaily?: Candle[]
  ): Promise<Candle[]> {
    const cacheKey = `crypto_${symbol}_${timeframe}_${startDate.toISOString()}_${endDate.toISOString()}`;
    return this.cache.getOrFetch(cacheKey, async () => {
      if (timeframe === 'weekly') {
        // Use pre-fetched daily if provided, otherwise fetch daily
        const daily =
          preFetchedDaily ??
          (await this.getCachedCryptoData(
            symbol,
            startDate,
            endDate,
            'daily',
            apiKey
          ));
        return this.aggregateDailyToWeekly(daily);
      }

      // timeframe daily or 1hour -> fetch from API
      const granularity = timeframe === '1hour' ? 'hourly' : 'daily';
      return await this.fetchCryptoOhlcv(symbol, startDate, endDate, granularity, apiKey);
    });
  }

  /**
   * Low-level fetcher using tmai-api SDK with automatic 29-day chunking.
   * granularity: 'daily' | 'hourly'
   */
  private async fetchCryptoOhlcv(
    symbol: string,
    startDate: Date,
    endDate: Date,
    granularity: 'daily' | 'hourly',
    apiKey: string
  ): Promise<Candle[]> {
    // Dynamic import to avoid hard dependency if consumer doesn't need crypto
    let TokenMetricsClient: any;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod = await import('tmai-api');
      TokenMetricsClient = mod.TokenMetricsClient ?? (mod as any).default?.TokenMetricsClient ?? mod;
    } catch (e) {
      throw new Error(
        "Missing dependency 'tmai-api'. Install with: npm install tmai-api"
      );
    }

    const client = new TokenMetricsClient(apiKey);

    // API has a 29-day range limit; chunk requests safely
    const maxDaysPerChunk = 29;
    const results: any[] = [];

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Normalize to date boundaries to fit API "YYYY-MM-DD"
    const addDays = (d: Date, days: number) => {
      const nd = new Date(d);
      nd.setDate(nd.getDate() + days);
      return nd;
    };

    let currentStart = new Date(start);
    while (currentStart <= end) {
      const currentEnd = addDays(currentStart, maxDaysPerChunk);
      const chunkEnd = currentEnd > end ? end : currentEnd;

      const params = {
        symbol,
        startDate: this.formatDate(currentStart),
        endDate: this.formatDate(chunkEnd),
      };

      let chunk: any;
      if (granularity === 'daily') {
        chunk = await client.dailyOhlcv.get(params);
      } else {
        chunk = await client.hourlyOhlcv.get(params);
      }

      const arr = Array.isArray(chunk?.data) ? chunk.data : Array.isArray(chunk) ? chunk : [];
      results.push(...arr);

      // Next chunk starts the day after chunkEnd
      currentStart = addDays(chunkEnd, 1);
    }

    const candles = this.toCandleArray(results, symbol);
    // Ensure ascending order
    candles.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    return candles;
  }

  /** Format date as YYYY-MM-DD */
  private formatDate(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Convert raw API rows to Candle[]
   * Handles common field name variants and numeric strings.
   */
  private toCandleArray(rows: any[], symbol: string): Candle[] {
    return rows
      .map(row => {
        // Field name normalization (case-insensitive)
        const get = (keys: string[]) => {
          for (const k of keys) {
            if (row[k] !== undefined) return row[k];
            const key = Object.keys(row).find(x => x.toLowerCase() === k.toLowerCase());
            if (key && row[key] !== undefined) return row[key];
          }
          return undefined;
        };

        const open = this.toNumber(get(['open', 'OPEN', 'O']));
        const high = this.toNumber(get(['high', 'HIGH', 'H']));
        const low = this.toNumber(get(['low', 'LOW', 'L']));
        const close = this.toNumber(get(['close', 'CLOSE', 'C']));
        const volume = this.toNumber(get(['volume', 'VOLUME', 'VOL']));

        const dateStr =
          get(['datetime', 'DATETIME']) ??
          get(['timestamp', 'TIMESTAMP']) ??
          get(['date', 'DATE']);
        const ts = dateStr ? new Date(dateStr) : undefined;

        if (
          ts instanceof Date &&
          !isNaN(ts.getTime()) &&
          open != null &&
          high != null &&
          low != null &&
          close != null &&
          volume != null
        ) {
          return {
            symbol,
            open,
            high,
            low,
            close,
            volume,
            timestamp: ts,
          } as Candle;
        }
        return null;
      })
      .filter((x): x is Candle => x !== null);
  }

  private toNumber(v: any): number | undefined {
    if (v == null) return undefined;
    if (typeof v === 'number') return v;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }

  /**
   * Aggregate daily candles into weekly candles (Mon-Sun window)
   */
  private aggregateDailyToWeekly(daily: Candle[]): Candle[] {
    if (!daily.length) return [];

    // Group by ISO week (year-week)
    const weekKey = (d: Date) => {
      const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
      // ISO week calculation
      // Thursday in current week decides the year
      date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
      const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
      const weekNo = Math.ceil(
        ((+date - +yearStart) / 86400000 + 1) / 7
      );
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
