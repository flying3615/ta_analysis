export interface RangeBreakoutStrategyConfig {
  minQuality: number;
  requireRetest: boolean;
}

export interface TrendlineStrategyConfig {
  minLookbackBars: number; // 触发前至少需要的历史K线
  coolDownMinGap: number; // 最小信号间隔
  reverseMinGap: number; // 反向信号的最小间隔
  momentumPeriod: number; // 动量周期
  momentumUpThreshold: number; // 强上行动量阈值（比例）
  momentumDownThreshold: number; // 强下行动量阈值（比例）
  volumePeriod: number; // 成交量均线周期
  highVolumeFactor: number; // 高成交量系数
  trendStrengthConsecutive: number; // 连续上涨/下跌K线数量阈值
  risingChannelSlopeMin: number; // 上升通道斜率下限
  fallingChannelSlopeMax: number; // 下降通道斜率上限（负值）
  strongMomentumCancelAbs: number; // 超强动量绝对值，反向信号取消
  reverseSignalStrengthMin: number; // 反向信号通过的最小强度
}

export interface StructureBreakoutStrategyConfig {
  preferEvent: 'BOS' | 'CHOCH' | 'any';
  confirmTrend: boolean;
  minLookback: number;
  coolDownBars: number;
}

export interface SupplyDemandRetestStrategyConfig {
  minZoneWidthPercent: number;
  allowFreshEntry: boolean;
  requireTested: boolean;
  coolDownBars: number;
}

export interface PatternConsensusStrategyConfig {
  minSignalStrength: number;
  requireAllAligned: boolean;
  coolDownBars: number;
  lookback: number;
}

export interface BacktestStrategiesConfig {
  rangeBreakout: RangeBreakoutStrategyConfig;
  trendline: TrendlineStrategyConfig;
  structureBreakout: StructureBreakoutStrategyConfig;
  supplyDemandRetest: SupplyDemandRetestStrategyConfig;
  patternConsensus: PatternConsensusStrategyConfig;
  integrationFilter: {
    requireRangeConfirm: boolean;
    rangeMinQuality: number;
    requireStructureConfirm: boolean;
    structureEventType: 'BOS' | 'CHOCH' | 'any';
    confirmWithinBars: number;
    coolDownBars: number;
  };
}

export const backtestStrategiesConfig: BacktestStrategiesConfig = {
  rangeBreakout: {
    minQuality: 60,
    requireRetest: true,
  },
  trendline: {
    minLookbackBars: 80,
    coolDownMinGap: 5,
    reverseMinGap: 15,
    momentumPeriod: 20,
    momentumUpThreshold: 0.1,
    momentumDownThreshold: -0.1,
    volumePeriod: 10,
    highVolumeFactor: 1.5,
    trendStrengthConsecutive: 5,
    risingChannelSlopeMin: 0.0002,
    fallingChannelSlopeMax: -0.0002,
    strongMomentumCancelAbs: 0.15,
    reverseSignalStrengthMin: 80,
  },
  structureBreakout: {
    preferEvent: 'BOS',
    confirmTrend: true,
    minLookback: 80,
    coolDownBars: 10,
  },
  supplyDemandRetest: {
    minZoneWidthPercent: 0.02,
    allowFreshEntry: false,
    requireTested: true,
    coolDownBars: 10,
  },
  patternConsensus: {
    minSignalStrength: 55,
    requireAllAligned: false,
    coolDownBars: 10,
    lookback: 260,
  },
  integrationFilter: {
    requireRangeConfirm: true,
    rangeMinQuality: 75,
    requireStructureConfirm: true,
    structureEventType: 'BOS',
    confirmWithinBars: 10,
    coolDownBars: 5,
  },
};

export function updateBacktestStrategiesConfig(
  updates: Partial<BacktestStrategiesConfig>
): void {
  Object.assign(backtestStrategiesConfig, {
    ...updates,
    rangeBreakout: {
      ...backtestStrategiesConfig.rangeBreakout,
      ...(updates.rangeBreakout ?? {}),
    },
    trendline: {
      ...backtestStrategiesConfig.trendline,
      ...(updates.trendline ?? {}),
    },
    structureBreakout: {
      ...backtestStrategiesConfig.structureBreakout,
      ...(updates.structureBreakout ?? {}),
    },
    supplyDemandRetest: {
      ...backtestStrategiesConfig.supplyDemandRetest,
      ...(updates.supplyDemandRetest ?? {}),
    },
    patternConsensus: {
      ...backtestStrategiesConfig.patternConsensus,
      ...(updates.patternConsensus ?? {}),
    },
    integrationFilter: {
      ...backtestStrategiesConfig.integrationFilter,
      ...(updates.integrationFilter ?? {}),
    },
  });
}
