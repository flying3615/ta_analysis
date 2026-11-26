import { describe, it, expect } from 'vitest';
import type { Candle } from '../src/types.js';
import { analyzeAllPatterns } from '../src/analysis/basic/patterns/analyzeMultiTimeframePatterns.js';

/** 低波动序列（平均日变化 < 1%），会触发动态窗口放大 */
function lowVolatility(n: number): Candle[] {
  const t0 = new Date('2024-01-01T00:00:00Z').getTime();
  return Array.from({ length: n }, (_, i) => {
    const c = 100 + Math.sin(i / 2) * 0.4;
    return {
      symbol: 'T',
      open: c,
      high: c + 0.2,
      low: c - 0.2,
      close: c,
      volume: 1000,
      timestamp: new Date(t0 + i * 86400000),
    };
  });
}

describe('analyzeAllPatterns on short low-volatility series', () => {
  it.each([11, 13, 14, 15, 21, 27])('does not throw for %i candles', n => {
    expect(() => analyzeAllPatterns(lowVolatility(n), 'weekly')).not.toThrow();
  });
});
