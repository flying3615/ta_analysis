import { describe, it, expect } from 'vitest';
import { determineRiskManagement } from '../src/util/analysisUtils.js';
import { RiskLevel, SignalStrength, TradeDirection } from '../src/types.js';

function planFor(
  regime: 'high' | 'extreme' | 'normal',
  strength: SignalStrength = SignalStrength.Strong
) {
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
    strength,
    volatility
  );
}

const sizeFor = (regime: 'high' | 'extreme' | 'normal') =>
  planFor(regime).suggestionPosition;

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

describe('determineRiskManagement max loss', () => {
  it('allows 1% loss for a small (10%) position', () => {
    const plan = planFor('normal', SignalStrength.Weak);
    expect(plan.suggestionPosition).toBeCloseTo(0.1, 8);
    expect(plan.maxLoss).toBe('账户总资金的1.0%');
  });

  it('allows 2% loss for a larger (20%) position', () => {
    const plan = planFor('normal', SignalStrength.Strong);
    expect(plan.suggestionPosition).toBeCloseTo(0.2, 8);
    expect(plan.maxLoss).toBe('账户总资金的2.0%');
  });
});

describe('determineRiskManagement risk/reward', () => {
  const entryStrategy = {
    idealEntryPrice: 100,
    entryType: 'pullback',
    entryZones: [],
    confirmationSignals: [],
    riskLevel: RiskLevel.Medium,
  } as any;
  const volatility = {
    volatilityAnalysis: { volatilityRegime: 'normal', bollingerBandWidth: 5 },
  } as any;

  it('measures risk to the primary (fixed) stop, not the nearest one', () => {
    const exitStrategy = {
      takeProfitLevels: [{ price: 106, proportion: 1, reasoning: '' }],
      stopLossLevels: [
        { price: 97.6, type: 'fixed', reasoning: '' }, // 主止损 −2.4%
        { price: 90, type: 'trailing', reasoning: '' },
        { price: 99.8, type: 'trailing', reasoning: '' }, // 只低 0.2%
      ],
    } as any;

    const rm = determineRiskManagement(
      TradeDirection.Long,
      entryStrategy,
      exitStrategy,
      100,
      SignalStrength.Moderate,
      volatility
    );

    // 收益 6 / 风险 2.4 = 2.5
    expect(rm.riskRewardRatio).toBeCloseTo(6 / 2.4, 6);
  });

  it('uses the primary stop above entry for shorts', () => {
    const exitStrategy = {
      takeProfitLevels: [{ price: 94, proportion: 1, reasoning: '' }],
      stopLossLevels: [
        { price: 103, type: 'fixed', reasoning: '' },
        { price: 100.1, type: 'trailing', reasoning: '' },
      ],
    } as any;

    const rm = determineRiskManagement(
      TradeDirection.Short,
      entryStrategy,
      exitStrategy,
      100,
      SignalStrength.Moderate,
      volatility
    );

    expect(rm.riskRewardRatio).toBeCloseTo(6 / 3, 6);
  });
});
