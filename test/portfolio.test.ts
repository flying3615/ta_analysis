import { describe, it, expect } from 'vitest';
import type { Candle } from '../src/types.js';
import type { Signal, Strategy } from '../src/analysis/backtest/Backtester.js';
import {
  computeRMetrics,
  runPortfolioBacktest,
  type SymbolTrade,
} from '../src/analysis/backtest/Portfolio.js';

const t0 = Date.parse('2024-01-01T00:00:00Z');
const DAY = 86400000;

function trade(
  r: number | undefined,
  exitDay: number,
  holdingBars = 5
): SymbolTrade {
  return {
    symbol: 'T',
    entryIdx: 0,
    exitIdx: holdingBars,
    entryDate: new Date(t0 + (exitDay - holdingBars) * DAY),
    exitDate: new Date(t0 + exitDay * DAY),
    holdingBars,
    direction: 'long',
    entryPrice: 100,
    exitPrice: 100,
    qty: 1,
    pnl: r ?? 0,
    netPnl: r ?? 0,
    riskPerShare: r === undefined ? undefined : 1,
    rMultiple: r,
  };
}

describe('computeRMetrics', () => {
  // 按出场日期排序后 R 为 2, −1, −1, 3, −1
  const trades = [
    trade(3, 4),
    trade(2, 1),
    trade(-1, 2),
    trade(-1, 3),
    trade(-1, 5),
  ];

  it('summarizes R multiples', () => {
    const m = computeRMetrics(trades);
    expect(m.tradeCount).toBe(5);
    expect(m.rTradeCount).toBe(5);
    expect(m.winRate).toBeCloseTo(0.4, 12);
    expect(m.avgR).toBeCloseTo(0.4, 12);
    expect(m.medianR).toBe(-1);
    expect(m.totalR).toBeCloseTo(2, 12);
    expect(m.profitFactor).toBeCloseTo(5 / 3, 12);
    expect(m.avgHoldingBars).toBe(5);
  });

  it('counts the longest losing streak in exit order', () => {
    expect(computeRMetrics(trades).maxConsecutiveLosses).toBe(2);
  });

  it('measures the drawdown of the cumulative R curve in exit order', () => {
    // 累计 R：2, 1, 0, 3, 2 → 从 2 回落到 0，回撤 2R
    expect(computeRMetrics(trades).maxDrawdownR).toBeCloseTo(2, 12);
  });

  it('ignores trades without a risk unit in the R statistics', () => {
    const m = computeRMetrics([...trades, trade(undefined, 6)]);
    expect(m.tradeCount).toBe(6);
    expect(m.rTradeCount).toBe(5);
    expect(m.avgR).toBeCloseTo(0.4, 12);
  });

  it('reports an infinite profit factor when nothing lost', () => {
    expect(computeRMetrics([trade(1, 1), trade(2, 2)]).profitFactor).toBe(
      Infinity
    );
  });

  it('returns zeros for no trades', () => {
    const m = computeRMetrics([]);
    expect(m.tradeCount).toBe(0);
    expect(m.avgR).toBe(0);
    expect(m.maxDrawdownR).toBe(0);
  });
});

function flat(symbol: string, n: number, price = 100): Candle[] {
  return Array.from({ length: n }, (_, i) => ({
    symbol,
    open: price,
    high: price,
    low: price,
    close: price,
    volume: 1000,
    timestamp: new Date(t0 + i * DAY),
  }));
}

/** 在指定下标做多、若干根后平仓；风险单位 1 */
function every(longAt: number[], holdBars: number): () => Strategy {
  return () => ({
    name: 'scripted',
    generateSignal(history, i, position): Signal | null {
      if (position && i - position.entryIdx >= holdBars - 1)
        return { timestamp: history[i].timestamp, direction: 'flat' };
      if (!position && longAt.includes(i))
        return {
          timestamp: history[i].timestamp,
          direction: 'long',
          riskPerShare: 1,
        };
      return null;
    },
  });
}

describe('runPortfolioBacktest', () => {
  const config = { commissionPerTrade: 0, slippageBps: 0, warmupBars: 10 };

  it('runs each symbol independently and tags trades with the symbol', async () => {
    const res = await runPortfolioBacktest(
      { AAA: flat('AAA', 60), BBB: flat('BBB', 60) },
      every([20, 40], 5),
      config
    );

    expect(res.trades.map(t => t.symbol).sort()).toEqual([
      'AAA',
      'AAA',
      'BBB',
      'BBB',
    ]);
    expect(res.bySymbol.AAA.tradeCount).toBe(2);
    expect(res.bySymbol.BBB.bars).toBe(60);
    expect(res.overall.tradeCount).toBe(4);
  });

  it('creates a fresh strategy for each symbol', async () => {
    const made: string[] = [];
    await runPortfolioBacktest(
      { AAA: flat('AAA', 30), BBB: flat('BBB', 30) },
      symbol => {
        made.push(symbol);
        return every([], 1)();
      },
      config
    );
    expect(made.sort()).toEqual(['AAA', 'BBB']);
  });

  it('skips symbols with too little history', async () => {
    const res = await runPortfolioBacktest(
      { AAA: flat('AAA', 60), TINY: flat('TINY', 5) },
      every([20], 5),
      config
    );
    expect(res.skipped).toEqual([
      { symbol: 'TINY', reason: expect.stringContaining('5') },
    ]);
    expect(Object.keys(res.bySymbol)).toEqual(['AAA']);
  });

  it('splits in-sample and out-of-sample results by entry date', async () => {
    const res = await runPortfolioBacktest(
      { AAA: flat('AAA', 60) },
      every([20, 40], 5),
      { ...config, splitDate: new Date(t0 + 30 * DAY) }
    );
    expect(res.inSample?.tradeCount).toBe(1);
    expect(res.outOfSample?.tradeCount).toBe(1);
  });
});
