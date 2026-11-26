import { describe, it, expect } from 'vitest';
import type { Candle } from '../src/types.js';
import { analyzeMarketStructure } from '../src/analysis/analyzer/structure/structureDetector.js';

/** 锯齿走势：每段先走 legUp，再走 legDown（每根K线 1 个单位），重复 legs 次 */
function zigzag(legs: number, up: number, down: number, start = 100): number[] {
  const closes: number[] = [];
  let p = start;
  for (let k = 0; k < legs; k++) {
    for (let i = 0; i < 8; i++) closes.push((p += up / 8));
    for (let i = 0; i < 8; i++) closes.push((p -= down / 8));
  }
  return closes;
}

function toCandles(closes: number[]): Candle[] {
  return closes.map((c, i) => ({
    symbol: 'T',
    open: c,
    high: c + 0.2,
    low: c - 0.2,
    close: c,
    volume: 1,
    timestamp: new Date(i * 86400000),
  }));
}

describe('analyzeMarketStructure', () => {
  it('detects an up trend from higher highs and higher lows', () => {
    const res = analyzeMarketStructure(toCandles(zigzag(8, 8, 4)), 'daily');
    expect(res.trend).toBe('up');
  });

  it('detects a down trend from lower highs and lower lows', () => {
    const res = analyzeMarketStructure(
      toCandles(zigzag(8, 4, 8, 200)),
      'daily'
    );
    expect(res.trend).toBe('down');
  });

  it('reports CHOCH bearish when an up trend breaks its last swing low', () => {
    const closes = zigzag(8, 8, 4);
    closes.push(closes[closes.length - 1] - 20);
    const res = analyzeMarketStructure(toCandles(closes), 'daily');
    expect(res.lastEvent).toMatchObject({
      type: 'CHOCH',
      direction: 'bearish',
    });
  });

  it('reports BOS bullish when an up trend breaks its last swing high', () => {
    const closes = zigzag(8, 8, 4);
    closes.push(closes[closes.length - 1] + 20);
    const res = analyzeMarketStructure(toCandles(closes), 'daily');
    expect(res.lastEvent).toMatchObject({ type: 'BOS', direction: 'bullish' });
  });

  it('reports CHOCH bullish when a down trend breaks its last swing high', () => {
    const closes = zigzag(8, 4, 8, 200);
    closes.push(closes[closes.length - 1] + 20);
    const res = analyzeMarketStructure(toCandles(closes), 'daily');
    expect(res.lastEvent).toMatchObject({
      type: 'CHOCH',
      direction: 'bullish',
    });
  });

  it('does not report equal lows for a clean up trend', () => {
    const res = analyzeMarketStructure(toCandles(zigzag(8, 8, 4)), 'daily');
    expect(res.lastEvent?.type).not.toBe('EqualLows');
  });

  it('lists key levels as last high, last low, previous high, previous low', () => {
    const res = analyzeMarketStructure(toCandles(zigzag(8, 8, 4)), 'daily');
    const [lastHigh, lastLow, prevHigh, prevLow] = res.keyLevels;
    expect(lastHigh).toBeGreaterThan(prevHigh);
    expect(lastLow).toBeGreaterThan(prevLow);
    expect(lastHigh).toBeGreaterThan(lastLow);
  });
});
