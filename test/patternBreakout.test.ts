import { describe, it, expect } from 'vitest';
import type { Candle } from '../src/types.js';
import { findDoubleTopsAndBottoms } from '../src/analysis/basic/patterns/findDoubleTopsAndBottoms.js';
import {
  PatternStatus,
  PatternType,
  type PeakValley,
} from '../src/analysis/basic/patterns/analyzeMultiTimeframePatterns.js';
import { isPatternFailed } from '../src/analysis/basic/patterns/patternConfig.js';

const t0 = new Date('2024-01-01T00:00:00Z').getTime();

function candlesFromCloses(closes: number[]): Candle[] {
  return closes.map((c, i) => ({
    symbol: 'T',
    open: c,
    high: c + 0.5,
    low: c - 0.5,
    close: c,
    volume: 1000,
    timestamp: new Date(t0 + i * 86400000),
  }));
}

function point(
  data: Candle[],
  index: number,
  price: number,
  type: 'peak' | 'valley'
): PeakValley {
  return { index, price, date: data[index].timestamp, type };
}

/**
 * 双顶：峰在 10 和 22（110），中间谷在 16（颈线 100）。
 * 第 28 根K线起收盘价跌到 95，并一直保持在颈线下方。
 */
function doubleTopBrokenDown(): { data: Candle[]; points: PeakValley[] } {
  const closes: number[] = [];
  for (let i = 0; i < 40; i++) {
    if (i <= 10) closes.push(100 + i);
    else if (i <= 16) closes.push(110 - ((i - 10) * 10) / 6);
    else if (i <= 22) closes.push(100 + ((i - 16) * 10) / 6);
    else if (i < 28) closes.push(110 - (i - 22) * 2);
    else closes.push(95);
  }
  const data = candlesFromCloses(closes);
  const points = [
    point(data, 10, 110, 'peak'),
    point(data, 16, 100, 'valley'),
    point(data, 22, 110, 'peak'),
  ];
  return { data, points };
}

describe('pattern breakout confirmation', () => {
  it('confirms a double top whose neckline broke several bars ago', () => {
    const { data, points } = doubleTopBrokenDown();

    const patterns = findDoubleTopsAndBottoms(data, points, 40);
    const doubleTop = patterns.find(
      p => p.patternType === PatternType.DoubleTop
    );

    expect(doubleTop?.status).toBe(PatternStatus.Confirmed);
  });

  it('does not confirm a breakout that happened on the last bar only', () => {
    const { data, points } = doubleTopBrokenDown();
    // 让颈线只在最后一根K线被跌破
    const closes = data.map((c, i) => (i >= 28 && i < 39 ? 101 : c.close));
    const lastOnly = candlesFromCloses(closes);

    const patterns = findDoubleTopsAndBottoms(lastOnly, points, 40);
    const doubleTop = patterns.find(
      p => p.patternType === PatternType.DoubleTop
    );

    expect(doubleTop?.status).toBe(PatternStatus.Completed);
  });
});

describe('isPatternFailed', () => {
  it('reports failure when a bar after an upward breakout sits fully below the level', () => {
    // 形态在 4 结束，5 起向上突破 100，第 8 根K线整根回到 100 下方
    const closes = [95, 96, 97, 98, 99, 103, 104, 105, 97, 104];
    const data = candlesFromCloses(closes);

    expect(isPatternFailed(data, 4, 100, true)).toBe(true);
  });

  it('does not report failure while price stays above the level', () => {
    const closes = [95, 96, 97, 98, 99, 103, 104, 105, 106, 104];
    const data = candlesFromCloses(closes);

    expect(isPatternFailed(data, 4, 100, true)).toBe(false);
  });

  it('ignores bars before the breakout', () => {
    // 突破之前价格在水平下方是正常的，不算失败
    const closes = [95, 96, 97, 98, 99, 97, 98, 103, 104, 105];
    const data = candlesFromCloses(closes);

    expect(isPatternFailed(data, 4, 100, true)).toBe(false);
  });
});
