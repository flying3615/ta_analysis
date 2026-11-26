import { describe, it, expect } from 'vitest';
import type { Candle } from '../src/types.js';
import { analyzeSupplyDemandZone } from '../src/analysis/analyzer/supplyDemand/sdDetector.js';

/** 盘整 4 根后急涨或急跌 4 根，交替出现，并带上升漂移 */
function baseAndImpulse(cycles: number): Candle[] {
  const out: Candle[] = [];
  let p = 100;
  let t = 0;
  const push = (c: number) =>
    out.push({
      symbol: 'T',
      open: c,
      high: c + 0.3,
      low: c - 0.3,
      close: c,
      volume: 1,
      timestamp: new Date(t++ * 86400000),
    });
  for (let k = 0; k < cycles; k++) {
    for (let i = 0; i < 4; i++) push(p + (i % 2) * 0.2);
    const dir = k % 3 === 2 ? -1 : 1;
    for (let i = 0; i < 4; i++) push((p += dir * 3));
  }
  return out;
}

describe('analyzeSupplyDemandZone', () => {
  it('keeps the five most recent unbroken zones of either type', () => {
    const res = analyzeSupplyDemandZone('T', baseAndImpulse(30), 'daily');

    const unbroken = res.zones.filter(z => z.status !== 'broken');
    expect(unbroken.length).toBeGreaterThan(5);

    const expected = [...unbroken]
      .sort((a, b) => a.endIndex - b.endIndex)
      .slice(-5)
      .map(z => z.endIndex);
    expect(res.recentEffectiveZones.map(z => z.endIndex)).toEqual(expected);
  });
});
