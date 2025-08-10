export type CandleConfig = {
  windows: {
    dailyLookbackDays: number; // 日线近几天检查形态
    weeklyLookbackWeeks: number; // 周线近几周检查形态
    recentLowHighWindow: number; // 最近N根K线用于支撑/阻力参考
    mixedRecentLowHighWindow: number; // 混合信号时更保守的窗口
  };
  weights: {
    weeklySignalWeight: number; // 周线信号相对权重
  };
  risk: {
    minStopLossPct: number; // 最小止损比例（例如 0.02）
    maxStopLossPct: number; // 最大止损比例（例如 0.05）
    bullishRiskReward: number; // 看多默认风险回报倍数
    bearishRiskReward: number; // 看空默认风险回报倍数
    mixedRiskReward: number; // 混合信号时更保守的RR倍数
  };
};

export let candleConfig: CandleConfig = {
  windows: {
    dailyLookbackDays: 5,
    weeklyLookbackWeeks: 5, // 5周
    recentLowHighWindow: 5,
    mixedRecentLowHighWindow: 7,
  },
  weights: {
    weeklySignalWeight: 1.5,
  },
  risk: {
    minStopLossPct: 0.02,
    maxStopLossPct: 0.05,
    bullishRiskReward: 2,
    bearishRiskReward: 2,
    mixedRiskReward: 1.5,
  },
};

export function updateCandleConfig(partial: Partial<CandleConfig>) {
  candleConfig = {
    ...candleConfig,
    ...partial,
    windows: { ...candleConfig.windows, ...(partial.windows || {}) },
    weights: { ...candleConfig.weights, ...(partial.weights || {}) },
    risk: { ...candleConfig.risk, ...(partial.risk || {}) },
  };
}
