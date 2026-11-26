import { describe, it, expect } from 'vitest';
import { determineRiskManagement } from '../src/util/analysisUtils.js';
import { RiskLevel, SignalStrength, TradeDirection } from '../src/types.js';

function sizeFor(regime: 'high' | 'extreme' | 'normal') {
  const entryStrategy = {
    idealEntryPrice: 100,
    entryType: 'immediate',
    entryZones: [],
    confirmationSignals: [],
    riskLevel: RiskLevel.Medium,
  } as any;
  const exitStrategy = { takeProfitLevels: [], stopLossLevels: [] } as any;
  const volatility = {
    volatilityAnalysis: { volatilityRegime: regime, bollingerBandWidth: 5 },
  } as any;

  return determineRiskManagement(
    TradeDirection.Long,
    entryStrategy,
    exitStrategy,
    100, // confidence 100 → 系数 1.0
    SignalStrength.Strong,
    volatility
  ).suggestionPosition;
}

describe('determineRiskManagement position sizing', () => {
  it('uses the signal-strength base size in a normal regime', () => {
    expect(sizeFor('normal')).toBeCloseTo(0.2, 8);
  });

  it('cuts the size by 40% in an extreme-volatility regime', () => {
    expect(sizeFor('extreme')).toBeCloseTo(0.12, 8);
  });

  it('cuts the size by 20% in a high-volatility regime', () => {
    expect(sizeFor('high')).toBeCloseTo(0.16, 8);
  });
});
