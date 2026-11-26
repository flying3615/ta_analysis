import { describe, it, expect } from 'vitest';
import type { Candle } from '../src/types.js';
import { findTriangles } from '../src/analysis/basic/patterns/findTriangles.js';
import {
  PatternType,
  type PeakValley,
} from '../src/analysis/basic/patterns/analyzeMultiTimeframePatterns.js';

const t0 = Date.parse('2024-01-01T00:00:00Z');

function flat(n: number, price: number): Candle[] {
  return Array.from({ length: n }, (_, i) => ({
    symbol: 'T',
    open: price,
    high: price + 0.3,
    low: price - 0.3,
    close: price,
    volume: 1000,
    timestamp: new Date(t0 + i * 86400000),
  }));
}

const pv = (
  data: Candle[],
  index: number,
  price: number,
  type: 'peak' | 'valley'
): PeakValley => ({ index, price, date: data[index].timestamp, type });

describe('findTriangles', () => {
  it('still checks the symmetrical triangle when the ascending one is too shallow', () => {
    const data = flat(40, 98.5);
    // 高点 100 → 97.8（相差 2.2%，算"水平"也算"下降"），低点 97 → 97.5（上升）
    // 上升三角形高度 = (100+97.8)/2 − 97 = 1.9（< 2%，不显著）
    // 对称三角形高度 = 100 − 97 = 3（> 2%，显著）
    const points = [
      pv(data, 15, 100, 'peak'),
      pv(data, 20, 97, 'valley'),
      pv(data, 27, 97.8, 'peak'),
      pv(data, 32, 97.5, 'valley'),
    ];

    const types = findTriangles(data, points, 30).map(p => p.patternType);

    expect(types).not.toContain(PatternType.AscendingTriangle);
    expect(types).toContain(PatternType.SymmetricalTriangle);
  });
});
