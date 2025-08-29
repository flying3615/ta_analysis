import type { Candle } from '../../types.js';

// 轻量 REST 拉取：仅用 fetch，避免额外依赖。可选使用 @binance/spot 后续替换

type Interval = '1h' | '1d' | '1w';

function mapInterval(interval: Interval): string {
  if (interval === '1h') return '1h';
  if (interval === '1d') return '1d';
  return '1w';
}

function intervalMs(interval: Interval): number {
  if (interval === '1h') return 60 * 60 * 1000;
  if (interval === '1d') return 24 * 60 * 60 * 1000;
  return 7 * 24 * 60 * 60 * 1000;
}

function normalizeSpotSymbol(input: string): string {
  if (!input) return input;
  const s = String(input).trim().toUpperCase();
  if (s.includes('-') || s.includes('/')) {
    const [base, rawQuote] = s.split(/[-\/]/);
    const quote = rawQuote === 'USD' ? 'USDT' : rawQuote;
    return `${base}${quote}`;
  }
  return s;
}

export class BinanceProvider {
  private baseUrl = 'https://api.binance.com';

  async getKlines(
    symbol: string,
    interval: Interval,
    startTime: Date,
    endTime: Date
  ): Promise<Candle[]> {
    const normSymbol = normalizeSpotSymbol(symbol);
    const iv = mapInterval(interval);
    const step = intervalMs(interval);
    const limit = 1000; // Binance max
    const result: Candle[] = [];

    let from = startTime.getTime();
    const end = endTime.getTime();

    while (from < end) {
      const params = new URLSearchParams({
        symbol: normSymbol,
        interval: iv,
        startTime: String(from),
        endTime: String(end),
        limit: String(limit),
      });
      const url = `${this.baseUrl}/api/v3/klines?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) break;
      const arr: any[] = await res.json();
      if (!Array.isArray(arr) || arr.length === 0) break;

      for (const row of arr) {
        const openTime = Number(row[0]);
        if (openTime >= from && openTime <= end) {
          result.push({
            symbol: normSymbol,
            open: Number(row[1]),
            high: Number(row[2]),
            low: Number(row[3]),
            close: Number(row[4]),
            volume: Number(row[5]),
            timestamp: new Date(openTime),
          } as Candle);
        }
      }

      const last = Number(arr[arr.length - 1]?.[0]);
      const next = Math.max(from + step, last + step);
      if (next <= from) break; // safety
      from = next;

      // 小等待以避免突发速率（通常无需）
      if (arr.length >= limit) await new Promise(r => setTimeout(r, 100));
    }

    // 排序保证升序
    result.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    return result;
  }
}


