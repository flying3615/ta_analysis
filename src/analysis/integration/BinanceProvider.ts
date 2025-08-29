import type { Candle } from '../../types.js';

// 轻量 REST 拉取：仅用 fetch，避免额外依赖。可选使用 @binance/spot 后续替换

type Interval = '1h' | '1d' | '1w';

function mapInterval(interval: Interval): string {
  if (interval === '1h') return '1h';
  if (interval === '1d') return '1d';
  return '1w';
}

export class BinanceProvider {
  private baseUrl = 'https://api.binance.com';

  async getKlines(
    symbol: string,
    interval: Interval,
    startTime: Date,
    endTime: Date
  ): Promise<Candle[]> {
    const params = new URLSearchParams({
      symbol,
      interval: mapInterval(interval),
      startTime: String(startTime.getTime()),
      endTime: String(endTime.getTime()),
      limit: '1000',
    });
    const url = `${this.baseUrl}/api/v3/klines?${params.toString()}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const arr: any[] = await res.json();
    return arr.map(row => ({
      symbol,
      open: Number(row[1]),
      high: Number(row[2]),
      low: Number(row[3]),
      close: Number(row[4]),
      volume: Number(row[5]),
      timestamp: new Date(row[0]),
    } satisfies Candle));
  }
}


