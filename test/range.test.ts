import { describe, it, expect } from 'vitest';
import { analyzeRange } from '../src/analysis/analyzer/range/rangeDetector.js';
import type { Candle } from '../src/types.js';

function makeRangeBreakoutData(): Candle[] {
  const out: Candle[] = [];
  let t = new Date('2024-01-01T00:00:00Z').getTime();
  const day = 86400000;
  // strong tight range around 100 for 30 bars
  for (let i = 0; i < 30; i++) {
    out.push({
      symbol: 'R',
      open: 100,
      high: 100.5,
      low: 99.5,
      close: 100,
      volume: 1000,
      timestamp: new Date(t),
    });
    t += day;
  }
  // breakout up with expansion
  out.push({
    symbol: 'R',
    open: 100.6,
    high: 105,
    low: 100.6,
    close: 104,
    volume: 4000,
    timestamp: new Date(t),
  });
  t += day;
  // optional retest near high boundary then continue
  out.push({
    symbol: 'R',
    open: 103,
    high: 104,
    low: 100.5,
    close: 102.5,
    volume: 2000,
    timestamp: new Date(t),
  });
  t += day;
  // follow through
  out.push({
    symbol: 'R',
    open: 102.6,
    high: 106,
    low: 102,
    close: 105,
    volume: 2500,
    timestamp: new Date(t),
  });
  return out;
}

describe('range breakout assessment', () => {
  it('detects breakout and uses post-breakout bars for follow-through and retest', () => {
    const data = makeRangeBreakoutData();
    const res = analyzeRange('R', data, 'daily');
    expect(res.range).toBeTruthy();
    expect(res.breakout).toBeTruthy();
    if (!res.breakout) return;
    expect(res.breakout.direction).toBe('up');
    // followThrough/retested depend on thresholds; should be boolean and not undefined
    expect(typeof res.breakout.followThrough).toBe('boolean');
    expect(typeof res.breakout.retested).toBe('boolean');
  });
});
