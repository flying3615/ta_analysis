import { describe, it, expect } from 'vitest';
import type { Candle } from '../src/types.js';
import { PatternType } from '../src/analysis/basic/patterns/analyzeMultiTimeframePatterns.js';
import { findRoundingPatterns } from '../src/analysis/basic/patterns/findRoundingPatterns.js';

function parabola(sign: 1 | -1): Candle[] {
  const t0 = Date.parse('2024-01-01T00:00:00Z');
  return Array.from({ length: 60 }, (_, i) => {
    const c = 100 + sign * 0.02 * (i - 30) ** 2;
    return {
      symbol: 'T',
      open: c,
      high: c + 0.5,
      low: c - 0.5,
      close: c,
      volume: 1000,
      timestamp: new Date(t0 + i * 86400000),
    };
  });
}

describe('findRoundingPatterns', () => {
  it('reports the rounding bottom low at the actual lowest bar', () => {
    const data = parabola(1);
    const bottom = findRoundingPatterns(data, [], 60).find(
      p => p.patternType === PatternType.RoundingBottom
    );
    expect(bottom).toBeDefined();
    const low = bottom!.component.keyPoints.find(p => p.type === 'valley')!;
    expect(low.index).toBe(30);
    expect(low.price).toBe(data[30].low);
  });

  it('reports the rounding top high at the actual highest bar', () => {
    const data = parabola(-1);
    const top = findRoundingPatterns(data, [], 60).find(
      p => p.patternType === PatternType.RoundingTop
    );
    expect(top).toBeDefined();
    const high = top!.component.keyPoints.find(p => p.type === 'peak')!;
    expect(high.index).toBe(30);
    expect(high.price).toBe(data[30].high);
  });
});
