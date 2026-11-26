import { describe, it, expect } from 'vitest';
import type { Candle } from '../src/types.js';
import type { Strategy } from '../src/analysis/backtest/Backtester.js';
import { Backtester } from '../src/analysis/backtest/Backtester.js';
import { runGridSearch } from '../src/analysis/backtest/GridSearch.js';

function candles(n: number): Candle[] {
  const t0 = Date.parse('2024-01-01T00:00:00Z');
  return Array.from({ length: n }, (_, i) => {
    const c = 100 + 5 * Math.sin(i / 7);
    return {
      symbol: 'T',
      open: c,
      high: c,
      low: c,
      close: c,
      volume: 1000,
      timestamp: new Date(t0 + i * 86400000),
    };
  });
}

/** 记录每次调用看到的K线数量；每 period 根K线做多一次、下一根平仓 */
function factory(seen: number[][]) {
  return (params: Record<string, any>): Strategy => {
    const lengths: number[] = [];
    seen.push(lengths);
    return {
      name: 'periodic',
      generateSignal(history, i) {
        lengths.push(history.length);
        if (params.period === 0) return null;
        if (i % params.period === 0)
          return { timestamp: history[i].timestamp, direction: 'long' };
        if (i % params.period === 1)
          return { timestamp: history[i].timestamp, direction: 'flat' };
        return null;
      },
    };
  };
}

const bt = () =>
  new Backtester({
    commissionPerTrade: 0,
    slippageBps: 0,
    initialCapital: 100000,
  });

describe('runGridSearch out-of-sample split', () => {
  it('tunes on the first part and evaluates the best params on the rest', async () => {
    const data = candles(300);
    const seen: number[][] = [];

    const out = await runGridSearch(
      data,
      { period: [5, 9] },
      factory(seen),
      bt(),
      { testRatio: 0.3 }
    );

    const split = Math.floor(300 * 0.7);
    // 调参运行只看到前 70% 的数据
    for (const run of out.runs) {
      expect(run.result.equity.length).toBeLessThanOrEqual(split);
    }
    const oos = out.summary.outOfSample?.bySharpe;
    expect(oos).toBeDefined();
    expect(oos!.params).toEqual(out.summary.bestBySharpe!.params);
    // 样本外交易全部发生在切分点之后
    for (const t of oos!.result.trades) {
      expect(t.entryIdx + split - 50).toBeGreaterThanOrEqual(split);
    }
  });

  it('does not pick a run without trades as best by drawdown', async () => {
    const seen: number[][] = [];
    const out = await runGridSearch(
      candles(200),
      { period: [0, 5] },
      factory(seen),
      bt()
    );

    expect(out.summary.bestByMaxDrawdown?.params.period).toBe(5);
  });
});
