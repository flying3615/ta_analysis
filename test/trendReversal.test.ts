import { describe, it, expect, afterEach } from 'vitest';
import type { Candle } from '../src/types.js';
import {
  calculateMeasuredMoveTargets,
  determineTrendDirection,
} from '../src/analysis/analyzer/trendReversal/multiTimeFrameTrendReversal.js';
import { hasTrendReversalSignal } from '../src/analysis/analyzer/trendReversal/trendReversalChecker.js';
import {
  trendReversalConfig,
  updateTrendReversalConfig,
} from '../src/analysis/analyzer/trendReversal/trendReversalConfig.js';

function line(n: number, start: number, step: number): Candle[] {
  return Array.from({ length: n }, (_, i) => {
    const c = start + step * i;
    return {
      symbol: 'T',
      open: c,
      high: c * 1.001,
      low: c * 0.999,
      close: c,
      volume: 1000,
      timestamp: new Date(i * 86400000),
    };
  });
}

describe('determineTrendDirection', () => {
  it('treats a 0.01%-per-bar drift on a $200 stock as sideways', () => {
    expect(determineTrendDirection(line(40, 200, 0.02))).toBe(0);
  });

  it('treats a 1%-per-bar rise on a $0.05 asset as an up trend', () => {
    expect(determineTrendDirection(line(40, 0.05, 0.0005))).toBe(1);
  });
});

describe('calculateMeasuredMoveTargets', () => {
  const original = trendReversalConfig.targets.fibExtension;
  afterEach(() =>
    updateTrendReversalConfig({ targets: { fibExtension: original } })
  );

  it('uses the configured Fibonacci extension for target 3', () => {
    // 先涨到 120 的高点，再跌到 100 的低点，最后几根回升
    const closes = [
      ...Array.from({ length: 10 }, (_, i) => 110 + i),
      ...Array.from({ length: 20 }, (_, i) => 119 - i),
      ...Array.from({ length: 10 }, (_, i) => 101 + i * 0.5),
    ];
    const data: Candle[] = closes.map((c, i) => ({
      symbol: 'T',
      open: c,
      high: c + 1,
      low: c - 1,
      close: c,
      volume: 1000,
      timestamp: new Date(i * 86400000),
    }));
    updateTrendReversalConfig({ targets: { fibExtension: 2 } });

    const t = calculateMeasuredMoveTargets(data, 10, 1, 105, 99);

    // 回看区间内：前高 120，之后的低点 99 → 量度 21
    expect(t.target3).toBeCloseTo(99 + 21 * 2, 6);
  });
});

describe('hasTrendReversalSignal', () => {
  it('always returns allSignals as an array', () => {
    const res = hasTrendReversalSignal(line(60, 100, 0.1), line(60, 100, 0.5));
    expect(Array.isArray((res as any).allSignals)).toBe(true);
  });
});
