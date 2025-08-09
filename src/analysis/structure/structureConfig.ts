/**
 * Market Structure 配置
 */
export interface StructureConfig {
  pivot: {
    leftBars: number;
    rightBars: number;
  };
  thresholds: {
    breakThresholdPercent: number; // 结构突破确认的最小超越比例（收盘相对前高/前低）
    equalTolerancePercent: number; // 等高/等低容忍度
    minSwingDistancePercent: number; // 过滤过小 swing 的最小波动
  };
  timeframeWeights: {
    weekly: number;
    daily: number;
    '1hour': number;
  };
}

export const structureConfig: StructureConfig = {
  pivot: { leftBars: 3, rightBars: 3 },
  thresholds: {
    breakThresholdPercent: 0.003, // 0.3%
    equalTolerancePercent: 0.002, // 0.2%
    minSwingDistancePercent: 0.005, // 0.5%
  },
  timeframeWeights: { weekly: 0.4, daily: 0.4, '1hour': 0.2 },
};

export function updateStructureConfig(partial: Partial<StructureConfig>) {
  if (partial.pivot) structureConfig.pivot = { ...structureConfig.pivot, ...partial.pivot };
  if (partial.thresholds) structureConfig.thresholds = { ...structureConfig.thresholds, ...partial.thresholds };
  if (partial.timeframeWeights)
    structureConfig.timeframeWeights = { ...structureConfig.timeframeWeights, ...partial.timeframeWeights } as any;
}


