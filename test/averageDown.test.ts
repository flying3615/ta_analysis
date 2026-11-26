import { describe, it, expect } from 'vitest';
import { simulateStockTrading } from '../src/strategy/AverageDownStrategy.js';

const state = {
  initialShares: 100,
  initialPrice: 30,
  currentPrice: 15,
  feePerTrade: 3,
  downPercent: 0.1,
  upPercent: 0.1,
  tradingRatio: 1 / 3,
  maxCycles: 1, // 第一轮价格是确定的（随机波动只影响后续轮次）
  volatility: 0.1,
};

describe('AverageDown simulateStockTrading', () => {
  it('reports the diluted (breakeven) cost per share', () => {
    const res = simulateStockTrading(state);

    // 买 33 股 @13.5（+3 手续费），卖 33 股 @14.85（−3 手续费）→ 净回收 38.55
    // 摊薄成本 = (3000 − 38.55) / 100
    expect(res.finalState.cashBalance).toBeCloseTo(38.55, 6);
    expect(res.finalState.finalAvgCost).toBeCloseTo(29.6145, 6);
    expect(res.finalState.breakEvenPrice).toBeCloseTo(29.6145, 6);
    expect(res.finalState.costReductionPercent).toBeCloseTo(1.285, 3);
  });

  it('keeps diluted cost consistent with net cash after several cycles', () => {
    const res = simulateStockTrading({ ...state, maxCycles: 5 });
    const { finalShares, finalAvgCost, cashBalance } = res.finalState;

    expect(finalAvgCost * finalShares).toBeCloseTo(3000 - cashBalance, 6);
  });
});
