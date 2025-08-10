/**
 * 支撑/阻力 + 近期多空信号（BBSR）分析配置
 * 集中管理可调参数，便于外部项目按需覆盖
 */
export interface SrConfig {
  /**
   * 枢轴点计算窗口：左侧与右侧bar数量
   */
  pivot: {
    leftBars: number;
    rightBars: number;
  };

  /**
   * 判断“接近支撑/阻力”的阈值（百分比，0.1 表示 ±10%）
   */
  nearThresholdPercent: number;

  /**
   * 时间周期权重（供后续综合评分使用，当前仅预留）
   */
  timeframeWeights: {
    weekly: number;
    daily: number;
  };
}

export const srConfig: SrConfig = {
  pivot: {
    leftBars: 10,
    rightBars: 10,
  },
  nearThresholdPercent: 0.1,
  timeframeWeights: {
    weekly: 0.6,
    daily: 0.4,
  },
};

export function updateSrConfig(partial: Partial<SrConfig>): void {
  // 浅合并 + 针对嵌套对象的合并
  if (partial.pivot) {
    srConfig.pivot = { ...srConfig.pivot, ...partial.pivot };
  }
  if (partial.timeframeWeights) {
    srConfig.timeframeWeights = {
      ...srConfig.timeframeWeights,
      ...partial.timeframeWeights,
    };
  }
  if (typeof partial.nearThresholdPercent === 'number') {
    srConfig.nearThresholdPercent = partial.nearThresholdPercent;
  }
}
