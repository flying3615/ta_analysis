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

/** 按 [close, high, low, volume] 生成K线 */
function fromRows(rows: [number, number, number, number][]): Candle[] {
  return rows.map(([close, high, low, volume], i) => ({
    symbol: 'T',
    open: close,
    high,
    low,
    close,
    volume,
    timestamp: new Date(i * 86400000),
  }));
}

describe('volume-price confirmation', () => {
  const falling = (volume: (i: number) => number) =>
    fromRows(
      Array.from({ length: 20 }, (_, i) => {
        const c = 100 - i * 0.5;
        return [c, c + 0.5, c - 0.5, volume(i)];
      })
    );

  it('confirms a falling price when volume expands', () => {
    const data = falling(i => 1000 + i * 100);
    expect(
      calculateAccumulationDistribution(data, 20).volumePriceConfirmation
    ).toBe(true);
  });

  it('does not confirm a falling price when volume dries up', () => {
    const data = falling(i => 3000 - i * 100);
    expect(
      calculateAccumulationDistribution(data, 20).volumePriceConfirmation
    ).toBe(false);
  });
});

describe('A/D divergence', () => {
  it('compares A/D at the same bars as the price lows', () => {
    const rows: [number, number, number, number][] = [];
    for (let i = 0; i < 5; i++) rows.push([100, 101, 99, 1000]); // 中性前置
    // 窗口 0-5：下跌，收在最低（派发）
    for (let i = 0; i <= 5; i++) {
      const c = 100 - i;
      rows.push([c, c + 1, c, 1000]);
    }
    // 窗口 6-9：反弹，收在最高（吸筹）
    for (let i = 1; i <= 4; i++) {
      const c = 95 + i * 0.75;
      rows.push([c, c, c - 1, 1000]);
    }
    // 窗口 10-14：价格跌到更低的 93，但收在高位（A/D 继续上升）
    for (let i = 1; i <= 5; i++) {
      const c = 98 - i;
      rows.push([c, c + 0.1, c - 1, 1000]);
    }
    // 窗口 15-19：反弹
    for (let i = 1; i <= 5; i++) {
      const c = 93 + i * 0.8;
      rows.push([c, c, c - 1, 1000]);
    }

    const res = calculateAccumulationDistribution(fromRows(rows), 20);

    expect(res.divergence.type).toBe('bullish');
  });
});
