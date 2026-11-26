import { describe, it, expect } from 'vitest';
import { KeyLevelManager } from '../src/analysis/integration/KeyLevelManager.js';
import { DEFAULT_INTEGRATION_CONFIG } from '../src/analysis/integration/IntegrationConfig.js';
import { analyzeTrendlinesAndChannels } from '../src/analysis/analyzer/trendline/trendlineDetector.js';
import type { Candle } from '../src/types.js';

const context = { symbol: 'T', config: DEFAULT_INTEGRATION_CONFIG } as any;

function input(structure: any, trendline: any) {
  return {
    symbol: 'T',
    analyses: {
      chip: {},
      pattern: { timeframeAnalyses: [] },
      bbsr: {},
      structure,
      supplyDemand: {},
      range: {},
      trendline,
      volatility: {},
    },
  } as any;
}

function channelCandles(): Candle[] {
  const t0 = Date.parse('2024-01-01T00:00:00Z');
  return Array.from({ length: 120 }, (_, i) => {
    const c = 100 + 0.2 * i + 2 * Math.sin(i / 3);
    return {
      symbol: 'T',
      open: c,
      high: c + 0.5,
      low: c - 0.5,
      close: c,
      volume: 1000,
      timestamp: new Date(t0 + i * 86400000),
    };
  });
}

describe('KeyLevelManager', () => {
  const manager = new KeyLevelManager(DEFAULT_INTEGRATION_CONFIG);

  it('extracts swing highs and lows from the structure key levels', () => {
    const res = manager.extractAndMergeKeyLevels(
      input(
        { timeframe: 'daily', trend: 'up', keyLevels: [130, 120, 110, 100] },
        { timeframe: 'daily' }
      ),
      context
    );
    const structure = res.mergedLevels.filter(l => l.source === 'structure');
    expect(structure.map(l => [l.price, l.type]).sort()).toEqual(
      [
        [100, 'support'],
        [110, 'resistance'],
        [120, 'support'],
        [130, 'resistance'],
      ].sort()
    );
  });

  it('extracts the channel bounds at the last bar from the trendline analysis', () => {
    const data = channelCandles();
    const tl = analyzeTrendlinesAndChannels('T', data, 'daily');
    expect(tl.channel).toBeDefined();

    const res = manager.extractAndMergeKeyLevels(
      input({ timeframe: 'daily', keyLevels: [] }, tl),
      context
    );
    const levels = res.mergedLevels.filter(l => l.source === 'trendline');
    const last = data.length - 1;
    const ch = tl.channel!;
    expect(levels.find(l => l.type === 'resistance')?.price).toBeCloseTo(
      ch.upper.slope * last + ch.upper.intercept,
      6
    );
    expect(levels.find(l => l.type === 'support')?.price).toBeCloseTo(
      ch.lower.slope * last + ch.lower.intercept,
      6
    );
  });
});
