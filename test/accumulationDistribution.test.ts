import { describe, it, expect } from 'vitest';
import type { Candle } from '../src/types.js';
import { calculateAccumulationDistribution } from '../src/util/accumulationDistribution.js';
import { PatternDirection } from '../src/analysis/basic/patterns/analyzeMultiTimeframePatterns.js';

/** closePos: 收盘价在当根振幅中的位置，0 = 最低，1 = 最高 */
function bars(n: number, closePos: number, start = 0): Candle[] {
  return Array.from({ length: n }, (_, k) => {
    const i = start + k;
    const low = 99 + (i % 3) * 0.1;
    const high = low + 2;
    return {
      symbol: 'T',
      open: low + 1,
      high,
      low,
      close: low + 2 * closePos,
      volume: 1000,
      timestamp: new Date(i * 86400000),
    };
  });
}

describe('A/D trend', () => {
  // 最近 20 根K线：收盘偏高（温和吸筹）
  const recent = (start: number) => bars(20, 0.7, start);

  it('does not depend on how much earlier history is included', () => {
    const afterAccumulation = [...bars(1000, 1), ...recent(1000)];
    const afterDistribution = [...bars(1000, 0), ...recent(1000)];

    const a = calculateAccumulationDistribution(afterAccumulation, 20).adTrend;
    const b = calculateAccumulationDistribution(afterDistribution, 20).adTrend;

    expect(a).toBe(PatternDirection.Bullish);
    expect(b).toBe(PatternDirection.Bullish);
  });

  it('is neutral when closes sit in the middle of each bar', () => {
    const data = [...bars(100, 1), ...bars(20, 0.5, 100)];
    expect(calculateAccumulationDistribution(data, 20).adTrend).toBe(
      PatternDirection.Neutral
    );
  });
});
