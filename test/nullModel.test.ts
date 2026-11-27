import { describe, it, expect } from 'vitest';
import type { Candle } from '../src/types.js';
import { RandomEntryStrategy } from '../src/analysis/backtest/strategies/RandomEntryStrategy.js';
import {
  donchianAtr,
  DonchianStrategy,
} from '../src/analysis/backtest/strategies/DonchianStrategy.js';
import { runPortfolioBacktest } from '../src/analysis/backtest/Portfolio.js';
import {
  nullDistribution,
  runNullModel,
} from '../src/analysis/backtest/nullModel.js';

const t0 = Date.parse('2020-01-01T00:00:00Z');
const DAY = 86400000;

function walk(symbol: string, n: number, seed: number): Candle[] {
  let s = seed;
  const r = () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
  let p = 100;
  return Array.from({ length: n }, (_, i) => {
    const o = p;
    p = Math.max(1, p * (1 + (r() - 0.49) * 0.04));
    return {
      symbol,
      open: o,
      high: Math.max(o, p) * 1.005,
      low: Math.min(o, p) * 0.995,
      close: p,
      volume: 1000,
      timestamp: new Date(t0 + i * DAY),
    };
  });
}

/** 依次喂给策略（空仓），返回发出入场信号的下标 */
function entries(
  strat: ReturnType<typeof RandomEntryStrategy>,
  data: Candle[]
) {
  const out: number[] = [];
  for (let i = 0; i < data.length; i++) {
    const s = strat.generateSignal(data.slice(0, i + 1), i, undefined) as any;
    if (s?.direction === 'long') out.push(i);
  }
  return out;
}

describe('RandomEntryStrategy', () => {
  const data = walk('A', 300, 1);

  it('is reproducible for the same seed and symbol', () => {
    const a = entries(
      RandomEntryStrategy({ probability: 0.05, seed: 7, symbol: 'A' }),
      data
    );
    const b = entries(
      RandomEntryStrategy({ probability: 0.05, seed: 7, symbol: 'A' }),
      data
    );
    expect(a).toEqual(b);
    expect(a.length).toBeGreaterThan(0);
  });

  it('draws different entries for different seeds and symbols', () => {
    const a = entries(
      RandomEntryStrategy({ probability: 0.05, seed: 7, symbol: 'A' }),
      data
    );
    const b = entries(
      RandomEntryStrategy({ probability: 0.05, seed: 8, symbol: 'A' }),
      data
    );
    const c = entries(
      RandomEntryStrategy({ probability: 0.05, seed: 7, symbol: 'B' }),
      data
    );
    expect(a).not.toEqual(b);
    expect(a).not.toEqual(c);
  });

  it('enters only once the 56-bar ATR exists, with a 2 × ATR risk unit', () => {
    const strat = RandomEntryStrategy({ probability: 1, seed: 1, symbol: 'A' });
    expect(strat.generateSignal(data.slice(0, 55), 54, undefined)).toBeNull();
    const s = strat.generateSignal(data.slice(0, 56), 55, undefined) as any;
    expect(s.direction).toBe('long');
    expect(s.riskPerShare).toBeCloseTo(2 * donchianAtr(data.slice(0, 56))!, 12);
  });

  it('never enters with probability 0', () => {
    expect(
      entries(
        RandomEntryStrategy({ probability: 0, seed: 1, symbol: 'A' }),
        data
      )
    ).toEqual([]);
  });

  it('exits exactly like the Donchian strategy', () => {
    const position = {
      side: 'long' as const,
      entryIdx: 100,
      entryPrice: data[100].open,
    };
    const random = RandomEntryStrategy({
      probability: 0,
      seed: 1,
      symbol: 'A',
    });
    const donchian = DonchianStrategy({ mode: 'breakout' });
    for (let i = 101; i < data.length; i++) {
      const h = data.slice(0, i + 1);
      expect(random.generateSignal(h, i, position)).toEqual(
        donchian.generateSignal(h, i, position)
      );
    }
  });
});

describe('nullDistribution', () => {
  it('locates the baseline within the null values', () => {
    const d = nullDistribution(3, [1, 2, 3, 4]);
    expect(d.mean).toBeCloseTo(2.5, 12);
    expect(d.sd).toBeCloseTo(Math.sqrt(5 / 3), 12); // 样本标准差
    expect([d.min, d.max]).toEqual([1, 4]);
    expect(d.atOrAboveBaseline).toBeCloseTo(0.5, 12); // 3 和 4
    expect(d.z).toBeCloseTo(0.5 / Math.sqrt(5 / 3), 12);
  });
});

describe('runNullModel', () => {
  const dataBySymbol = {
    A: walk('A', 500, 1),
    B: walk('B', 500, 2),
    C: walk('C', 500, 3),
  };
  const config = {
    commissionPerTrade: 0,
    slippageBps: 0,
    warmupBars: 56,
    allowShort: false,
  };

  it('calibrates the entry probability to roughly match the baseline trade count', async () => {
    const baseline = await runPortfolioBacktest(
      dataBySymbol,
      () => DonchianStrategy({ mode: 'breakout', longOnly: true }),
      config
    );
    const res = await runNullModel(dataBySymbol, baseline, {
      seeds: 5,
      backtestConfig: config,
    });

    expect(res.seeds).toBe(5);
    expect(res.overall.values).toHaveLength(5);
    expect(res.overall.baseline).toBeCloseTo(baseline.overall.avgR, 12);
    expect(res.nullTradesMean).toBeGreaterThan(
      baseline.overall.tradeCount * 0.7
    );
    expect(res.nullTradesMean).toBeLessThan(baseline.overall.tradeCount * 1.3);
  });

  it('is reproducible and reports in/out of sample and per-year distributions', async () => {
    const baseline = await runPortfolioBacktest(
      dataBySymbol,
      () => DonchianStrategy({ mode: 'breakout', longOnly: true }),
      { ...config, splitDate: new Date('2020-09-01') }
    );
    const opts = {
      seeds: 3,
      backtestConfig: config,
      splitDate: new Date('2020-09-01'),
    };
    const a = await runNullModel(dataBySymbol, baseline, opts);
    const b = await runNullModel(dataBySymbol, baseline, opts);

    expect(a.overall.values).toEqual(b.overall.values);
    expect(a.inSample?.values).toHaveLength(3);
    expect(a.outOfSample?.values).toHaveLength(3);
    expect(Object.keys(a.byYear).sort()).toEqual(['2020', '2021']);
  });
});
