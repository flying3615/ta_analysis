/**
 * 波动率分析配置
 * 将阈值、周期、窗口、权重集中管理，外部可通过 updateVolatilityConfig 覆盖
 */
export interface VolatilityConfig {
  periods: {
    atr: number; // ATR计算周期
    smaShort: number; // 布林带SMA周期
    smaLong: number; // 长期均线（如200日）
    defaultLookback: number; // 默认回溯期
  };

  sharpe: {
    annualFactor: number; // 年化因子（交易日）
    riskFreeRateAnnual: number; // 年化无风险利率（小数）
  };

  regime: {
    low: { atrPercentMax: number; bbWidthMax: number };
    medium: { atrPercentMax: number; bbWidthMax: number };
    high: { atrPercentMax: number; bbWidthMax: number };
  };

  trend: {
    fiveDayIncreaseFast: number; // 近5日ATR变化阈值(%)：快速增加
    fiveDayIncrease: number; // 稳步增加
    fiveDayDecreaseFast: number; // 显著下降
    fiveDayDecrease: number; // 逐渐下降
    bbSqueezeWidth: number; // 布林带挤压阈值
  };

  transition: {
    prevWindow: number; // 过渡分析之前窗口长度
    currWindow: number; // 过渡分析当前窗口长度
    lookback: number; // 窗口内波动率分析回溯
    atrChangeToStrengthFactor: number; // ATR变化映射到强度的放大系数
  };

  pricePosition: {
    yearDays: number; // 近一年样本天数
  };

  bottomSignal: {
    nearYearLowPercent: number; // 价格位置接近低点判定阈值(%)
    bbSqueezeForBottom: number; // 布林带挤压阈值
    recentSlice: number; // 近期收盘/成交量窗口
    previousSlice: number; // 前期收盘/成交量窗口
    volumeIncreaseFactor: number; // 放量阈值倍率
    previousTrendThreshold: number; // 前期下跌阈值
    recentTrendThreshold: number; // 近期企稳阈值
    weights: {
      nearLow: number;
      highVolFalling: number;
      bbSqueeze: number;
      stabilize: number;
      volumeIncrease: number;
    };
    bottomStrongThreshold: number; // 认定潜在底部的强度阈值
  };
}

export const volatilityConfig: VolatilityConfig = {
  periods: {
    atr: 14,
    smaShort: 20,
    smaLong: 200,
    defaultLookback: 20,
  },
  sharpe: {
    annualFactor: 252,
    riskFreeRateAnnual: 0.04,
  },
  regime: {
    low: { atrPercentMax: 1.2, bbWidthMax: 3.0 },
    medium: { atrPercentMax: 2.5, bbWidthMax: 6.0 },
    high: { atrPercentMax: 4.0, bbWidthMax: 10.0 },
  },
  trend: {
    fiveDayIncreaseFast: 15,
    fiveDayIncrease: 5,
    fiveDayDecreaseFast: -15,
    fiveDayDecrease: -5,
    bbSqueezeWidth: 3,
  },
  transition: {
    prevWindow: 60,
    currWindow: 30,
    lookback: 10,
    atrChangeToStrengthFactor: 5,
  },
  pricePosition: {
    yearDays: 250,
  },
  bottomSignal: {
    nearYearLowPercent: 80,
    bbSqueezeForBottom: 3.5,
    recentSlice: 10,
    previousSlice: 10,
    volumeIncreaseFactor: 1.3,
    previousTrendThreshold: -0.05,
    recentTrendThreshold: -0.01,
    weights: {
      nearLow: 20,
      highVolFalling: 15,
      bbSqueeze: 10,
      stabilize: 20,
      volumeIncrease: 15,
    },
    bottomStrongThreshold: 50,
  },
};

export function updateVolatilityConfig(partial: Partial<VolatilityConfig>): void {
  if (partial.periods) volatilityConfig.periods = { ...volatilityConfig.periods, ...partial.periods };
  if (partial.sharpe) volatilityConfig.sharpe = { ...volatilityConfig.sharpe, ...partial.sharpe };
  if (partial.regime) volatilityConfig.regime = { ...volatilityConfig.regime, ...partial.regime } as any;
  if (partial.trend) volatilityConfig.trend = { ...volatilityConfig.trend, ...partial.trend };
  if (partial.transition) volatilityConfig.transition = { ...volatilityConfig.transition, ...partial.transition };
  if (partial.pricePosition) volatilityConfig.pricePosition = { ...volatilityConfig.pricePosition, ...partial.pricePosition };
  if (partial.bottomSignal) {
    volatilityConfig.bottomSignal = {
      ...volatilityConfig.bottomSignal,
      ...partial.bottomSignal,
      weights: {
        ...volatilityConfig.bottomSignal.weights,
        ...(partial.bottomSignal as any).weights,
      },
    };
  }
}


