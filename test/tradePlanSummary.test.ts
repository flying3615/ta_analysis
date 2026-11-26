import { describe, it, expect } from 'vitest';
import { buildMachineReadableSummary } from '../src/analysis/FormatTradePlan.js';

function plan(
  direction: 'long' | 'short',
  stops: { price: number; type: string }[],
  tp: number
) {
  return {
    symbol: 'T',
    direction,
    confidenceScore: 50,
    entryStrategy: { idealEntryPrice: 100 },
    exitStrategy: {
      takeProfitLevels: [{ price: tp, proportion: 1, reasoning: '' }],
      stopLossLevels: stops.map(s => ({ ...s, reasoning: '' })),
    },
    chipAnalysisContribution: 0,
    patternAnalysisContribution: 0,
    volumeAnalysisContribution: 0,
    bbsrAnalysisContribution: 0,
  } as any;
}

describe('buildMachineReadableSummary', () => {
  it('reports risk against the primary stop', () => {
    const json = JSON.parse(
      buildMachineReadableSummary(
        plan(
          'long',
          [
            { price: 97.6, type: 'fixed' },
            { price: 99.8, type: 'trailing' },
          ],
          106
        )
      )
    );

    expect(json.stopLossUsed).toBe(97.6);
    expect(json.riskReward).toBeCloseTo(2.5, 2);
  });
});
