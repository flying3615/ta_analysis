import { describe, it, expect } from 'vitest';
import { SignalAggregator } from '../src/analysis/integration/SignalAggregator.js';
import { DEFAULT_INTEGRATION_CONFIG } from '../src/analysis/integration/IntegrationConfig.js';

const context = {
  symbol: 'T',
  timestamp: new Date(),
  config: DEFAULT_INTEGRATION_CONFIG,
  executionId: 'test',
} as any;

/** 除结构以外所有模块都是中性 */
function inputWithStructure(structure: any) {
  return {
    symbol: 'T',
    analyses: {
      chip: { combinedBuySignalStrength: 50, combinedShortSignalStrength: 50 },
      pattern: {
        combinedSignal: 'neutral',
        signalStrength: 0,
        timeframeAnalyses: [],
      },
      volatility: {},
      bbsr: {},
      structure,
      supplyDemand: {},
      range: {},
      trendline: {},
    },
  } as any;
}

describe('SignalAggregator weighting', () => {
  it('does not let a structure up-trend without an event decide the direction', () => {
    const agg = new SignalAggregator(DEFAULT_INTEGRATION_CONFIG);

    const res = agg.aggregateSignals(
      inputWithStructure({ trend: 'up' }),
      context
    );

    expect(res.weightedScores.structure).toBeGreaterThan(0);
    expect(res.direction).toBe('neutral');
  });

  it('keeps the final score within ±100 when every weight is used', () => {
    const agg = new SignalAggregator(DEFAULT_INTEGRATION_CONFIG);
    const res = agg.aggregateSignals(
      inputWithStructure({
        trend: 'up',
        lastEvent: { type: 'CHOCH', direction: 'bullish', timeframe: 'daily' },
      }),
      context
    );
    const total = Object.values(res.weightedScores).reduce(
      (s: number, v) => s + Math.abs(v as number),
      0
    );
    expect(total).toBeLessThanOrEqual(100);
    const w = DEFAULT_INTEGRATION_CONFIG.weights;
    const sum =
      w.chip +
      w.pattern +
      w.volume +
      w.bbsr +
      w.structure! +
      w.supplyDemand! +
      w.range! +
      w.trendline!;
    // CHOCH 日线：置信度 65 + 25 + 5 = 95，乘以 8 个模块一起归一化后的权重
    expect(res.weightedScores.structure).toBeCloseTo(
      (95 * w.structure!) / sum,
      6
    );
  });
});

describe('normalizeWeights', () => {
  it('scales all eight module weights to sum to 1 and keeps plugin weights', async () => {
    const { normalizeWeights } = await import(
      '../src/analysis/integration/IntegrationConfig.js'
    );
    const w = normalizeWeights({
      ...DEFAULT_INTEGRATION_CONFIG.weights,
      plugins: { custom: 0.5 },
    });
    const sum =
      w.chip +
      w.pattern +
      w.volume +
      w.bbsr +
      w.structure! +
      w.supplyDemand! +
      w.range! +
      w.trendline!;
    expect(sum).toBeCloseTo(1, 10);
    expect(w.plugins).toEqual({ custom: 0.5 });
  });
});

describe('SignalAggregator plugins', () => {
  const neutral = () => inputWithStructure({ trend: 'sideways' });

  it('reports a plugin that throws instead of hiding the error', () => {
    const config = {
      ...DEFAULT_INTEGRATION_CONFIG,
      weights: {
        ...DEFAULT_INTEGRATION_CONFIG.weights,
        plugins: { broken: 0.5 },
      },
    };
    const agg = new SignalAggregator(config);
    agg.registerPlugin({
      id: 'broken',
      category: 'additional',
      extract: () => {
        throw new Error('boom');
      },
    } as any);

    const res = agg.aggregateSignals(neutral(), { ...context, config });

    expect(res.pluginErrors).toEqual({ broken: 'boom' });
  });

  it('does not run plugins whose weight is zero', () => {
    const agg = new SignalAggregator(DEFAULT_INTEGRATION_CONFIG);
    let calls = 0;
    agg.registerPlugin({
      id: 'unused',
      category: 'additional',
      extract: () => {
        calls++;
        return { direction: 'long', confidence: 90, source: 'unused' };
      },
    } as any);

    agg.aggregateSignals(neutral(), context);

    expect(calls).toBe(0);
  });
});
