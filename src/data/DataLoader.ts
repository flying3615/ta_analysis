import type { Candle } from '../types.js';
import { getStockDataForTimeframe } from '../util/util.js';

export type Timeframe = 'weekly' | 'daily' | '1hour';

export interface BatchLoadOptions {
  lookbackDays?: number;
  startDate?: Date;
  endDate?: Date;
  timeframe?: Timeframe;
  maxConcurrency?: number;
}

/**
 * Lightweight in-memory cache keyed by symbol+timeframe+date range
 */
class MemoryCache<T> {
  private store = new Map<string, { value: T; ts: number }>();
  constructor(private ttlMs: number = 5 * 60 * 1000) {}

  private key(parts: (string | number)[]): string {
    return parts.join('|');
  }

  get(parts: (string | number)[]): T | undefined {
    const k = this.key(parts);
    const entry = this.store.get(k);
    if (!entry) return undefined;
    const now = Date.now();
    if (now - entry.ts > this.ttlMs) {
      this.store.delete(k);
      return undefined;
    }
    return entry.value;
    }

  set(parts: (string | number)[], value: T): void {
    const k = this.key(parts);
    this.store.set(k, { value, ts: Date.now() });
  }

  clear(): void {
    this.store.clear();
  }
}

const cache = new MemoryCache<Candle[]>(10 * 60 * 1000);

/**
 * Fetch historical candles for a single symbol/timeframe.
 */
export async function fetchHistoricalCandles(
  symbol: string,
  startDate: Date,
  endDate: Date,
  timeframe: Timeframe
): Promise<Candle[]> {
  const cached = cache.get([symbol, timeframe, startDate.toISOString(), endDate.toISOString()]);
  if (cached) return cached;
  const data = await getStockDataForTimeframe(symbol, startDate, endDate, timeframe);
  cache.set([symbol, timeframe, startDate.toISOString(), endDate.toISOString()], data);
  return data;
}

/**
 * Batch download candles for multiple symbols with optional concurrency limiting.
 */
export async function fetchBatchHistorical(
  symbols: string[],
  options: BatchLoadOptions
): Promise<Map<string, Candle[]>> {
  const {
    lookbackDays = 365,
    startDate,
    endDate = new Date(),
    timeframe = 'daily',
    maxConcurrency = 5,
  } = options ?? {};

  const effectiveStart = startDate
    ? startDate
    : new Date(endDate.getTime() - lookbackDays * 24 * 60 * 60 * 1000);

  const results = new Map<string, Candle[]>();

  // simple concurrency control
  let idx = 0;
  async function worker() {
    while (idx < symbols.length) {
      const current = idx++;
      const symbol = symbols[current];
      const data = await fetchHistoricalCandles(symbol, effectiveStart, endDate, timeframe);
      results.set(symbol, data);
    }
  }

  const workers = Array.from({ length: Math.min(maxConcurrency, symbols.length) }, () => worker());
  await Promise.all(workers);

  return results;
}

/**
 * Fetch multi-timeframe data for a list of symbols. Returns a map per timeframe.
 */
export async function fetchBatchMultiTimeframe(
  symbols: string[],
  opts: {
    weeklyLookbackDays?: number;
    dailyLookbackDays?: number;
    hourlyLookbackDays?: number;
    endDate?: Date;
    maxConcurrency?: number;
  } = {}
): Promise<{
  weekly: Map<string, Candle[]>;
  daily: Map<string, Candle[]>;
  hourly: Map<string, Candle[]>;
}> {
  const endDate = opts.endDate ?? new Date();
  const [weekly, daily, hourly] = await Promise.all([
    fetchBatchHistorical(symbols, {
      lookbackDays: opts.weeklyLookbackDays ?? 1500,
      endDate,
      timeframe: 'weekly',
      maxConcurrency: opts.maxConcurrency ?? 5,
    }),
    fetchBatchHistorical(symbols, {
      lookbackDays: opts.dailyLookbackDays ?? 1000,
      endDate,
      timeframe: 'daily',
      maxConcurrency: opts.maxConcurrency ?? 5,
    }),
    fetchBatchHistorical(symbols, {
      lookbackDays: opts.hourlyLookbackDays ?? 120,
      endDate,
      timeframe: '1hour',
      maxConcurrency: opts.maxConcurrency ?? 5,
    }),
  ]);

  return { weekly, daily, hourly };
}