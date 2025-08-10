export interface SdConfig {
  baseWindow: number; // 合并基础区窗口大小
  impulseWindow: number; // 检查推进的窗口
  baseRangeAtrMultiplier: number; // 基础区波幅阈值（ATR倍数）
  impulseAtrMultiplier: number; // 推进幅度阈值（ATR倍数）
  breakThresholdPercent: number; // 被突破的确认阈值
  minZoneWidthPercent: number; // 过滤过小区间
  recentRangeLookback: number; // 计算溢价/折价参考的回看窗口
}

export const sdConfig: SdConfig = {
  baseWindow: 4,
  impulseWindow: 4,
  baseRangeAtrMultiplier: 0.7,
  impulseAtrMultiplier: 1.6,
  breakThresholdPercent: 0.002,
  minZoneWidthPercent: 0.002,
  recentRangeLookback: 60,
};

export function updateSdConfig(partial: Partial<SdConfig>) {
  Object.assign(sdConfig, partial);
}
