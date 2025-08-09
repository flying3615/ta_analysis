/**
 * 趋势逆转分析配置
 * 集中管理窗口、周期、阈值与目标位参数，外部可通过 updateTrendReversalConfig 覆盖
 */
export interface TrendReversalConfig {
  // 方向与斜率判断
  trendDirection: {
    defaultPeriod: number; // determineTrendDirection 默认均线周期
    minSlopePoints: number; // 计算斜率的最小点数
  };

  // 小/大周期均线参数（detectTrendReversal 默认值）
  movingAverage: {
    smallPeriod: number;
    largePeriod: number;
  };

  // 窗口设置
  window: {
    idealWindowSize: number; // 理想窗口
    minWindowSize: number; // 窗口下限
  };

  // 止损偏移（相对最近高/低点）
  stopLossOffsetPercent: {
    long: number; // 低点下方偏移
    short: number; // 高点上方偏移
  };

  // 目标位计算
  targets: {
    fibExtension: number; // 目标3的斐波那契扩展倍数
  };

  // 信号强度判定阈值（用于展示/建议文案）
  strengthThreshold: {
    strong: number; // 强信号下限
    medium: number; // 中等信号下限
    defaultSignalThreshold: number; // Checker 默认判定阈值
  };
}

export const trendReversalConfig: TrendReversalConfig = {
  trendDirection: {
    defaultPeriod: 20,
    minSlopePoints: 5,
  },
  movingAverage: {
    smallPeriod: 15,
    largePeriod: 60,
  },
  window: {
    idealWindowSize: 20,
    minWindowSize: 5,
  },
  stopLossOffsetPercent: {
    long: 0.01,
    short: 0.01,
  },
  targets: {
    fibExtension: 1.618,
  },
  strengthThreshold: {
    strong: 70,
    medium: 50,
    defaultSignalThreshold: 40,
  },
};

export function updateTrendReversalConfig(partial: Partial<TrendReversalConfig>): void {
  if (partial.trendDirection) {
    trendReversalConfig.trendDirection = {
      ...trendReversalConfig.trendDirection,
      ...partial.trendDirection,
    };
  }
  if (partial.movingAverage) {
    trendReversalConfig.movingAverage = {
      ...trendReversalConfig.movingAverage,
      ...partial.movingAverage,
    };
  }
  if (partial.window) {
    trendReversalConfig.window = {
      ...trendReversalConfig.window,
      ...partial.window,
    };
  }
  if (partial.stopLossOffsetPercent) {
    trendReversalConfig.stopLossOffsetPercent = {
      ...trendReversalConfig.stopLossOffsetPercent,
      ...partial.stopLossOffsetPercent,
    };
  }
  if (partial.targets) {
    trendReversalConfig.targets = {
      ...trendReversalConfig.targets,
      ...partial.targets,
    };
  }
  if (partial.strengthThreshold) {
    trendReversalConfig.strengthThreshold = {
      ...trendReversalConfig.strengthThreshold,
      ...partial.strengthThreshold,
    };
  }
}


