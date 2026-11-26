import { describe, it, expect } from 'vitest';
import type { Candle } from '../src/types.js';
import { analyzeTrendlinesAndChannels } from '../src/analysis/analyzer/trendline/trendlineDetector.js';

const t0 = Date.parse('2024-01-01T00:00:00Z');
const mid = (i: number) => 100 + 0.2 * i;

/** 100 根上升通道内震荡的K线，之后追加若干根收盘价为 mid(i) + offset 的K线 */
function channelThen(offsets: number[]): Candle[] {
  const closes: number[] = [];
  for (let i = 0; i < 100; i++) closes.push(mid(i) + 2 * Math.sin(i / 3));
  offsets.forEach((o, k) => closes.push(mid(100 + k) + o));
  return closes.map((c, i) => ({
    symbol: 'T',
    open: c,
    high: c + 0.5,
    low: c - 0.5,
    close: c,
    volume: 1000,
    timestamp: new Date(t0 + i * 86400000),
  }));
}

describe('trendline channel breakouts', () => {
  it('detects an upward breakout', () => {
    const res = analyzeTrendlinesAndChannels(
      'T',
      channelThen([0, 6, 6]),
      'daily'
    );
    expect(res.breakoutRetest?.direction).toBe('up');
  });

  it('detects a downward breakout', () => {
    const res = analyzeTrendlinesAndChannels(
      'T',
      channelThen([0, -6, -6]),
      'daily'
    );
    expect(res.breakoutRetest?.direction).toBe('down');
  });

  it('reports no breakout while price stays inside the channel', () => {
    const res = analyzeTrendlinesAndChannels(
      'T',
      channelThen([0, 0.5, -0.5]),
      'daily'
    );
    expect(res.channel).toBeDefined();
    expect(res.breakoutRetest).toBeUndefined();
  });

  it('does not count bars before the breakout as a retest', () => {
    const res = analyzeTrendlinesAndChannels(
      'T',
      channelThen([0, 0, 6]),
      'daily'
    );
    expect(res.breakoutRetest?.direction).toBe('up');
    expect(res.breakoutRetest?.breakoutIndex).toBe(102);
    expect(res.breakoutRetest?.retested).toBe(false);
  });
});

/** 通道内继续正常震荡到第 last 根K线（不追加突破） */
function oscillateUntil(last: number): Candle[] {
  const closes: number[] = [];
  for (let i = 0; i <= last; i++) closes.push(mid(i) + 2 * Math.sin(i / 3));
  return closes.map((c, i) => ({
    symbol: 'T',
    open: c,
    high: c + 0.5,
    low: c - 0.5,
    close: c,
    volume: 1000,
    timestamp: new Date(t0 + i * 86400000),
  }));
}

describe('normal swings inside the channel', () => {
  // sin(i/3) 在 i≈103 处为波谷，在 i≈118 处为波峰
  it('does not call a trough inside the channel a downward breakout', () => {
    const res = analyzeTrendlinesAndChannels('T', oscillateUntil(103), 'daily');
    expect(res.channel).toBeDefined();
    expect(res.breakoutRetest).toBeUndefined();
  });

  it('does not call a crest inside the channel an upward breakout', () => {
    const res = analyzeTrendlinesAndChannels('T', oscillateUntil(118), 'daily');
    expect(res.channel).toBeDefined();
    expect(res.breakoutRetest).toBeUndefined();
  });
});

describe('breakout rate on random walks', () => {
  function rng(seed: number) {
    return () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };
  }

  it('flags few windows as breakouts and finds both directions', () => {
    let up = 0;
    let down = 0;
    let total = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const r = rng(seed * 7919);
      let p = 100;
      const data: Candle[] = [];
      for (let i = 0; i < 300; i++) {
        const o = p;
        p += (r() - 0.5) * 2;
        data.push({
          symbol: 'T',
          open: o,
          high: Math.max(o, p) + r() * 0.8,
          low: Math.min(o, p) - r() * 0.8,
          close: p,
          volume: 1000,
          timestamp: new Date(t0 + i * 86400000),
        });
      }
      for (let end = 120; end <= 300; end += 6) {
        const d = analyzeTrendlinesAndChannels('T', data.slice(0, end), 'daily')
          .breakoutRetest?.direction;
        total++;
        if (d === 'up') up++;
        if (d === 'down') down++;
      }
    }
    // 修复前约 35% 的窗口被报告为突破
    expect((up + down) / total).toBeLessThan(0.1);
    expect(up).toBeGreaterThan(0);
    expect(down).toBeGreaterThan(0);
  });
});

describe('channel touch filter', () => {
  it('rejects a channel whose bound only touches one spike bar', () => {
    const data = channelThen([0, 0.5, -0.5]);
    // 拟合区间内的一根K线最高价冲高 40%：上沿只碰到这一根K线
    data[50] = { ...data[50], high: data[50].high * 1.4 };

    const res = analyzeTrendlinesAndChannels('T', data, 'daily');

    expect(res.channel).toBeUndefined();
  });
});
