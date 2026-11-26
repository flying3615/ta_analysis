import { describe, it, expect } from 'vitest';
import type { Candle } from '../src/types.js';
import { findFlagsAndPennants } from '../src/analysis/basic/patterns/findFlagsAndPennants.js';
import {
  PatternDirection,
  PatternType,
} from '../src/analysis/basic/patterns/analyzeMultiTimeframePatterns.js';

const t0 = Date.parse('2024-01-01T00:00:00Z');

/** bars: [close, halfRange] */
function toCandles(bars: [number, number][]): Candle[] {
  return bars.map(([c, r], i) => ({
    symbol: 'T',
    open: c,
    high: c + r,
    low: c - r,
    close: c,
    volume: 1000,
    timestamp: new Date(t0 + i * 86400000),
  }));
}

const flatBars = (): [number, number][] =>
  Array.from({ length: 30 }, () => [100, 0.8]);

describe('findFlagsAndPennants', () => {
  it('finds a bull flag whose pole ended only a few bars ago', () => {
    const bars = flatBars();
    for (let k = 1; k <= 8; k++) bars.push([100 + 1.5 * k, 0.8]); // 旗杆到 112
    for (let k = 0; k < 8; k++) bars.push([111.5 - 0.3 * k, 0.8]); // 平行下倾的旗面

    const res = findFlagsAndPennants(toCandles(bars), [], 30);

    expect(res).toContainEqual(
      expect.objectContaining({
        patternType: PatternType.Flag,
        direction: PatternDirection.Bullish,
      })
    );
  });

  it('finds a bear pennant as a converging consolidation after a drop', () => {
    const bars = flatBars();
    for (let k = 1; k <= 8; k++) bars.push([100 - 1.5 * k, 0.8]); // 旗杆跌到 88
    for (let k = 0; k < 8; k++) bars.push([88.5, 2 - 0.2 * k]); // 高点下降、低点上升

    const res = findFlagsAndPennants(toCandles(bars), [], 30);

    expect(res).toContainEqual(
      expect.objectContaining({
        patternType: PatternType.Pennant,
        direction: PatternDirection.Bearish,
      })
    );
  });

  it('does not call a widening consolidation a bear pennant', () => {
    const bars = flatBars();
    for (let k = 1; k <= 8; k++) bars.push([100 - 1.5 * k, 0.8]);
    for (let k = 0; k < 8; k++) bars.push([88.5, 0.6 + 0.2 * k]); // 高点上升、低点下降

    const res = findFlagsAndPennants(toCandles(bars), [], 30);

    expect(res.map(p => p.patternType)).not.toContain(PatternType.Pennant);
  });
});
