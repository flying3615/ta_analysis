import { describe, it, expect } from 'vitest';
import type { Candle } from '../src/types.js';
import {
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
