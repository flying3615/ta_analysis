import { describe, it, expect } from 'vitest';
import { calculateStrategyReturns } from '../src/strategy/RollingUpTrendStrategy.js';

const params = {
  symbol: 'T',
  initialShares: 1000,
  feePerTrade: 0,
  downPercent: 0.05,
  upPercent: 0.05,
  tradingRatio: 0.3,
  stopLossPercent: 0.2,
};

describe('RollingUp calculateStrategyReturns', () => {
  it('reports zero return when the price never moves and nothing trades', () => {
    const res = calculateStrategyReturns(new Array(30).fill(10), params);

    expect(res.totalTrades).toBe(0);
    expect(res.totalReturn).toBeCloseTo(0, 8);
    expect(res.returnRate).toBeCloseTo(0, 8);
  });

  it('counts the reserved cash as part of the initial investment', () => {
    const res = calculateStrategyReturns(new Array(30).fill(10), params);

    // 1000 股 × 10 + 预留现金 300 股 × 10
    expect(res.initialInvestment).toBeCloseTo(13000, 8);
  });
});
