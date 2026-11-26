import { describe, it, expect } from 'vitest';
import {
  determineExitStrategy,
  determineRiskManagement,
} from '../src/util/analysisUtils.js';
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

describe('determineExitStrategy stop levels', () => {
  const pattern = (stopLoss: number, direction: 'bullish' | 'bearish') =>
    ({
      timeframeAnalyses: [
        {
          timeframe: 'daily',
          patterns: [],
          patternSignal: direction,
          dominantPattern: {
            direction,
            reliability: 80,
            stopLoss,
            priceTarget: undefined,
          },
        },
      ],
    }) as any;
  const chip = {} as any;
  const vol = { volatilityAnalysis: { volatilityRegime: 'normal' } } as any;
  const level = (price: number, type: 'support' | 'resistance') =>
    ({
      price,
      type,
      strength: 'moderate',
      source: 'chip',
      timeframe: 'daily',
      description: '',
    }) as any;

  it('drops a long stop that sits within 0.5% of the entry', () => {
    const exit = determineExitStrategy(
      TradeDirection.Long,
      [level(98, 'support'), level(92, 'support')],
      100,
      chip,
      pattern(99.8, 'bullish'), // 形态止损只低 0.2%
      vol
    );

    const prices = exit.stopLossLevels.map(l => l.price);
    expect(prices).not.toContain(99.8);
    expect(exit.stopLossLevels[0]).toMatchObject({ type: 'fixed' });
    expect(prices[0]).toBeCloseTo(98 * 0.99, 10);
  });

  it('orders the backup stops from nearest to farthest', () => {
    const exit = determineExitStrategy(
      TradeDirection.Long,
      [level(98, 'support'), level(80, 'support')],
      100,
      chip,
      pattern(95, 'bullish'),
      vol
    );

    // 主止损 97.02，其余按离入场价由近到远：95，79.2
    expect(exit.stopLossLevels.map(l => l.price)).toEqual([
      98 * 0.99,
      95,
      80 * 0.99,
    ]);
  });

  it('drops a short stop that sits within 0.5% of the entry', () => {
    const exit = determineExitStrategy(
      TradeDirection.Short,
      [level(102, 'resistance')],
      100,
      chip,
      pattern(100.3, 'bearish'),
      vol
    );

    expect(exit.stopLossLevels.map(l => l.price)).toEqual([102 * 1.01]);
  });
});
