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

describe('RollingUp stop-loss handling', () => {
  const p = {
    ...params,
    downPercent: 0.03,
    upPercent: 0.05,
    stopLossPercent: 0.2,
  };

  it('does not dip-buy and get stopped out again while price keeps falling after a stop', () => {
    // 第 1 天跌破 80 止损；之后继续下跌
    const res = calculateStrategyReturns([100, 79, 75, 70, 66, 62, 58], p);

    expect(res.stopLossCount).toBe(1);
    expect(res.trades.filter(t => t.type === 'buy')).toHaveLength(0);
  });

  it('re-buys once price recovers 10% above the stop price, even days later', () => {
    // 止损在 79，之后先跌到 75，几天后回升到 88（≥ 79 × 1.1）
    const res = calculateStrategyReturns([100, 79, 75, 76, 80, 88, 88], p);

    expect(res.trades.map(t => t.type)).toEqual(['stopLoss', 'reBuy']);
  });

  it('keeps the average cost a number after the whole position is sold', () => {
    // 止损 → 回补全部 → 上涨 5% 全部卖出
    const res = calculateStrategyReturns([100, 79, 88, 93], p);

    expect(res.finalShares).toBe(0);
    expect(res.finalAvgCost).toBe(0);
    for (const t of res.trades) expect(Number.isNaN(t.newAvgCost)).toBe(false);
  });
});
