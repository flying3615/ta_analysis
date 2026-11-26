import { describe, it, expect } from 'vitest';
import type { Candle } from '../src/types.js';
import {
  analyzeStockPattern,
  extractPatternFeatures,
} from '../src/strategy/PatternMathcer.js';

const t0 = Date.parse('2024-01-01T00:00:00Z');

function candles(
  closes: number[],
  volume: (i: number) => number = () => 1000
): Candle[] {
  return closes.map((c, i) => ({
    symbol: 'T',
    open: c,
    high: c * 1.005,
    low: c * 0.995,
    close: c,
    volume: volume(i),
    timestamp: new Date(t0 + i * 86400000),
  }));
}

describe('PatternMathcer', () => {
  it('rates ±1% daily moves as low volatility (about 16% annualized)', () => {
    const closes = Array.from(
      { length: 60 },
      (_, i) => 100 * (i % 2 === 0 ? 1 : 1.01)
    );
    expect(extractPatternFeatures(candles(closes)).volatilityLevel).toBe('low');
  });

  it('does not call a single volume spike a spike pattern', () => {
    const closes = Array.from({ length: 60 }, (_, i) => 100 + Math.sin(i / 5));
    const features = extractPatternFeatures(
      candles(closes, i => (i === 30 ? 5000 : 1000))
    );
    expect(features.volumePattern).not.toBe('spikes');
  });

  it('dates the golden cross on or after the price jump', () => {
    // 前 40 根下跌，之后跳涨并保持
    const closes = Array.from({ length: 80 }, (_, i) =>
      i < 40 ? 100 - i * 0.2 : 110 + (i - 40) * 0.2
    );
    const data = candles(closes);

    const res = analyzeStockPattern(data);

    expect(res.goldenCrossDates.length).toBeGreaterThan(0);
    for (const d of res.goldenCrossDates) {
      expect(d.getTime()).toBeGreaterThanOrEqual(data[40].timestamp.getTime());
    }
  });
});
