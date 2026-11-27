import { describe, it, expect } from 'vitest';
import type { Candle } from '../src/types.js';
import type { SymbolTrade } from '../src/analysis/backtest/Portfolio.js';
import type { BreakoutFilter } from '../src/analysis/backtest/donchianFilters.js';
import { splitTradesByFilter } from '../src/analysis/backtest/filterComparison.js';

const t0 = Date.parse('2024-01-01T00:00:00Z');
const DAY = 86400000;

const data: Record<string, Candle[]> = {
  A: Array.from({ length: 100 }, (_, i) => ({
    symbol: 'A',
    open: 100,
    high: 101,
    low: 99,
    close: 100,
    volume: 1000,
    timestamp: new Date(t0 + i * DAY),
  })),
};

function trade(signalIdx: number, r: number): SymbolTrade {
  return {
    symbol: 'A',
    signalIdx,
    entryIdx: signalIdx + 1,
    exitIdx: signalIdx + 5,
    entryDate: new Date(t0 + (signalIdx + 1) * DAY),
    exitDate: new Date(t0 + (signalIdx + 5) * DAY),
    holdingBars: 4,
    direction: 'long',
    entryPrice: 100,
    exitPrice: 100,
    qty: 1,
    pnl: r,
    netPnl: r,
    riskPerShare: 1,
    rMultiple: r,
  };
}

/** 信号日下标为偶数时通过，为 9 时无法判断；同时记录看到的K线数量 */
function evenFilter(seen: number[] = []): BreakoutFilter {
  return {
    name: 'volume',
    label: '测试',
    evaluate(history, i) {
      seen.push(history.length - 1 - i);
      if (i === 9) return 'undecided';
      return i % 2 === 0 ? 'pass' : 'fail';
    },
  };
}

// 通过组：R = 2, 0（信号日 10、20）；不通过组：R = −1, −1, 1（信号日 11、21、31）
const trades = [
  trade(10, 2),
  trade(20, 0),
  trade(11, -1),
  trade(21, -1),
  trade(31, 1),
];

describe('splitTradesByFilter', () => {
  it('splits the baseline trades by the verdict on their signal bar', () => {
    const { all } = splitTradesByFilter(trades, data, evenFilter());
    expect(all.pass.count).toBe(2);
    expect(all.fail.count).toBe(3);
    expect(all.pass.avgR).toBeCloseTo(1, 12);
    expect(all.fail.avgR).toBeCloseTo(-1 / 3, 12);
    expect(all.keptFraction).toBeCloseTo(0.4, 12);
  });

  it('reports the difference with a Welch standard error and t value', () => {
    const { all } = splitTradesByFilter(trades, data, evenFilter());
    // 样本方差：通过组 2，不通过组 4/3 → SE = √(2/2 + (4/3)/3) = √(13/9)
    const se = Math.sqrt(13 / 9);
    expect(all.diffR).toBeCloseTo(4 / 3, 12);
    expect(all.se).toBeCloseTo(se, 12);
    expect(all.t).toBeCloseTo(4 / 3 / se, 12);
  });

  it('gives the filter only the bars up to the signal bar', () => {
    const seen: number[] = [];
    splitTradesByFilter(trades, data, evenFilter(seen));
    expect(new Set(seen)).toEqual(new Set([0]));
  });

  it('puts undecided trades in the pass group and counts them', () => {
    const { all } = splitTradesByFilter(
      [...trades, trade(9, 3)],
      data,
      evenFilter()
    );
    expect(all.pass.count).toBe(3);
    expect(all.undecided).toBe(1);
  });

  it('splits in-sample and out-of-sample by entry date', () => {
    const res = splitTradesByFilter(
      trades,
      data,
      evenFilter(),
      new Date(t0 + 15 * DAY)
    );
    expect(res.inSample?.pass.count).toBe(1); // 信号日 10
    expect(res.inSample?.fail.count).toBe(1); // 信号日 11
    expect(res.outOfSample?.pass.count).toBe(1);
    expect(res.outOfSample?.fail.count).toBe(2);
  });

  it('leaves t undefined when a group has fewer than two trades', () => {
    const { all } = splitTradesByFilter(
      [trade(10, 1), trade(11, -1)],
      data,
      evenFilter()
    );
    expect(all.t).toBeUndefined();
  });
});
