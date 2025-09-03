import { describe, it, expect } from 'vitest';
import { calculateVolatilityAnalysis } from '../src/analysis/analyzer/volatility/volatilityAnalysis.js';
import { volatilityConfig } from '../src/analysis/analyzer/volatility/volatilityConfig.js';
import type { Candle } from '../src/types.js';

function makeFlatData(n: number, price = 100): Candle[] {
  const now = Date.now();
  return Array.from({ length: n }, (_, i) => ({
    symbol: 'TEST',
    open: price,
    high: price,
    low: price,
    close: price,
    volume: 0,
    timestamp: new Date(now + i * 86400000),
  }));
}

describe('volatility analysis', () => {
  it('handles zero-variance data without NaN', () => {
    const data = makeFlatData(60, 100);
    const res = calculateVolatilityAnalysis(data, 20);
    expect(Number.isFinite(res.historicalVolatility)).toBe(true);
    expect(Number.isFinite(res.bollingerBandWidth)).toBe(true);
    expect(Number.isFinite(res.atrPercent)).toBe(true);
    expect(['low', 'medium', 'high', 'extreme']).toContain(
      res.volatilityRegime
    );
  });

  it('respects config thresholds for squeeze', () => {
    const data = makeFlatData(100, 100);
    const res = calculateVolatilityAnalysis(data, 20);
    // 布林带宽度约为0，应小于 squeeze 阈值
    expect(res.bollingerBandWidth).toBeLessThanOrEqual(
      volatilityConfig.trend.bbSqueezeWidth
    );
  });
});
