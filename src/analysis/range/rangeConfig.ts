export interface RangeConfig {
  atrPeriod: number; // ATR周期
  lookback: number; // 搜索最近区间的回看长度
  minBarsInRange: number; // 最小震荡持续根数
  rangeAtrMaxMultiplier: number; // 震荡区间宽度阈值（ATR倍数）
  breakoutThresholdPercent: number; // 突破确认阈值
  volumeExpansionRatio: number; // 突破时成交量相对区间均量的放大倍数
  followThroughBars: number; // 跟随观测根数
  followThroughMinPercent: number; // 跟随最小延续幅度
  retestBars: number; // 回测窗口
}

export const rangeConfig: RangeConfig = {
  atrPeriod: 14,
  lookback: 120,
  minBarsInRange: 8,
  rangeAtrMaxMultiplier: 1.2,
  breakoutThresholdPercent: 0.003, // 0.3%
  volumeExpansionRatio: 1.4,
  followThroughBars: 3,
  followThroughMinPercent: 0.006, // 0.6%
  retestBars: 5,
};

export function updateRangeConfig(partial: Partial<RangeConfig>) {
  Object.assign(rangeConfig, partial);
}


