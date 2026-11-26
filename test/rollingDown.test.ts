import { describe, it, expect } from 'vitest';
import { calculateShortStrategyReturns } from '../src/strategy/RollingDownTrendStrategy.js';

const params = {
  symbol: 'T',
  initialShortShares: 1000,
  feePerTrade: 0,
  upPercent: 0.05,
  downPercent: 0.1,
  tradingRatio: 0.3,
  stopLossPercent: 0.2,
};

describe('RollingDown calculateShortStrategyReturns', () => {
  // 第 1 天涨到 106 → 加空 300 股；之后一直停在 95（低于 106×0.9）
  const path = [100, 106, 95, 95, 95, 95, 95, 95];

  it('covers only the rolled tranche once, keeping the base short', () => {
    const res = calculateShortStrategyReturns(path, params);

    const covers = res.trades.filter(t => t.type === 'cover');
    expect(covers).toHaveLength(1);
    expect(covers[0].shares).toBe(300);
    expect(res.finalShortShares).toBe(1000);
  });

  it('never covers more shares than it holds', () => {
    const res = calculateShortStrategyReturns(path, params);

    for (const t of res.trades) {
      expect(t.newShortShares).toBeGreaterThanOrEqual(0);
    }
    const covered = res.trades
      .filter(t => t.type === 'cover' || t.type === 'stopLoss')
      .reduce((s, t) => s + t.shares, 0);
    const shorted = res.trades
      .filter(t => t.type === 'short')
      .reduce((s, t) => s + t.shares, 0);
    expect(covered).toBeLessThanOrEqual(1000 + shorted);
  });

  it('books the tranche profit against its short price', () => {
    const res = calculateShortStrategyReturns(path, params);

    // 1000×100 的底仓按 95 计价：盈利 5000；300 股 106→95：盈利 3300
    expect(res.totalReturn).toBeCloseTo(5000 + 3300, 6);
  });
});
