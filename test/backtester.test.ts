import { describe, it, expect } from 'vitest';
import type { Candle } from '../src/types.js';
import {
  inferPeriodsPerYear,
  Backtester,
  type Signal,
  type Strategy,
} from '../src/analysis/backtest/Backtester.js';

function candlesFromCloses(closes: number[]): Candle[] {
  const t0 = new Date('2024-01-01T00:00:00Z').getTime();
  return closes.map((c, i) => ({
    symbol: 'T',
    open: c,
    high: c,
    low: c,
    close: c,
    volume: 1000,
    timestamp: new Date(t0 + i * 86400000),
  }));
}

/** 按 K 线下标返回预设信号的脚本化策略 */
function scripted(
  signals: Record<number, Partial<Signal> & Pick<Signal, 'direction'>>
): Strategy {
  return {
    name: 'scripted',
    generateSignal: (history, i) => {
      const s = signals[i];
      if (!s) return null;
      return { timestamp: history[i].timestamp, ...s };
    },
  };
}

const noFrictions = {
  initialCapital: 100000,
  positionSizing: 0.2,
  commissionPerTrade: 0,
  slippageBps: 0,
};

describe('Backtester accounting', () => {
  it('reports no drawdown and no PnL for a zero-PnL round trip', async () => {
    const candles = candlesFromCloses(new Array(70).fill(100));
    const strat = scripted({
      52: { direction: 'long' },
      60: { direction: 'flat' },
    });

    const res = await new Backtester(noFrictions).run(candles, strat);

    expect(res.metrics.tradeCount).toBe(1);
    expect(res.trades[0].pnl).toBeCloseTo(0, 8);
    expect(res.totalPnL).toBeCloseTo(0, 8);
    expect(res.metrics.maxDrawdown).toBeCloseTo(0, 8);
    for (const v of res.equity) expect(v).toBeCloseTo(100000, 6);
  });

  it('marks a short position at its unrealised PnL', async () => {
    const closes = new Array(70).fill(100);
    for (let i = 56; i < 70; i++) closes[i] = 90;
    const candles = candlesFromCloses(closes);
    const strat = scripted({ 52: { direction: 'short' } });

    const res = await new Backtester(noFrictions).run(candles, strat);

    // qty = 100000*0.2/100 = 200，价格下跌 10 → 盈利 2000
    expect(res.totalPnL).toBeCloseTo(2000, 6);
    expect(Math.max(...res.equity)).toBeCloseTo(102000, 6);
    expect(res.metrics.maxDrawdown).toBeCloseTo(0, 8);
  });

  it('includes an exit on the last loop iteration in totalPnL', async () => {
    const closes = new Array(70).fill(100);
    for (let i = 60; i < 70; i++) closes[i] = 110;
    const candles = candlesFromCloses(closes);
    // 循环最后一轮是 i = 68，平仓成交在 69 的开盘价
    const strat = scripted({
      52: { direction: 'long' },
      68: { direction: 'flat' },
    });

    const res = await new Backtester(noFrictions).run(candles, strat);

    expect(res.trades).toHaveLength(1);
    expect(res.trades[0].pnl).toBeCloseTo(2000, 6);
    expect(res.totalPnL).toBeCloseTo(2000, 6);
    expect(res.equity[res.equity.length - 1]).toBeCloseTo(102000, 6);
  });

  it('records the real entry index of each trade', async () => {
    const candles = candlesFromCloses(new Array(70).fill(100));
    const strat = scripted({
      55: { direction: 'long' },
      58: { direction: 'flat' },
      61: { direction: 'long' },
      64: { direction: 'flat' },
    });

    const res = await new Backtester(noFrictions).run(candles, strat);

    expect(res.trades.map(t => [t.entryIdx, t.exitIdx])).toEqual([
      [56, 59],
      [62, 65],
    ]);
  });

  it('exits on the stop supplied by the signal', async () => {
    const closes = new Array(70).fill(100);
    closes[58] = 94;
    for (let i = 59; i < 70; i++) closes[i] = 94;
    const candles = candlesFromCloses(closes);
    const strat = scripted({ 52: { direction: 'long', stop: 95 } });

    const res = await new Backtester(noFrictions).run(candles, strat);

    expect(res.trades).toHaveLength(1);
    expect(res.trades[0].exitIdx).toBe(59);
  });

  it('exits on the first target supplied by the signal', async () => {
    const closes = new Array(70).fill(100);
    for (let i = 58; i < 70; i++) closes[i] = 106;
    const candles = candlesFromCloses(closes);
    const strat = scripted({ 52: { direction: 'long', targets: [105, 110] } });

    const res = await new Backtester(noFrictions).run(candles, strat);

    expect(res.trades).toHaveLength(1);
    expect(res.trades[0].exitIdx).toBe(59);
  });

  it('does not stop out on a bar that only rises (trailing stop uses the prior peak)', async () => {
    const candles = candlesFromCloses(new Array(70).fill(100));
    // 第 55 根：开 100、低 100、高 108、收 108（只上涨）
    candles[55] = {
      ...candles[55],
      open: 100,
      low: 100,
      high: 108,
      close: 108,
    };
    for (let i = 56; i < 70; i++)
      candles[i] = {
        ...candles[i],
        open: 108,
        high: 108,
        low: 108,
        close: 108,
      };
    const strat = scripted({ 52: { direction: 'long' } });

    const res = await new Backtester({
      ...noFrictions,
      exitParams: { trailingStopPercent: 7 },
    }).run(candles, strat);

    // 不应在第 55 根触发止损；持仓到最后清算
    expect(res.trades).toHaveLength(1);
    expect(res.trades[0].exitIdx).toBe(69);
  });

  it('stops out when a later bar falls through the trailed level', async () => {
    const closes = new Array(70).fill(100);
    const candles = candlesFromCloses(closes);
    candles[55] = {
      ...candles[55],
      open: 100,
      low: 100,
      high: 110,
      close: 110,
    };
    // 第 57 根跌到 101，低于 110 × 0.93 = 102.3
    candles[56] = {
      ...candles[56],
      open: 110,
      low: 109,
      high: 110,
      close: 109,
    };
    candles[57] = {
      ...candles[57],
      open: 105,
      low: 101,
      high: 105,
      close: 101,
    };
    for (let i = 58; i < 70; i++)
      candles[i] = {
        ...candles[i],
        open: 101,
        high: 101,
        low: 101,
        close: 101,
      };
    const strat = scripted({ 52: { direction: 'long' } });

    const res = await new Backtester({
      ...noFrictions,
      exitParams: { trailingStopPercent: 7 },
    }).run(candles, strat);

    expect(res.trades[0].exitIdx).toBe(58);
  });
});

describe('Backtester Sharpe annualization', () => {
  /** 同一组收盘价，按给定的时间间隔生成K线 */
  function series(stepMs: number): Candle[] {
    const closes = Array.from(
      { length: 120 },
      (_, i) => 100 + i * 0.3 + (i % 5) * 0.8
    );
    const t0 = Date.parse('2024-01-01T00:00:00Z');
    return closes.map((c, i) => ({
      symbol: 'T',
      open: c,
      high: c,
      low: c,
      close: c,
      volume: 1000,
      timestamp: new Date(t0 + i * stepMs),
    }));
  }
  const strat = scripted({ 52: { direction: 'long' } });

  it('annualizes weekly bars with 52 periods per year', async () => {
    const daily = await new Backtester(noFrictions).run(
      series(86400000),
      strat
    );
    const weekly = await new Backtester(noFrictions).run(
      series(7 * 86400000),
      strat
    );

    expect(daily.metrics.sharpe).not.toBe(0);
    // 连续日历日（含周末）的日线按 365 天年化
    expect(weekly.metrics.sharpe / daily.metrics.sharpe).toBeCloseTo(
      Math.sqrt(52 / 365),
      6
    );
  });

  it('uses periodsPerYear when it is given', async () => {
    const auto = await new Backtester(noFrictions).run(series(86400000), strat);
    const manual = await new Backtester({
      ...noFrictions,
      periodsPerYear: 252,
    }).run(series(86400000), strat);

    expect(manual.metrics.sharpe / auto.metrics.sharpe).toBeCloseTo(
      Math.sqrt(252 / 365),
      6
    );
  });
});

describe('inferPeriodsPerYear', () => {
  const at = (iso: string) => ({
    symbol: 'T',
    open: 1,
    high: 1,
    low: 1,
    close: 1,
    volume: 1,
    timestamp: new Date(iso),
  });

  it('counts 7 hourly bars per trading day for stocks', () => {
    const bars = [];
    for (const day of ['02', '03', '04']) {
      for (let h = 14; h <= 20; h++)
        bars.push(at(`2024-01-${day}T${h}:30:00Z`));
    }
    expect(inferPeriodsPerYear(bars)).toBe(252 * 7);
  });

  it('counts 24 hourly bars per day, every day, for crypto', () => {
    const t0 = Date.parse('2024-01-01T00:00:00Z');
    // 8 天（含周末）的连续小时线
    const bars = Array.from({ length: 8 * 24 }, (_, i) =>
      at(new Date(t0 + i * 3600000).toISOString())
    );
    expect(inferPeriodsPerYear(bars)).toBe(365 * 24);
  });

  it('uses 365 trading days for daily bars that include weekends', () => {
    const t0 = Date.parse('2024-01-01T00:00:00Z');
    const bars = Array.from({ length: 30 }, (_, i) =>
      at(new Date(t0 + i * 86400000).toISOString())
    );
    expect(inferPeriodsPerYear(bars)).toBe(365);
  });
});
