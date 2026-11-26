import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('../src/util/util.js', async importOriginal => {
  const orig = await importOriginal<typeof import('../src/util/util.js')>();
  return { ...orig, getStockDataForTimeframe: vi.fn(async () => []) };
});
vi.mock(
  '../src/analysis/analyzer/trendReversal/multiTimeFrameTrendReversal.js',
  async importOriginal => {
    const orig =
      await importOriginal<
        typeof import('../src/analysis/analyzer/trendReversal/multiTimeFrameTrendReversal.js')
      >();
    return {
      ...orig,
      detectTrendReversal: vi.fn(() => ({
        isReversal: true,
        reversalStrength: 50,
        direction: 1,
      })),
    };
  }
);

import { batchCheckForReversalSignals } from '../src/analysis/analyzer/trendReversal/trendReversalChecker.js';
import {
  trendReversalConfig,
  updateTrendReversalConfig,
} from '../src/analysis/analyzer/trendReversal/trendReversalConfig.js';

describe('batchCheckForReversalSignals', () => {
  const original = trendReversalConfig.strengthThreshold;
  afterEach(() => updateTrendReversalConfig({ strengthThreshold: original }));

  it('uses the configured default signal threshold', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    updateTrendReversalConfig({
      strengthThreshold: { ...original, defaultSignalThreshold: 60 },
    });

    const [res] = await batchCheckForReversalSignals(['X']);

    expect(res.hasSignal).toBe(false);
    expect(res.allSignals).toHaveLength(1);
  });
});
