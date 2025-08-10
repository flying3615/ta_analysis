export interface TrendlineConfig {
  minTouches: number; // 趋势线最少触点数
  priceTolerancePercent: number; // 触达容差（相对价格）
  minSlopeAbs: number; // 斜率绝对值下限，过滤近似水平线
  maxLookbackBars: number; // 回溯最多K线数

  parallelTolerancePercent: number; // 上下边界平行容差
  channelWidthAtrMin: number; // 通道宽度下限（ATR倍数）
  channelWidthAtrMax: number; // 通道宽度上限（ATR倍数）

  breakoutThresholdPercent: number; // 突破阈值
  retestWindowBars: number; // 回踩确认窗口
  retestTolerancePercent: number; // 回踩触达容差

  scoreWeights: { touches: number; slope: number; retest: number; follow: number };
}

export const trendlineConfig: TrendlineConfig = {
  minTouches: 3,
  priceTolerancePercent: 0.003, // 0.3%
  minSlopeAbs: 0.0001,
  maxLookbackBars: 300,

  parallelTolerancePercent: 0.005,
  channelWidthAtrMin: 0.8,
  channelWidthAtrMax: 4.0,

  breakoutThresholdPercent: 0.005,
  retestWindowBars: 8,
  retestTolerancePercent: 0.003,

  scoreWeights: { touches: 25, slope: 25, retest: 30, follow: 20 },
};

export function updateTrendlineConfig(partial: Partial<TrendlineConfig>) {
  Object.assign(trendlineConfig, partial);
}


