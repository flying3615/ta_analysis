import { describe, it, expect } from 'vitest';
import type { Candle } from '../src/types.js';
import {
  calculateATR,
  calculateATRSeries,
  calculateMoneyFlowIndex,
  calculateStandardRSI,
} from '../src/util/taUtil.js';

const flatCandles = (n: number): Candle[] =>
  Array.from({ length: n }, (_, i) => ({
    symbol: 'T',
    open: 100,
    high: 100,
    low: 100,
    close: 100,
    volume: 1000,
    timestamp: new Date(i * 86400000),
  }));

describe('oscillators on flat prices', () => {
  it('RSI is neutral (50) when price never moves', () => {
    expect(calculateStandardRSI(new Array(30).fill(100), 14)).toBe(50);
  });

  it('RSI is 100 when price only rises', () => {
    const rising = Array.from({ length: 30 }, (_, i) => 100 + i);
    expect(calculateStandardRSI(rising, 14)).toBe(100);
  });

  it('MFI is neutral (50) when typical price never moves', () => {
    expect(calculateMoneyFlowIndex(flatCandles(30), 14)).toBe(50);
  });
});

describe('ATR', () => {
  // 振幅先小后大，简单平均和 Wilder 平滑会给出不同结果
  const candles: Candle[] = Array.from({ length: 40 }, (_, i) => {
    const r = i < 30 ? 1 : 4;
    return {
      symbol: 'T',
      open: 100,
      high: 100 + r,
      low: 100 - r,
      close: 100,
      volume: 1000,
      timestamp: new Date(i * 86400000),
    };
  });

  it('calculateATR equals the last value of the Wilder ATR series', () => {
    const series = calculateATRSeries(candles, 14);
    expect(calculateATR(candles, 14)).toBeCloseTo(
      series[series.length - 1],
      10
    );
  });

  it('returns 0 / an empty series for fewer than two candles', () => {
    expect(calculateATR(candles.slice(0, 1), 14)).toBe(0);
    expect(calculateATRSeries(candles.slice(0, 1), 14)).toEqual([]);
  });
});
