import { describe, it, expect } from 'vitest';
import type { Candle } from '../src/types.js';
import {
  DonchianStrategy,
  donchianAtr,
  evaluateDonchian,
  trueRange,
} from '../src/analysis/backtest/strategies/DonchianStrategy.js';
import { Backtester } from '../src/analysis/backtest/Backtester.js';

const t0 = Date.parse('2024-01-01T00:00:00Z');
const DAY = 86400000;

type Ohlc = [number, number, number, number];

function bars(rows: Ohlc[]): Candle[] {
  return rows.map(([open, high, low, close], i) => ({
    symbol: 'T',
    open,
    high,
    low,
    close,
    volume: 1_000_000,
    timestamp: new Date(t0 + i * DAY),
  }));
}

/** Rust 测试里的 series()：55 根 O105/H110/L100/C105，最后一根收盘为 close */
function rustSeries(close: number): Candle[] {
  const rows: Ohlc[] = Array.from({ length: 55 }, () => [105, 110, 100, 105]);
  rows.push([105, Math.max(close, 105), Math.min(close, 105), close]);
  return bars(rows);
}

describe('Donchian parity with the Rust evaluator', () => {
  describe('trueRange', () => {
    const prev: Candle = bars([[100, 101, 99, 100]])[0];
    const at = (o: Ohlc) => bars([o])[0];

    it('uses the full intraday range without a larger gap', () => {
      expect(trueRange(prev, at([100, 103, 99, 101]))).toBe(4);
    });
    it('uses an up gap when it exceeds the intraday range', () => {
      expect(trueRange(prev, at([105, 110, 105, 108]))).toBe(10);
    });
    it('uses a down gap when it exceeds the intraday range', () => {
      expect(trueRange(prev, at([95, 95, 90, 92]))).toBe(10);
    });
  });

  it('seeds ATR with fourteen true ranges, then smooths the rest (Wilder)', () => {
    const rows: Ohlc[] = [[100, 101, 99, 100]];
    for (let tr = 1; tr <= 14; tr++) rows.push([100, 100 + tr, 100, 100]);
    rows.push([100, 121, 100, 100]);

    const seeded = (14 * 15) / 2 / 14;
    expect(donchianAtr(bars(rows))).toBeCloseTo((seeded * 13 + 21) / 14, 12);
  });

  it('reports a long breakout for a close strictly above the 55-session high', () => {
    const r = evaluateDonchian(rustSeries(115), 55, 'long');
    expect(r.state).toBe('breakout');
    expect(r.entryLine).toBe(110);
    expect(r.exitLine).toBe(100);
    expect(r.atr).toBeCloseTo(10, 12);
  });

  it('treats a close equal to the channel high as no breakout', () => {
    expect(evaluateDonchian(rustSeries(110), 55, 'long').state).toBe('none');
  });

  it('keeps a close exactly 15% above the exit line a breakout', () => {
    expect(evaluateDonchian(rustSeries(115), 55, 'long').state).toBe(
      'breakout'
    );
  });

  it('calls a close more than 15% above the exit line overheated', () => {
    expect(evaluateDonchian(rustSeries(115.01), 55, 'long').state).toBe(
      'overheated'
    );
  });

  it('reports a short breakout for a close strictly below the 55-session low', () => {
    const r = evaluateDonchian(rustSeries(95), 55, 'short');
    expect(r.state).toBe('breakout');
    expect(r.entryLine).toBe(100);
    expect(r.exitLine).toBe(110);
  });

  it('never lets the evaluated session contribute to either channel', () => {
    const data = rustSeries(115);
    data[55] = { ...data[55], high: 500, low: 5 };
    const r = evaluateDonchian(data, 55, 'long');
    expect(r.entryLine).toBe(110);
    expect(r.state).toBe('breakout');
  });
});

/** 56 根平稳K线（H110/L100），之后按给定收盘价追加K线（振幅 ±1） */
function flatThen(closes: number[]): Candle[] {
  const rows: Ohlc[] = Array.from({ length: 56 }, () => [105, 110, 100, 105]);
  for (const c of closes) rows.push([c, c + 1, c - 1, c]);
  return bars(rows);
}

const noFrictions = {
  initialCapital: 100000,
  positionSizing: 0.2,
  commissionPerTrade: 0,
  slippageBps: 0,
  warmupBars: 56,
};

describe('DonchianStrategy breakout mode', () => {
  it('goes long on a breakout with a 2×ATR risk unit', () => {
    const data = flatThen([112]);
    const strat = DonchianStrategy({ mode: 'breakout' });

    const signal = strat.generateSignal(data, 56, undefined) as any;

    expect(signal.direction).toBe('long');
    expect(signal.riskPerShare).toBeCloseTo(
      2 * evaluateDonchian(data, 56, 'long').atr!,
      12
    );
  });

  it('does not enter on an overheated breakout', () => {
    const data = flatThen([116]); // 离出场线 100 超过 15%
    expect(
      DonchianStrategy({ mode: 'breakout' }).generateSignal(data, 56, undefined)
    ).toBeNull();
  });

  it('exits a long only when the close is strictly below the 20-session low', () => {
    const position = { side: 'long' as const, entryIdx: 57, entryPrice: 112 };
    const strat = DonchianStrategy({ mode: 'breakout' });
    // 之前 20 根的最低价为 99（收盘 100 的K线低点）
    const equal = flatThen([112, 112, 100, 100, 100, 100, 100, 99]);
    const below = flatThen([112, 112, 100, 100, 100, 100, 100, 98.5]);

    expect(strat.generateSignal(equal, 63, position)).toBeNull();
    expect((strat.generateSignal(below, 63, position) as any).direction).toBe(
      'flat'
    );
  });

  it('skips a breakout that the filter rejects', () => {
    const data = flatThen([112]);
    const strat = DonchianStrategy({ mode: 'breakout', filter: () => false });
    expect(strat.generateSignal(data, 56, undefined)).toBeNull();
  });

  it('ignores short breakouts when longOnly is set', () => {
    const data = flatThen([98]);
    expect(
      DonchianStrategy({ mode: 'breakout', longOnly: true }).generateSignal(
        data,
        56,
        undefined
      )
    ).toBeNull();
    expect(
      (
        DonchianStrategy({ mode: 'breakout' }).generateSignal(
          data,
          56,
          undefined
        ) as any
      ).direction
    ).toBe('short');
  });
});

/** 依次把 0..n 的K线喂给策略，返回每根K线的信号方向 */
function run(
  strat: ReturnType<typeof DonchianStrategy>,
  data: Candle[],
  from = 56
) {
  const out: Record<number, string> = {};
  for (let i = from; i < data.length; i++) {
    const s = strat.generateSignal(data.slice(0, i + 1), i, undefined) as any;
    if (s) out[i] = s.direction;
  }
  return out;
}

describe('DonchianStrategy entry-plan mode', () => {
  // 第 56 根突破：信号线 110，ATR ≈ 10（回撤区上沿 112.5）
  it('reports the plan-creation bar as the signal bar', () => {
    const data = flatThen([112, 111, 110.5]);
    const strat = DonchianStrategy({ mode: 'entryPlan' });
    let entry: any;
    for (let i = 56; i < data.length; i++) {
      entry = strat.generateSignal(data.slice(0, i + 1), i, undefined) ?? entry;
    }
    expect(entry.signalIdx).toBe(56);
  });

  it('enters after a pullback and a reclaim on two different later days', () => {
    const data = flatThen([112, 111, 110.5]);
    // 57：收盘 111 ≤ 112.5 → 进入回撤；58：收盘 110.5 ≥ 110 → 确认
    expect(run(DonchianStrategy({ mode: 'entryPlan' }), data)).toEqual({
      58: 'long',
    });
  });

  it('cannot complete pullback and reclaim on the same bar', () => {
    const data = flatThen([112, 111]);
    expect(run(DonchianStrategy({ mode: 'entryPlan' }), data)).toEqual({});
  });

  it('expires on the 15th bar after the signal', () => {
    // 一直停在回撤区上方（114 > 112.5），从未回撤
    const closes = [112, ...new Array(14).fill(114), 111, 110.5];
    const data = flatThen(closes);
    // 第 71 根（56 + 15）到期，之后的回撤和确认不再有效
    expect(run(DonchianStrategy({ mode: 'entryPlan' }), data)).toEqual({});
  });

  it('expires on the expiry bar itself, even if it would have confirmed', () => {
    // 57..69 停在 114；70 回撤（111）；71 = 56 + 15 是到期日，当天的确认无效
    const data = flatThen([112, ...new Array(13).fill(114), 111, 110.5]);
    expect(run(DonchianStrategy({ mode: 'entryPlan' }), data)).toEqual({});
    // 对照：早一根K线完成确认则有效
    const earlier = flatThen([112, ...new Array(12).fill(114), 111, 110.5]);
    expect(run(DonchianStrategy({ mode: 'entryPlan' }), earlier)).toEqual({
      70: 'long',
    });
  });

  it('opens a new plan after the old one ends and a non-breakout close follows', () => {
    // 56 突破建计划；57..71 停在 112.8（未突破、未回撤）→ 71 到期；
    // 72 再次突破（114 > 113.8）→ 第二个计划
    const data = flatThen([112, ...new Array(15).fill(112.8), 114]);
    const strat = DonchianStrategy({ mode: 'entryPlan' });
    run(strat, data);
    expect(strat.plansCreated()).toBe(2);
  });

  it('does not replace an active plan with a later breakout', () => {
    // 56 建计划；57 收盘 112.8（非突破、未回撤）；58 再次突破，此时计划仍有效
    const data = flatThen([112, 112.8, 114]);
    const strat = DonchianStrategy({ mode: 'entryPlan' });
    run(strat, data);
    expect(strat.plansCreated()).toBe(1);
  });

  it('is invalidated by an opposing breakout', () => {
    // 突破后跌破 55 日低点（100）→ 反向突破，计划作废
    const data = flatThen([112, 95, 111, 110.5]);
    expect(run(DonchianStrategy({ mode: 'entryPlan' }), data)).toEqual({});
  });

  it('does not open a new plan on consecutive breakout days', () => {
    // 56、57、58 连续三天突破（每天都创新高，且离出场线不超过 15%）
    const data = flatThen([112, 113.5, 115]);
    const strat = DonchianStrategy({ mode: 'entryPlan' });
    run(strat, data);
    expect(strat.plansCreated()).toBe(1);
  });
});

describe('DonchianStrategy with the Backtester', () => {
  it('produces trades with R multiples', async () => {
    const closes = [112, 115, 118, 121, 124, 127, 130, 133, 136, 139];
    for (let k = 0; k < 25; k++) closes.push(110 - k); // 回落，跌破 20 日低点
    const data = flatThen(closes);

    const res = await new Backtester(noFrictions).run(
      data,
      DonchianStrategy({ mode: 'breakout', longOnly: true })
    );

    expect(res.trades.length).toBeGreaterThan(0);
    expect(res.trades[0].direction).toBe('long');
    expect(res.trades[0].entryIdx).toBe(57);
    expect(Number.isFinite(res.trades[0].rMultiple)).toBe(true);
  });
});
