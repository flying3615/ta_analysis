/**
 * 全局筹码分析配置，用于控制评分、阈值与组合策略。
 */
export type ChipConfig = {
  /** 买入评分配置 */
  buy: {
    /** 筹码集中度加分：高/中/低 */
    concentration: { high: number; medium: number; low: number };
    /** 多空比相关：强多/中多/强空的加权与触发比例阈值 */
    bullBear: {
      strongBull: number; // 强多加分
      moderateBull: number; // 中多加分
      strongBear: number; // 强空减分（为负数）
      strongBullRatio: number; // 触发强多的多空比阈值
      moderateBullRatio: number; // 触发中多的多空比阈值
      strongBearRatio: number; // 触发强空的多空比阈值
    };
    /** 阻力强弱：弱/中 阶梯加分（强时为0） */
    resistance: { weak: number; medium: number };
    /** 形态看多信号加分 */
    shapeBuy: number;
    /** 成交量与获利盘阈值：缩量、放量与突破/顶部情形的加权 */
    volume: {
      shrinkStrong: number; // 明显缩量
      expandSmall: number; // 小幅放量
      expandBreakout: number; // 突破期放量
      expandTop: number; // 顶部放量（常为负分）
      breakoutProfitThreshold: number; // 判定突破期的获利盘比例阈值（%）
      topProfitThreshold: number; // 判定顶部的获利盘比例阈值（%）
    };
    /** 筹码迁移方向加权 */
    migration: { strongUp: number; slowUp: number; strongDown: number };
    /** 技术信号加权 */
    technical: { strongBuy: number; buy: number; strongSell: number; sell: number };
  };
  /** 卖空评分配置 */
  short: {
    /** 筹码集中度对做空的影响（高集中通常不利于做空） */
    concentration: { high: number; medium: number; low: number };
    /** 多空比相关：强空/轻空/强多 的加权与触发比例阈值 */
    bullBear: {
      strongBear: number; // 强空加分
      slightBear: number; // 轻空加分
      strongBull: number; // 强多减分（为负数）
      strongBearRatio: number; // 触发强空的多空比阈值
      slightBearRatio: number; // 触发轻空的多空比阈值
      strongBullRatio: number; // 触发强多的多空比阈值
    };
    /** 阻力强弱：强/中/弱 分别加/减分 */
    resistance: { strong: number; medium: number; weak: number };
    /** 与买入相反的形态评分（看多形态对做空不利） */
    shapeAgainstBuy: number;
    /** 成交量与获利盘阈值：顶部/高位缩量/底部放量 的加权 */
    volume: {
      expandTop: number; // 顶部放量
      shrinkHigh: number; // 高位缩量
      expandBottom: number; // 底部放量（常为负分）
      topProfitThreshold: number; // 顶部判定阈值（%）
      bottomProfitThreshold: number; // 底部判定阈值（%）
    };
    /** 筹码迁移方向对做空的影响 */
    migration: { strongDown: number; slowDown: number; strongUp: number; slowUp: number };
    /** 技术信号加权（做空） */
    technical: { strongSell: number; sell: number; strongBuy: number; buy: number };
    /** RSI 超买/超卖阈值与对应加权 */
    rsi: { overbought: number; oversold: number; overboughtThreshold: number; oversoldThreshold: number };
  };
  /** 综合建议阈值配置 */
  overall: {
    buyStrongThreshold: number; // 多头强阈值（>= 则偏多）
    buyVeryStrongThreshold: number; // 多头极强阈值
    shortStrongThreshold: number; // 空头强阈值
    shortVeryStrongThreshold: number; // 空头极强阈值
    neutralLower: number; // 中性下界
    neutralUpper: number; // 中性上界
    biasDelta: number; // 多空偏差阈值（用于偏多/偏空判断）
  };
  /** 多时间框架组合参数 */
  combine: {
    signalDiffThreshold: number; // 多空综合信号差的阈值
    alignmentStrongThreshold: number; // 多时间框架一致性“强”的百分比阈值
    groupProximityThreshold: number; // 关键价位聚合的相对距离阈值
  };
};

export let chipConfig: ChipConfig = {
  buy: {
    concentration: { high: 15, medium: 10, low: 5 },
    bullBear: { strongBull: 15, moderateBull: 10, strongBear: -10, strongBullRatio: 3, moderateBullRatio: 1.5, strongBearRatio: 0.5 },
    resistance: { weak: 20, medium: 10 },
    shapeBuy: 20,
    volume: { shrinkStrong: 10, expandSmall: 15, expandBreakout: 20, expandTop: -10, breakoutProfitThreshold: 30, topProfitThreshold: 60 },
    migration: { strongUp: 10, slowUp: 15, strongDown: -10 },
    technical: { strongBuy: 15, buy: 10, strongSell: -15, sell: -10 },
  },
  short: {
    concentration: { high: -15, medium: -5, low: 10 },
    bullBear: { strongBear: 20, slightBear: 10, strongBull: -20, strongBearRatio: 0.5, slightBearRatio: 1, strongBullRatio: 3 },
    resistance: { strong: 20, medium: 10, weak: -5 },
    shapeAgainstBuy: 15,
    volume: { expandTop: 15, shrinkHigh: 10, expandBottom: -15, topProfitThreshold: 60, bottomProfitThreshold: 30 },
    migration: { strongDown: 20, slowDown: 10, strongUp: -20, slowUp: -10 },
    technical: { strongSell: 20, sell: 15, strongBuy: -20, buy: -15 },
    rsi: { overbought: 15, oversold: -15, overboughtThreshold: 70, oversoldThreshold: 30 },
  },
  overall: {
    buyStrongThreshold: 60,
    buyVeryStrongThreshold: 80,
    shortStrongThreshold: 60,
    shortVeryStrongThreshold: 80,
    neutralLower: 40,
    neutralUpper: 60,
    biasDelta: 15,
  },
  combine: {
    signalDiffThreshold: 20,
    alignmentStrongThreshold: 70,
    groupProximityThreshold: 0.02,
  },
};

export function updateChipConfig(partial: Partial<ChipConfig>) {
  chipConfig = {
    ...chipConfig,
    ...partial,
    buy: { ...chipConfig.buy, ...(partial.buy || {}) },
    short: { ...chipConfig.short, ...(partial.short || {}) },
    overall: { ...chipConfig.overall, ...(partial.overall || {}) },
    combine: { ...chipConfig.combine, ...(partial.combine || {}) },
  };
}


