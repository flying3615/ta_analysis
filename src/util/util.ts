import { Candle } from '../types.js';
import yahooFinance from 'yahoo-finance2';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import { ChartOptions } from 'yahoo-finance2/dist/cjs/src/modules/chart';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import { ChartResultObject } from 'yahoo-finance2/dist/esm/src/modules/chart';
import { PatternStatus } from '../analysis/basic/patterns/analyzeMultiTimeframePatterns.js';
import { globalLogger } from './logger.js';

export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

/**
 * 生成唯一标识符
 */
export function generateUniqueId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export interface NamedPromise<T> {
  promise: Promise<T>;
  name: string;
}

export const promiseWithTimeout = async <T>(
  namedPromise: NamedPromise<T>,
  timeout: number,
  errorMsg: string
): Promise<T> => {
  let timeoutId: NodeJS.Timeout | undefined = undefined;
  try {
    const timeoutPromise = new Promise<T>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(`${namedPromise.name} ${errorMsg}`));
      }, timeout);
    });

    return await Promise.race([
      namedPromise.promise.then(r => {
        return r;
      }),
      timeoutPromise,
    ]);
  } finally {
    clearTimeout(timeoutId);
  }
};

export function calculateRSI(prices: number[], period: number): number[] {
  const rsi: number[] = [];
  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) {
      gains += change;
    } else {
      losses -= change;
    }
  }

  let averageGain = gains / period;
  let averageLoss = losses / period;

  rsi.push(100 - 100 / (1 + averageGain / averageLoss));

  for (let i = period + 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) {
      averageGain = (averageGain * (period - 1) + change) / period;
      averageLoss = (averageLoss * (period - 1)) / period;
    } else {
      averageGain = (averageGain * (period - 1)) / period;
      averageLoss = (averageLoss * (period - 1) - change) / period;
    }

    rsi.push(100 - 100 / (1 + averageGain / averageLoss));
  }

  return rsi;
}

export function rollingMin(prices: number[], window: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < prices.length; i++) {
    const start = Math.max(0, i - window + 1);
    const end = i + 1;
    const windowSlice = prices.slice(start, end);
    result.push(Math.min(...windowSlice));
  }
  return result;
}

export function rollingMax(prices: number[], window: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < prices.length; i++) {
    const start = Math.max(0, i - window + 1);
    const end = i + 1;
    const windowSlice = prices.slice(start, end);
    result.push(Math.max(...windowSlice));
  }
  return result;
}

export function standardDeviation(values: number[]): number {
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
  const avgSquaredDiff =
    squaredDiffs.reduce((sum, value) => sum + value, 0) / values.length;
  return Math.sqrt(avgSquaredDiff);
}

export function percentChange(prices: number[]): number[] {
  const changes: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    const change = ((prices[i] - prices[i - 1]) / prices[i - 1]) * 100;
    changes.push(change);
  }
  return changes;
}

// same as MarketQuery.getHistoricalData
export async function getStockData(
  symbol: string,
  startDate: Date,
  endDate: Date,
  interval = '1d'
): Promise<Candle[]> {
  const queryOptions = {
    period1: startDate,
    period2: endDate,
    interval,
  } as ChartOptions;

  try {
    const result: ChartResultObject = await yahooFinance.chart(
      symbol,
      queryOptions
    );
    const candles: Candle[] = [];

    if (result && result.quotes && result.quotes.length > 0) {
      result.quotes.forEach(quote => {
        if (quote.date && quote.close && quote.volume !== undefined) {
          candles.push({
            symbol,
            open: quote.open || quote.close,
            high: quote.high || quote.close,
            low: quote.low || quote.close,
            close: quote.close,
            volume: quote.volume,
            timestamp: new Date(quote.date),
          });
        }
      });
    }

    return candles;
  } catch (error) {
    globalLogger.error('获取股票数据时出错:', error);
    return [];
  }
}

export async function getStockDataForTimeframe(
  symbol: string,
  startDate: Date,
  endDate: Date,
  timeframe: 'weekly' | 'daily' | '1hour'
): Promise<Candle[]> {
  // 实际应用中，应该直接从数据提供商获取对应时间周期的数据
  // 这里为了简化，我们从日线数据模拟其他时间周期

  // 首先获取原始日线数据
  const rawData = await getStockData(symbol, startDate, endDate);

  if (timeframe === 'daily') {
    return await getStockData(symbol, startDate, endDate); // 直接返回日线数据
  } else if (timeframe === 'weekly') {
    // 将日线数据聚合为周线
    return await getStockData(symbol, startDate, endDate, '1wk');
  } else if (timeframe === '1hour') {
    // 注意：实际应用中应该直接获取真实的日内数据
    // 过滤掉夜盘影响，成交量为0的数据
    return (await getStockData(symbol, startDate, endDate, '1h')).filter(
      c => c.volume !== 0
    );
  }

  // 默认返回日线数据
  return rawData;
}

/**
 * 获取形态状态描述
 */
export function getStatusDescription(status: PatternStatus): string {
  switch (status) {
    case PatternStatus.Forming:
      return '正在形成中';
    case PatternStatus.Completed:
      return '已完成但未突破';
    case PatternStatus.Confirmed:
      return '已确认突破';
    case PatternStatus.Failed:
      return '形成后失败';
    default:
      return '未知状态';
  }
}

/**
 * 将日期转换为美东时间字符串
 * @param date
 */
export function toEDTString(date: Date): string {
  return date.toLocaleString('en-US', {
    timeZone: 'America/New_York',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * Get full exchange name from symbol
 * @param symbol
 */
export async function getFullExchangeNameBySymbol(symbol: string) {
  try {
    const result = await yahooFinance.quote(symbol, {
      fields: ['fullExchangeName'],
    });
    if (result) {
      let fullExchangeName = result.fullExchangeName; // 返回 fullExchangeName
      fullExchangeName = fullExchangeName.toLowerCase().includes('nasdaq')
        ? 'NASDAQ'
        : fullExchangeName;

      return fullExchangeName; // 返回 fullExchangeName
    } else {
      globalLogger.log(`Can't get ${symbol} full exchange name`);
      return ''; // 返回 null 表示未找到
    }
  } catch (e) {
    globalLogger.error(
      `Error occurs when getting ${symbol} full exchange name`,
      e.message
    );
    return ''; // 返回 null 表示出错
  }
}

/**
 * Aggregate daily candles into weekly candles (Mon-Sun window)
 */
export function aggregateDailyToWeekly(daily: Candle[]): Candle[] {
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
