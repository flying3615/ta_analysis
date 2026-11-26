import { describe, it, expect, vi } from 'vitest';

vi.mock(
  '../src/analysis/basic/patterns/analyzeMultiTimeframePatterns.js',
  async importOriginal => {
    const orig =
      await importOriginal<
        typeof import('../src/analysis/basic/patterns/analyzeMultiTimeframePatterns.js')
      >();
    return { ...orig, analyzeMultiTimeframePatterns: vi.fn() };
  }
);

import type { Candle } from '../src/types.js';
import {
  analyzeMultiTimeframePatterns,
  PatternDirection,
} from '../src/analysis/basic/patterns/analyzeMultiTimeframePatterns.js';
import { PatternConsensusStrategy } from '../src/analysis/backtest/strategies/PatternConsensusStrategy.js';

const analyze = vi.mocked(analyzeMultiTimeframePatterns);

function history(n: number): Candle[] {
  const t0 = Date.parse('2024-01-01T00:00:00Z');
  return Array.from({ length: n }, (_, i) => ({
    symbol: 'T',
    open: 100,
    high: 101,
    low: 99,
    close: 100,
    volume: 1000,
    timestamp: new Date(t0 + i * 86400000),
  }));
}

function analysis(weekly: PatternDirection, daily: PatternDirection) {
  return {
    combinedSignal: weekly === daily ? weekly : PatternDirection.Neutral,
    signalStrength: 90,
    description: 'test',
    timeframeAnalyses: [
      { timeframe: 'weekly', patternSignal: weekly, patterns: [] },
      { timeframe: 'daily', patternSignal: daily, patterns: [] },
      // 回测没有小时线：小时周期总是中性
      {
        timeframe: '1hour',
        patternSignal: PatternDirection.Neutral,
        patterns: [],
      },
    ],
  } as any;
}

describe('PatternConsensusStrategy requireAllAligned', () => {
  const params = {
    requireAllAligned: true,
    minSignalStrength: 50,
    coolDownBars: 0,
    lookback: 260,
  };

  it('trades when every timeframe that has data agrees', () => {
    analyze.mockReturnValue(
      analysis(PatternDirection.Bullish, PatternDirection.Bullish)
    );
    const strat = PatternConsensusStrategy('T', 'daily', params);
    const h = history(200);

    expect(strat.generateSignal(h, 199)).toMatchObject({ direction: 'long' });
  });

  it('does not trade when weekly and daily disagree', () => {
    analyze.mockReturnValue(
      analysis(PatternDirection.Bullish, PatternDirection.Bearish)
    );
    const strat = PatternConsensusStrategy('T', 'daily', params);
    const h = history(200);

    expect(strat.generateSignal(h, 199)).toBeNull();
  });
});
