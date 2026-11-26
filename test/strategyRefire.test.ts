import { describe, it, expect, vi } from 'vitest';

vi.mock('../src/analysis/analyzer/structure/structureDetector.js', () => ({
  analyzeMarketStructure: vi.fn(),
}));
vi.mock('../src/analysis/analyzer/supplyDemand/sdDetector.js', () => ({
  analyzeSupplyDemandZone: vi.fn(),
}));

import type { Candle } from '../src/types.js';
import { analyzeMarketStructure } from '../src/analysis/analyzer/structure/structureDetector.js';
import { analyzeSupplyDemandZone } from '../src/analysis/analyzer/supplyDemand/sdDetector.js';
import { StructureBreakoutStrategy } from '../src/analysis/backtest/strategies/StructureBreakoutStrategy.js';
import { SupplyDemandRetestStrategy } from '../src/analysis/backtest/strategies/SupplyDemandRetestStrategy.js';

const history: Candle[] = Array.from({ length: 140 }, (_, i) => ({
  symbol: 'T',
  open: 100,
  high: 100.5,
  low: 99.5,
  close: 100,
  volume: 1000,
  timestamp: new Date(i * 86400000),
}));

function countSignals(
  strategy: { generateSignal: (h: Candle[], i: number) => any },
  from: number,
  to: number
) {
  let n = 0;
  for (let i = from; i <= to; i++)
    if (strategy.generateSignal(history.slice(0, i + 1), i)) n++;
  return n;
}

describe('StructureBreakoutStrategy', () => {
  it('signals a given break only once while it persists', () => {
    vi.mocked(analyzeMarketStructure).mockReturnValue({
      timeframe: 'daily',
      trend: 'up',
      lastEvent: {
        type: 'BOS',
        direction: 'bullish',
        index: 0,
        price: 100,
        timeframe: 'daily',
      },
      keyLevels: [99, 95, 97, 93],
      summary: '',
    } as any);
    const strat = StructureBreakoutStrategy('T', 'daily', {
      coolDownBars: 0,
      minLookback: 80,
    });

    expect(countSignals(strat, 100, 130)).toBe(1);
  });

  it('signals again when a new level breaks', () => {
    const strat = StructureBreakoutStrategy('T', 'daily', {
      coolDownBars: 0,
      minLookback: 80,
    });
    const evt = {
      type: 'BOS',
      direction: 'bullish',
      index: 0,
      price: 100,
      timeframe: 'daily',
    };
    vi.mocked(analyzeMarketStructure).mockReturnValue({
      timeframe: 'daily',
      trend: 'up',
      lastEvent: evt,
      keyLevels: [99, 95, 97, 93],
      summary: '',
    } as any);
    expect(countSignals(strat, 100, 110)).toBe(1);

    vi.mocked(analyzeMarketStructure).mockReturnValue({
      timeframe: 'daily',
      trend: 'up',
      lastEvent: evt,
      keyLevels: [104, 98, 99, 95],
      summary: '',
    } as any);
    expect(countSignals(strat, 111, 120)).toBe(1);
  });
});

describe('SupplyDemandRetestStrategy', () => {
  it('signals a given zone only once while price stays inside it', () => {
    vi.mocked(analyzeSupplyDemandZone).mockReturnValue({
      symbol: 'T',
      timeframe: 'daily',
      zones: [],
      recentEffectiveZones: [
        {
          type: 'demand',
          timeframe: 'daily',
          startIndex: 10,
          endIndex: 14,
          low: 98,
          high: 101,
          status: 'tested',
        },
      ],
      premiumDiscount: {} as any,
    } as any);
    const strat = SupplyDemandRetestStrategy('T', 'daily', { coolDownBars: 0 });

    expect(countSignals(strat, 70, 130)).toBe(1);
  });
});
