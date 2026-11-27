import { describe, it, expect } from 'vitest';
import type { Candle } from '../src/types.js';
import type { Zone } from '../src/analysis/analyzer/supplyDemand/sdTypes.js';
import {
  BREAKOUT_FILTERS,
  structureFilter,
  toDonchianFilter,
  volatilityFilter,
  volumeFilter,
  zoneFilter,
  type BreakoutFilter,
} from '../src/analysis/backtest/donchianFilters.js';

const t0 = Date.parse('2024-01-01T00:00:00Z');
const DAY = 86400000;

function candles(
  closes: number[],
  volume: (i: number) => number = () => 1000
): Candle[] {
  return closes.map((c, i) => ({
    symbol: 'T',
    open: c,
    high: c + 1,
    low: c - 1,
    close: c,
    volume: volume(i),
    timestamp: new Date(t0 + i * DAY),
  }));
}

describe('volumeFilter', () => {
  const f = volumeFilter();
  const closes = new Array(30).fill(100);

  it('passes a breakout on at least 1.5× the 20-day average volume', () => {
    expect(
      f.evaluate(
        candles(closes, i => (i === 29 ? 1500 : 1000)),
        29,
        'long'
      )
    ).toBe('pass');
  });
  it('fails a breakout on light volume', () => {
    expect(
      f.evaluate(
        candles(closes, i => (i === 29 ? 1400 : 1000)),
        29,
        'long'
      )
    ).toBe('fail');
  });
  it('cannot decide without volume data or enough history', () => {
    expect(
      f.evaluate(
        candles(closes, () => 0),
        29,
        'long'
      )
    ).toBe('undecided');
    expect(f.evaluate(candles(closes), 10, 'long')).toBe('undecided');
  });
});

describe('structureFilter', () => {
  // 锯齿上升：高点和低点都在抬高
  const closes: number[] = [];
  let p = 100;
  for (let k = 0; k < 8; k++) {
    for (let j = 0; j < 8; j++) closes.push((p += 1));
    for (let j = 0; j < 8; j++) closes.push((p -= 0.5));
  }
  const data = candles(closes);
  const last = data.length - 1;

  it('passes a long when the structure trend is up', () => {
    expect(structureFilter().evaluate(data, last, 'long')).toBe('pass');
  });
  it('fails a short when the structure trend is up', () => {
    expect(structureFilter().evaluate(data, last, 'short')).toBe('fail');
  });
});

function zone(
  type: 'supply' | 'demand',
  low: number,
  high: number,
  status: Zone['status'] = 'fresh'
): Zone {
  return {
    type,
    timeframe: 'daily',
    startIndex: 0,
    endIndex: 1,
    low,
    high,
    status,
  };
}

describe('zoneFilter', () => {
  // 收盘 100，ATR 约 2 → 检查 100 到 104 之间的供给区
  const data = candles(new Array(80).fill(100));
  const withZones = (zones: Zone[]) => zoneFilter({ analyze: () => zones });

  it('fails a long with an unbroken supply zone within 2 × ATR above', () => {
    expect(
      withZones([zone('supply', 103, 105)]).evaluate(data, 79, 'long')
    ).toBe('fail');
  });
  it('fails a long whose close sits inside a supply zone', () => {
    expect(
      withZones([zone('supply', 99, 101)]).evaluate(data, 79, 'long')
    ).toBe('fail');
  });
  it('passes a long when the supply zone is farther than 2 × ATR', () => {
    expect(
      withZones([zone('supply', 106, 108)]).evaluate(data, 79, 'long')
    ).toBe('pass');
  });
  it('ignores broken zones and demand zones for a long', () => {
    expect(
      withZones([
        zone('supply', 102, 104, 'broken'),
        zone('demand', 101, 103),
      ]).evaluate(data, 79, 'long')
    ).toBe('pass');
  });
  it('checks demand zones below for a short', () => {
    expect(
      withZones([zone('demand', 96, 98)]).evaluate(data, 79, 'short')
    ).toBe('fail');
    expect(
      withZones([zone('supply', 96, 98)]).evaluate(data, 79, 'short')
    ).toBe('pass');
  });
});

describe('volatilityFilter', () => {
  const data = candles(new Array(80).fill(100));
  it('fails in an extreme regime and passes otherwise', () => {
    expect(
      volatilityFilter({ regime: () => 'extreme' }).evaluate(data, 79, 'long')
    ).toBe('fail');
    expect(
      volatilityFilter({ regime: () => 'high' }).evaluate(data, 79, 'long')
    ).toBe('pass');
  });
  it('cannot decide with fewer than 30 bars', () => {
    expect(volatilityFilter().evaluate(data, 20, 'long')).toBe('undecided');
  });
});

describe('filters never look ahead', () => {
  // 交替出现：安静盘整（形成基底）→ 冲击（形成供需区）→ 普通或高波动段（触发"极端"）
  function regimeData(): Candle[] {
    let seed = 11;
    const r = () =>
      (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
    let p = 100;
    const out: Candle[] = [];
    const push = (ret: number, range: number) => {
      const o = p;
      p = Math.max(1, p * (1 + ret));
      out.push({
        symbol: 'T',
        open: o,
        high: Math.max(o, p) * (1 + range),
        low: Math.min(o, p) * (1 - range),
        close: p,
        volume: 1000 + Math.floor(r() * 2000),
        timestamp: new Date(t0 + out.length * DAY),
      });
    };
    for (let cycle = 0; cycle < 12; cycle++) {
      for (let k = 0; k < 15; k++) push((r() - 0.5) * 0.006, 0.002);
      const dir = cycle % 2 === 0 ? 1 : -1;
      for (let k = 0; k < 4; k++) push(dir * 0.03, 0.005);
      const wild = cycle % 3 === 0;
      for (let k = 0; k < 15; k++)
        push((r() - 0.5) * (wild ? 0.16 : 0.02), wild ? 0.04 : 0.005);
    }
    return out;
  }
  const data = regimeData();

  for (const filter of Object.values(BREAKOUT_FILTERS)) {
    it(`${filter.name} gives the same verdict with or without future bars`, () => {
      const seen = new Set<string>();
      for (let i = 60; i < data.length - 10; i += 7) {
        for (const dir of ['long', 'short'] as const) {
          const verdict = filter.evaluate(data, i, dir);
          seen.add(verdict);
          expect(verdict).toBe(filter.evaluate(data.slice(0, i + 1), i, dir));
        }
      }
      // 数据必须让过滤器两种结论都出现，否则这个测试检验不到任何东西
      expect(seen.has('pass') && seen.has('fail')).toBe(true);
    });
  }
});

describe('toDonchianFilter', () => {
  const fixed = (
    name: string,
    verdict: 'pass' | 'fail' | 'undecided'
  ): BreakoutFilter => ({
    name: name as any,
    label: name,
    evaluate: () => verdict,
  });

  it('requires every filter to pass, treating undecided as pass and counting it', () => {
    const counts: Record<string, number> = {};
    const data = candles([100]);

    expect(
      toDonchianFilter([fixed('a', 'pass'), fixed('b', 'undecided')], counts)(
        data,
        0,
        'long'
      )
    ).toBe(true);
    expect(
      toDonchianFilter([fixed('a', 'pass'), fixed('c', 'fail')], counts)(
        data,
        0,
        'long'
      )
    ).toBe(false);
    expect(counts).toEqual({ b: 1 });
  });
});
