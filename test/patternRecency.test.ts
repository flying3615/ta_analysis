import { describe, it, expect } from 'vitest';
import {
  combinePatternAnalyses,
  PatternDirection,
  PatternStatus,
  PatternType,
} from '../src/analysis/basic/patterns/analyzeMultiTimeframePatterns.js';

function analysisWithPatternEndingAt(endIndex: number) {
  const pattern = {
    patternType: PatternType.DoubleBottom,
    status: PatternStatus.Completed,
    direction: PatternDirection.Bullish,
    reliability: 60,
    significance: 5,
    component: {
      startIndex: endIndex - 5,
      endIndex,
      keyPoints: [],
      patternHeight: 1,
      breakoutLevel: 1,
      volumePattern: '',
    },
    priceTarget: 1,
    stopLoss: 1,
    breakoutExpected: false,
    breakoutDirection: PatternDirection.Bullish,
    probableBreakoutZone: [1, 1],
    description: '',
    tradingImplication: '',
    keyDates: [],
    keyPrices: [],
  } as any;
  return {
    timeframe: 'daily' as const,
    patterns: [pattern],
    dominantPattern: pattern,
    patternSignal: PatternDirection.Bullish,
    dataLength: 100,
  };
}

describe('pattern recency bonus', () => {
  it('gives no recency bonus to a pattern that ended 70 bars ago', () => {
    const old = combinePatternAnalyses([analysisWithPatternEndingAt(30)]);
    const fresh = combinePatternAnalyses([analysisWithPatternEndingAt(98)]);

    // 新近的形态得到 recencyHighBonus（10），旧形态不加分
    expect(fresh.signalStrength - old.signalStrength).toBe(10);
  });
});

describe('pattern description', () => {
  it('does not throw when a pattern has more key dates than key prices', () => {
    const a = analysisWithPatternEndingAt(98);
    a.dominantPattern.keyDates = [new Date(0), new Date(86400000)];
    a.dominantPattern.keyPrices = [100];

    const res = combinePatternAnalyses([a]);

    expect(res.description).toContain('100.00');
  });
});
