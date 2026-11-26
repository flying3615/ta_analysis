import { describe, it, expect } from 'vitest';
import type { Candle } from '../src/types.js';
import {
  Backtester,
  type PositionContext,
  type Signal,
  type Strategy,
} from '../src/analysis/backtest/Backtester.js';

const t0 = Date.parse('2024-01-01T00:00:00Z');
const DAY = 86400000;

function candlesFromCloses(closes: number[]): Candle[] {
  return closes.map((c, i) => ({
    symbol: 'T',
    open: c,
    high: c,
    low: c,
    close: c,
    volume: 1000,
    timestamp: new Date(t0 + i * DAY),
  }));
}

const noFrictions = {
  initialCapital: 100000,
  positionSizing: 0.2,
  commissionPerTrade: 0,
  slippageBps: 0,
};

/** 按下标返回预设信号，并记录每次调用看到的持仓 */
function scripted(
  signals: Record<number, Partial<Signal> & Pick<Signal, 'direction'>>,
  seen: Map<number, PositionContext | undefined> = new Map()
): Strategy {
  return {
    name: 'scripted',
    generateSignal: (history, i, position) => {
      seen.set(i, position);
      const s = signals[i];
      return s ? { timestamp: history[i].timestamp, ...s } : null;
    },
  };
}

describe('Backtester position context', () => {
  it('tells the strategy about the open position', async () => {
    const seen = new Map<number, PositionContext | undefined>();
    const candles = candlesFromCloses(new Array(70).fill(100));
    const strat = scripted(
      { 52: { direction: 'long' }, 60: { direction: 'flat' } },
      seen
    );

    await new Backtester(noFrictions).run(candles, strat);

    expect(seen.get(52)).toBeUndefined();
    expect(seen.get(55)).toEqual({
      side: 'long',
      entryIdx: 53,
      entryPrice: 100,
    });
    expect(seen.get(62)).toBeUndefined();
  });
});

describe('Backtester trade records', () => {
  it('records dates and holding bars', async () => {
    const candles = candlesFromCloses(new Array(70).fill(100));
    const strat = scripted({
      52: { direction: 'long' },
      60: { direction: 'flat' },
    });

    const { trades } = await new Backtester(noFrictions).run(candles, strat);

    expect(trades[0].entryDate).toEqual(candles[53].timestamp);
    expect(trades[0].exitDate).toEqual(candles[61].timestamp);
    expect(trades[0].holdingBars).toBe(8);
  });

  it('measures R on net P&L using the signal risk per share', async () => {
    const closes = new Array(70).fill(100);
    for (let i = 56; i < 70; i++) closes[i] = 106;
    const candles = candlesFromCloses(closes);
    const strat = scripted({
      52: { direction: 'long', riskPerShare: 2 },
      60: { direction: 'flat' },
    });

    const { trades } = await new Backtester({
      ...noFrictions,
      commissionPerTrade: 10,
    }).run(candles, strat);

    // qty = 100000 × 0.2 / 100 = 200；毛利 6 × 200 = 1200；净利 1200 − 2 × 10 = 1180
    expect(trades[0].pnl).toBeCloseTo(1200, 6);
    expect(trades[0].netPnl).toBeCloseTo(1180, 6);
    expect(trades[0].riskPerShare).toBe(2);
    expect(trades[0].rMultiple).toBeCloseTo(1180 / (2 * 200), 6);
  });

  it('does not enforce the risk unit as a stop', async () => {
    const closes = new Array(70).fill(100);
    for (let i = 56; i < 70; i++) closes[i] = 90; // 远低于 100 − 2
    const candles = candlesFromCloses(closes);
    const strat = scripted({ 52: { direction: 'long', riskPerShare: 2 } });

    const { trades } = await new Backtester(noFrictions).run(candles, strat);

    expect(trades).toHaveLength(1);
    expect(trades[0].exitIdx).toBe(69); // 持有到最后清算
    expect(trades[0].rMultiple).toBeCloseTo(-5, 6);
  });

  it('leaves R undefined when no risk unit is known', async () => {
    const candles = candlesFromCloses(new Array(70).fill(100));
    const strat = scripted({
      52: { direction: 'long' },
      60: { direction: 'flat' },
    });

    const { trades } = await new Backtester(noFrictions).run(candles, strat);

    expect(trades[0].rMultiple).toBeUndefined();
  });
});

describe('Backtester warm-up', () => {
  it('starts asking for signals after warmupBars', async () => {
    const seen = new Map<number, PositionContext | undefined>();
    const candles = candlesFromCloses(new Array(80).fill(100));

    await new Backtester({ ...noFrictions, warmupBars: 60 }).run(
      candles,
      scripted({}, seen)
    );

    expect(Math.min(...seen.keys())).toBe(60);
  });
});
