import { describe, it, expect } from 'vitest';
import type { Candle } from '../src/types.js';
import { detectBullOrBear } from '../src/analysis/basic/candle/BullOrBearDetector.js';

const t0 = new Date('2024-01-01T00:00:00Z').getTime();

type Ohlc = [number, number, number, number];

/** 小幅下跌的前置K线，后接三根长阳线（红三兵） */
function withThreeWhiteSoldiers(trailing: Ohlc[] = []): Candle[] {
  const bars: Ohlc[] = [];
  for (let i = 0; i < 10; i++) {
    const o = 110 - i;
    bars.push([o, o + 0.3, o - 1.3, o - 1]);
  }
  bars.push([100, 104.2, 99.8, 104]);
  bars.push([102, 106.6, 101.8, 106.5]);
  bars.push([104.5, 109.1, 104.3, 109]);
  bars.push(...trailing);
  return bars.map(([open, high, low, close], i) => ({
    symbol: 'T',
    open,
    high,
    low,
    close,
    volume: 1000,
    timestamp: new Date(t0 + i * 86400000),
  }));
}

const names = (c: Candle[], idx: number) =>
  detectBullOrBear(c)
    .bullishPatterns.filter(
      p => p.date.getTime() === c[idx].timestamp.getTime()
    )
    .flatMap(p => p.patternNames);

describe('detectBullOrBear', () => {
  it('finds three white soldiers in the middle of the series', () => {
    const candles = withThreeWhiteSoldiers([
      [109, 109.5, 108.5, 109.2],
      [109.2, 109.6, 108.8, 109],
      [109, 109.4, 108.6, 109.1],
    ]);
    expect(names(candles, 12)).toContain('三只白兵');
  });

  it('finds three white soldiers on the latest bars', () => {
    const candles = withThreeWhiteSoldiers();
    expect(names(candles, candles.length - 1)).toContain('三只白兵');
  });
});
