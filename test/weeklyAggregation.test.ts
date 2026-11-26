// 在纽约时区下运行：Binance 日线时间戳是 UTC 00:00，本地时间落在前一天
process.env.TZ = 'America/New_York';

import { describe, it, expect } from 'vitest';
import type { Candle } from '../src/types.js';
import { aggregateDailyToWeekly } from '../src/util/util.js';

function utcMidnightBars(startIso: string, days: number): Candle[] {
  const t0 = Date.parse(startIso);
  return Array.from({ length: days }, (_, i) => ({
    symbol: 'BTCUSDT',
    open: 100 + i,
    high: 101 + i,
    low: 99 + i,
    close: 100.5 + i,
    volume: 1,
    timestamp: new Date(t0 + i * 86400000),
  }));
}

describe('aggregateDailyToWeekly', () => {
  it('runs this file in a non-UTC time zone', () => {
    expect(new Date('2024-01-08T00:00:00Z').getDate()).toBe(7);
  });

  it('groups Monday to Sunday by UTC date', () => {
    // 2024-01-08 是周一，共 14 天 → 两整周
    const weekly = aggregateDailyToWeekly(
      utcMidnightBars('2024-01-08T00:00:00Z', 14)
    );

    expect(weekly).toHaveLength(2);
    expect(weekly[0].open).toBe(100); // 周一开盘
    expect(weekly[0].close).toBe(106.5); // 周日收盘
    expect(weekly[1].open).toBe(107);
  });
});
