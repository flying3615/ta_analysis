export type PatternConfig = {
  windows: {
    sliceRecentCount: number; // 参与分析的最近K线数量
    peakWindow: number; // 峰谷检测窗口
    recentEmphasis: boolean; // 是否强调最近数据
    formingNearDistance: number; // 形态“正在形成且临近”判定的最大距离
  };
  weights: {
    timeframe: { weekly: number; daily: number; '1hour': number };
    confirmedBoost: number; // 已确认突破形态的权重倍数
    formingBoost: number; // 正在形成且临近的权重倍数
    patternDistanceDecay: number; // 形态距离衰减系数 (用于 exp(-k*distance))
    peakImportanceDecay: number; // 峰谷重要性衰减系数 (用于 exp(-k*distance))
  };
  signals: {
    strongRatio: number; // 单边强信号阈值（bullishScore > bearishScore * strongRatio）
    combineBiasRatio: number; // 多时间框架偏向阈值（bullishCount > bearishCount * combineBiasRatio）
    recentCount: number; // 参与综合信号计算的最近形态数量
    reliabilityBoostThreshold: number; // 可靠性提升阈值
    recencyHighThreshold: number; // 形态新近度高阈值
    recencyMediumThreshold: number; // 形态新近度中阈值
    recencyHighBonus: number; // 高新近度加分
    recencyMediumBonus: number; // 中新近度加分
  };
};

export let patternConfig: PatternConfig = {
  windows: {
    sliceRecentCount: 100,
    peakWindow: 5,
    recentEmphasis: true,
    formingNearDistance: 5,
  },
  weights: {
    timeframe: { weekly: 1.5, daily: 1.3, '1hour': 1.0 },
    confirmedBoost: 1.5,
    formingBoost: 1.3,
    patternDistanceDecay: 0.05,
    peakImportanceDecay: 0.01,
  },
  signals: {
    strongRatio: 1.5,
    combineBiasRatio: 1.2,
    recentCount: 10,
    reliabilityBoostThreshold: 70,
    recencyHighThreshold: 0.8,
    recencyMediumThreshold: 0.6,
    recencyHighBonus: 10,
    recencyMediumBonus: 5,
  },
};

export function updatePatternConfig(partial: Partial<PatternConfig>) {
  patternConfig = {
    ...patternConfig,
    ...partial,
    windows: { ...patternConfig.windows, ...(partial.windows || {}) },
    weights: {
      ...patternConfig.weights,
      ...(partial.weights || {}),
      timeframe: {
        ...patternConfig.weights.timeframe,
        ...((partial.weights && partial.weights.timeframe) || {}),
      },
    },
    signals: { ...patternConfig.signals, ...(partial.signals || {}) },
  };
}
