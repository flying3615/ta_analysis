import { Candle } from '../../../types.js';

export type PatternConfig = {
  windows: {
    sliceRecentCount: number; // 参与分析的最近K线数量
    peakWindow: number; // 峰谷检测窗口
    recentEmphasis: boolean; // 是否强调最近数据
    formingNearDistance: number; // 形态"正在形成且临近"判定的最大距离
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
  // 新增：统一的形态验证参数
  validation: {
    // 价格相似度阈值（用于判断两点是否在同一水平）
    priceSimilarityThreshold: number; // 默认0.05 (5%)

    // 最小形态高度（相对于价格的百分比）
    minPatternHeightRatio: number; // 默认0.02 (2%)

    // 最小形态持续时间（K线数量）
    minPatternDuration: number; // 默认5

    // 最大形态持续时间（K线数量）
    maxPatternDuration: number; // 默认100

    // 突破确认所需的最小K线数量
    breakoutConfirmationBars: number; // 默认3

    // 突破确认的最小价格变动百分比
    breakoutConfirmationPercent: number; // 默认0.01 (1%)

    // 形态失败判定：突破后回撤超过突破幅度的百分比
    failureRetracementThreshold: number; // 默认0.6 (60%)

    // 成交量确认：突破时成交量应超过平均成交量的倍数
    volumeConfirmationMultiplier: number; // 默认1.5

    // 趋势线触碰的最小次数
    minTrendlineTouches: number; // 默认3

    // 趋势线触碰的容差百分比
    trendlineTouchTolerance: number; // 默认0.005 (0.5%)
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
  // 新增：统一的形态验证参数默认值
  validation: {
    priceSimilarityThreshold: 0.05, // 5%
    minPatternHeightRatio: 0.02, // 2%
    minPatternDuration: 5,
    maxPatternDuration: 100,
    breakoutConfirmationBars: 3,
    breakoutConfirmationPercent: 0.01, // 1%
    failureRetracementThreshold: 0.6, // 60%
    volumeConfirmationMultiplier: 1.5,
    minTrendlineTouches: 3,
    trendlineTouchTolerance: 0.005, // 0.5%
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
    validation: { ...patternConfig.validation, ...(partial.validation || {}) },
  };
}

/**
 * 检查两个价格是否在同一水平（相似度检查）
 */
export function arePricesSimilar(price1: number, price2: number): boolean {
  const avgPrice = (price1 + price2) / 2;
  const priceDiff = Math.abs(price1 - price2) / avgPrice;
  return priceDiff <= patternConfig.validation.priceSimilarityThreshold;
}

/**
 * 检查价格是否接近趋势线
 */
export function isPriceNearTrendline(
  price: number,
  trendlinePrice: number
): boolean {
  const priceDiff = Math.abs(price - trendlinePrice) / trendlinePrice;
  return priceDiff <= patternConfig.validation.trendlineTouchTolerance;
}

/**
 * 计算形态高度是否足够显著
 */
export function isPatternHeightSignificant(
  patternHeight: number,
  avgPrice: number
): boolean {
  const heightRatio = patternHeight / avgPrice;
  return heightRatio >= patternConfig.validation.minPatternHeightRatio;
}

/**
 * 检查形态持续时间是否在合理范围内
 */
export function isPatternDurationValid(duration: number): boolean {
  return (
    duration >= patternConfig.validation.minPatternDuration &&
    duration <= patternConfig.validation.maxPatternDuration
  );
}

/**
 * 检查是否为有效突破
 */
export function isValidBreakout(
  data: Candle[],
  breakoutIndex: number,
  breakoutLevel: number,
  isUpward: boolean
): boolean {
  // 检查是否有足够的确认K线
  const confirmationBars = Math.min(
    patternConfig.validation.breakoutConfirmationBars,
    data.length - breakoutIndex - 1
  );

  if (confirmationBars < 1) return false;

  let confirmedBars = 0;
  const requiredMove =
    breakoutLevel * patternConfig.validation.breakoutConfirmationPercent;

  for (let i = 1; i <= confirmationBars; i++) {
    const candle = data[breakoutIndex + i];

    if (isUpward) {
      // 向上突破：收盘价应持续高于突破水平
      if (candle.close > breakoutLevel + requiredMove) {
        confirmedBars++;
      }
    } else {
      // 向下突破：收盘价应持续低于突破水平
      if (candle.close < breakoutLevel - requiredMove) {
        confirmedBars++;
      }
    }
  }

  // 至少需要60%的确认K线满足条件
  return confirmedBars >= confirmationBars * 0.6;
}

/**
 * 检查形态是否失败
 */
export function isPatternFailed(
  data: Candle[],
  patternEndIndex: number,
  breakoutLevel: number,
  isUpward: boolean
): boolean {
  // 检查突破后的价格走势
  for (let i = patternEndIndex + 1; i < data.length; i++) {
    const candle = data[i];

    if (isUpward) {
      // 向上突破后，如果价格大幅回撤到突破水平以下，可能失败
      const retracement =
        (breakoutLevel - candle.low) / (candle.high - breakoutLevel);
      if (retracement > patternConfig.validation.failureRetracementThreshold) {
        return true;
      }
    } else {
      // 向下突破后，如果价格大幅反弹到突破水平以上，可能失败
      const retracement =
        (candle.high - breakoutLevel) / (breakoutLevel - candle.low);
      if (retracement > patternConfig.validation.failureRetracementThreshold) {
        return true;
      }
    }
  }

  return false;
}

/**
 * 标准化的形态可靠性评分系统
 */
export interface ReliabilityFactors {
  // 基础因素
  patternHeight: number; // 形态高度（绝对值）
  avgPrice: number; // 平均价格
  duration: number; // 形态持续时间（K线数量）

  // 对称性因素（适用于对称形态）
  symmetry?: number; // 对称性评分（0-1）

  // 触碰因素（适用于趋势线形态）
  trendlineTouches?: number; // 趋势线触碰次数
  expectedTouches?: number; // 预期触碰次数

  // 成交量因素
  volumeConfirmation?: boolean; // 是否有成交量确认
  volumePattern?: 'ideal' | 'good' | 'acceptable' | 'poor'; // 成交量模式质量

  // 突破因素
  breakoutConfirmed?: boolean; // 是否确认突破
  breakoutStrength?: number; // 突破强度（0-1）

  // 时间因素
  recency?: number; // 新近度（0-1，1表示最近）

  // 形态特定因素
  specificFactors?: { [key: string]: number }; // 形态特定因素
}

/**
 * 计算标准化的可靠性评分
 */
export function calculateStandardReliability(
  factors: ReliabilityFactors
): number {
  let score = 50; // 基础分数

  // 1. 形态高度评分（0-15分）
  const heightRatio = factors.patternHeight / factors.avgPrice;
  if (heightRatio > 0.1) {
    score += 15; // 高度非常显著
  } else if (heightRatio > 0.05) {
    score += 12; // 高度显著
  } else if (heightRatio > 0.03) {
    score += 8; // 高度中等
  } else if (heightRatio > 0.02) {
    score += 4; // 高度较小
  }

  // 2. 形态持续时间评分（0-10分）
  if (factors.duration > 30) {
    score += 10; // 长期形态
  } else if (factors.duration > 20) {
    score += 8; // 中长期形态
  } else if (factors.duration > 10) {
    score += 6; // 中期形态
  } else if (factors.duration > 5) {
    score += 3; // 短期形态
  }

  // 3. 对称性评分（0-10分）
  if (factors.symmetry !== undefined) {
    score += factors.symmetry * 10;
  }

  // 4. 趋势线触碰评分（0-10分）
  if (
    factors.trendlineTouches !== undefined &&
    factors.expectedTouches !== undefined
  ) {
    const touchRatio = factors.trendlineTouches / factors.expectedTouches;
    if (touchRatio >= 1) {
      score += 10; // 触碰次数达到或超过预期
    } else if (touchRatio >= 0.8) {
      score += 8; // 触碰次数接近预期
    } else if (touchRatio >= 0.6) {
      score += 5; // 触碰次数中等
    } else if (touchRatio >= 0.4) {
      score += 2; // 触碰次数较少
    }
  }

  // 5. 成交量确认评分（0-15分）
  if (factors.volumeConfirmation !== undefined) {
    if (factors.volumeConfirmation) {
      score += 15; // 有成交量确认
    } else {
      score += 5; // 无成交量确认
    }
  }

  // 6. 成交量模式质量评分（0-10分）
  if (factors.volumePattern !== undefined) {
    switch (factors.volumePattern) {
      case 'ideal':
        score += 10;
        break;
      case 'good':
        score += 7;
        break;
      case 'acceptable':
        score += 4;
        break;
      case 'poor':
        score += 0;
        break;
    }
  }

  // 7. 突破确认评分（0-15分）
  if (factors.breakoutConfirmed !== undefined) {
    if (factors.breakoutConfirmed) {
      score += 15; // 突破已确认

      // 突破强度额外加分（0-5分）
      if (factors.breakoutStrength !== undefined) {
        score += factors.breakoutStrength * 5;
      }
    } else {
      score += 5; // 突破未确认
    }
  }

  // 8. 新近度评分（0-10分）
  if (factors.recency !== undefined) {
    score += factors.recency * 10;
  }

  // 9. 形态特定因素评分（0-15分）
  if (factors.specificFactors !== undefined) {
    for (const [key, value] of Object.entries(factors.specificFactors)) {
      // 根据因素权重分配分数
      switch (key) {
        case 'headProminence': // 头肩形态头部突出程度
          score += value * 8;
          break;
        case 'necklineSlope': // 头肩形态颈线斜率
          score += value * 5;
          break;
        case 'cupDepth': // 杯柄形态杯深度
          score += value * 7;
          break;
        case 'handleDepth': // 杯柄形态柄深度
          score += value * 5;
          break;
        case 'convergenceProximity': // 三角形收敛接近度
          score += value * 6;
          break;
        default:
          score += value * 3; // 默认权重
          break;
      }
    }
  }

  // 确保分数在0-100范围内
  return Math.max(0, Math.min(100, score));
}

/**
 * 分析成交量模式质量
 */
export function analyzeVolumePatternQuality(
  data: Candle[],
  startIndex: number,
  endIndex: number,
  patternType: 'reversal' | 'continuation' | 'consolidation'
): 'ideal' | 'good' | 'acceptable' | 'poor' {
  // 计算各阶段成交量
  const patternVolumes = data
    .slice(startIndex, endIndex + 1)
    .map(d => d.volume);
  const avgPatternVolume =
    patternVolumes.reduce((sum, v) => sum + v, 0) / patternVolumes.length;

  // 计算成交量趋势
  let volumeTrend = 0;
  for (let i = 1; i < patternVolumes.length; i++) {
    volumeTrend += patternVolumes[i] > patternVolumes[i - 1] ? 1 : -1;
  }
  const trendStrength = Math.abs(volumeTrend) / (patternVolumes.length - 1);

  // 检查突破时的成交量（如果有）
  let breakoutVolume = 0;
  if (endIndex + 1 < data.length) {
    breakoutVolume = data[endIndex + 1].volume;
  }

  // 根据形态类型评估成交量模式
  if (patternType === 'reversal') {
    // 反转形态：理想情况是形态内成交量萎缩，突破时放量
    if (trendStrength < 0.3 && breakoutVolume > avgPatternVolume * 1.5) {
      return 'ideal';
    } else if (trendStrength < 0.5 && breakoutVolume > avgPatternVolume * 1.2) {
      return 'good';
    } else if (trendStrength < 0.7) {
      return 'acceptable';
    } else {
      return 'poor';
    }
  } else if (patternType === 'continuation') {
    // 持续形态：理想情况是形态内成交量萎缩，突破时放量
    if (trendStrength < 0.3 && breakoutVolume > avgPatternVolume * 1.5) {
      return 'ideal';
    } else if (trendStrength < 0.5 && breakoutVolume > avgPatternVolume * 1.2) {
      return 'good';
    } else if (trendStrength < 0.7) {
      return 'acceptable';
    } else {
      return 'poor';
    }
  } else {
    // 整理形态：理想情况是成交量逐渐萎缩
    if (trendStrength < 0.2) {
      return 'ideal';
    } else if (trendStrength < 0.4) {
      return 'good';
    } else if (trendStrength < 0.6) {
      return 'acceptable';
    } else {
      return 'poor';
    }
  }
}

/**
 * 计算突破强度
 */
export function calculateBreakoutStrength(
  data: Candle[],
  breakoutIndex: number,
  breakoutLevel: number,
  isUpward: boolean
): number {
  if (breakoutIndex >= data.length) return 0;

  const breakoutCandle = data[breakoutIndex];
  const breakoutPrice = isUpward ? breakoutCandle.close : breakoutCandle.close;
  const breakoutSize = Math.abs(breakoutPrice - breakoutLevel) / breakoutLevel;

  // 计算突破成交量
  const avgVolume =
    data
      .slice(Math.max(0, breakoutIndex - 20), breakoutIndex)
      .reduce((sum, d) => sum + d.volume, 0) / Math.min(20, breakoutIndex);

  const volumeRatio = breakoutCandle.volume / avgVolume;

  // 综合价格突破和成交量因素
  const priceStrength = Math.min(breakoutSize * 10, 1); // 标准化到0-1
  const volumeStrength = Math.min(volumeRatio / 3, 1); // 标准化到0-1

  return (priceStrength + volumeStrength) / 2;
}

/**
 * 形态冲突处理机制
 */

// 需要导入PatternType和PatternAnalysisResult类型
import {
  PatternType,
  PatternDirection,
  PatternAnalysisResult,
} from './analyzeMultiTimeframePatterns.js';

/**
 * 形态优先级枚举
 */
export enum PatternPriority {
  Critical = 5, // 关键形态（如头肩、双顶双底）
  High = 4, // 高优先级形态（如三角形、楔形）
  Medium = 3, // 中等优先级形态（如旗形、三角旗）
  Low = 2, // 低优先级形态（如圆底圆顶）
  Minor = 1, // 次要形态（如买入/卖出高潮）
}

/**
 * 获取形态类型的优先级
 */
export function getPatternPriority(patternType: PatternType): PatternPriority {
  switch (patternType) {
    case PatternType.HeadAndShoulders:
    case PatternType.InverseHeadAndShoulders:
    case PatternType.DoubleTop:
    case PatternType.DoubleBottom:
    case PatternType.TripleTop:
    case PatternType.TripleBottom:
      return PatternPriority.Critical;

    case PatternType.AscendingTriangle:
    case PatternType.DescendingTriangle:
    case PatternType.SymmetricalTriangle:
    case PatternType.RisingWedge:
    case PatternType.FallingWedge:
      return PatternPriority.High;

    case PatternType.Flag:
    case PatternType.Pennant:
    case PatternType.Rectangle:
      return PatternPriority.Medium;

    case PatternType.RoundingBottom:
    case PatternType.RoundingTop:
    case PatternType.CupAndHandle:
      return PatternPriority.Low;

    case PatternType.BuyingClimax:
    case PatternType.SellingClimax:
      return PatternPriority.Minor;

    default:
      return PatternPriority.Medium;
  }
}

/**
 * 形态冲突类型
 */
export enum ConflictType {
  DirectionConflict = 'direction_conflict', // 方向冲突（看涨vs看跌）
  OverlapConflict = 'overlap_conflict', // 重叠冲突（形态重叠）
  TimingConflict = 'timing_conflict', // 时间冲突（形成时间冲突）
  LevelConflict = 'level_conflict', // 水平冲突（关键价位冲突）
}

/**
 * 形态冲突信息
 */
export interface PatternConflict {
  type: ConflictType;
  pattern1: PatternAnalysisResult;
  pattern2: PatternAnalysisResult;
  severity: number; // 冲突严重程度（0-1）
  description: string;
}

/**
 * 检测形态冲突
 */
export function detectPatternConflicts(
  patterns: PatternAnalysisResult[]
): PatternConflict[] {
  const conflicts: PatternConflict[] = [];

  // 检查所有形态对之间的冲突
  for (let i = 0; i < patterns.length; i++) {
    for (let j = i + 1; j < patterns.length; j++) {
      const pattern1 = patterns[i];
      const pattern2 = patterns[j];

      // 检测方向冲突
      if (pattern1.direction !== pattern2.direction) {
        const directionConflict = detectDirectionConflict(pattern1, pattern2);
        if (directionConflict) {
          conflicts.push(directionConflict);
        }
      }

      // 检测重叠冲突
      const overlapConflict = detectOverlapConflict(pattern1, pattern2);
      if (overlapConflict) {
        conflicts.push(overlapConflict);
      }

      // 检测水平冲突
      const levelConflict = detectLevelConflict(pattern1, pattern2);
      if (levelConflict) {
        conflicts.push(levelConflict);
      }
    }
  }

  return conflicts;
}

/**
 * 检测方向冲突
 */
function detectDirectionConflict(
  pattern1: PatternAnalysisResult,
  pattern2: PatternAnalysisResult
): PatternConflict | null {
  // 如果方向不同且可靠性都较高，则存在方向冲突
  if (
    pattern1.direction !== pattern2.direction &&
    pattern1.reliability > 60 &&
    pattern2.reliability > 60
  ) {
    const severity = Math.min(pattern1.reliability, pattern2.reliability) / 100;

    return {
      type: ConflictType.DirectionConflict,
      pattern1,
      pattern2,
      severity,
      description: `${pattern1.patternType}(${pattern1.direction})与${pattern2.patternType}(${pattern2.direction})方向冲突`,
    };
  }

  return null;
}

/**
 * 检测重叠冲突
 */
function detectOverlapConflict(
  pattern1: PatternAnalysisResult,
  pattern2: PatternAnalysisResult
): PatternConflict | null {
  // 检查形态时间范围是否重叠
  const overlapStart = Math.max(
    pattern1.component.startIndex,
    pattern2.component.startIndex
  );
  const overlapEnd = Math.min(
    pattern1.component.endIndex,
    pattern2.component.endIndex
  );

  if (overlapStart <= overlapEnd) {
    // 计算重叠程度
    const pattern1Duration =
      pattern1.component.endIndex - pattern1.component.startIndex;
    const pattern2Duration =
      pattern2.component.endIndex - pattern2.component.startIndex;
    const overlapDuration = overlapEnd - overlapStart;

    const overlapRatio1 = overlapDuration / pattern1Duration;
    const overlapRatio2 = overlapDuration / pattern2Duration;
    const maxOverlapRatio = Math.max(overlapRatio1, overlapRatio2);

    // 如果重叠程度超过50%，则认为存在冲突
    if (maxOverlapRatio > 0.5) {
      return {
        type: ConflictType.OverlapConflict,
        pattern1,
        pattern2,
        severity: maxOverlapRatio,
        description: `${pattern1.patternType}与${pattern2.patternType}在时间上重叠${(maxOverlapRatio * 100).toFixed(1)}%`,
      };
    }
  }

  return null;
}

/**
 * 检测水平冲突
 */
function detectLevelConflict(
  pattern1: PatternAnalysisResult,
  pattern2: PatternAnalysisResult
): PatternConflict | null {
  // 检查关键价位是否冲突
  const level1 = pattern1.component.breakoutLevel;
  const level2 = pattern2.component.breakoutLevel;

  if (level1 && level2) {
    const levelDiff = Math.abs(level1 - level2) / Math.min(level1, level2);

    // 如果关键价位差异小于5%，则认为存在冲突
    if (levelDiff < 0.05) {
      return {
        type: ConflictType.LevelConflict,
        pattern1,
        pattern2,
        severity: 1 - levelDiff / 0.05, // 差异越小，冲突越严重
        description: `${pattern1.patternType}与${pattern2.patternType}的关键价位接近`,
      };
    }
  }

  return null;
}

/**
 * 解决形态冲突
 */
export function resolvePatternConflicts(
  patterns: PatternAnalysisResult[],
  conflicts: PatternConflict[]
): PatternAnalysisResult[] {
  // 如果没有冲突，直接返回
  if (conflicts.length === 0) {
    return patterns;
  }

  // 创建形态副本用于处理
  const resolvedPatterns = [...patterns];

  // 按冲突严重程度排序，优先处理严重冲突
  conflicts.sort((a, b) => b.severity - a.severity);

  for (const conflict of conflicts) {
    const { pattern1, pattern2, type, severity } = conflict;

    // 根据冲突类型和严重程度采取不同策略
    switch (type) {
      case ConflictType.DirectionConflict:
        resolveDirectionConflict(
          resolvedPatterns,
          pattern1,
          pattern2,
          severity
        );
        break;
      case ConflictType.OverlapConflict:
        resolveOverlapConflict(resolvedPatterns, pattern1, pattern2, severity);
        break;
      case ConflictType.LevelConflict:
        resolveLevelConflict(resolvedPatterns, pattern1, pattern2);
        break;
    }
  }

  return resolvedPatterns;
}

/**
 * 解决方向冲突
 */
function resolveDirectionConflict(
  patterns: PatternAnalysisResult[],
  pattern1: PatternAnalysisResult,
  pattern2: PatternAnalysisResult,
  severity: number
): void {
  // 获取形态优先级
  const priority1 = getPatternPriority(pattern1.patternType);
  const priority2 = getPatternPriority(pattern2.patternType);

  // 如果优先级不同，保留高优先级形态
  if (priority1 !== priority2) {
    if (priority1 > priority2) {
      // 降低pattern2的可靠性
      const index2 = patterns.findIndex(p => p === pattern2);
      if (index2 !== -1) {
        patterns[index2].reliability *= 1 - severity * 0.5;
      }
    } else {
      // 降低pattern1的可靠性
      const index1 = patterns.findIndex(p => p === pattern1);
      if (index1 !== -1) {
        patterns[index1].reliability *= 1 - severity * 0.5;
      }
    }
  } else {
    // 优先级相同，根据可靠性和重要性决定
    const score1 = pattern1.reliability * pattern1.significance;
    const score2 = pattern2.reliability * pattern2.significance;

    if (score1 > score2) {
      // 降低pattern2的可靠性
      const index2 = patterns.findIndex(p => p === pattern2);
      if (index2 !== -1) {
        patterns[index2].reliability *= 1 - severity * 0.3;
      }
    } else {
      // 降低pattern1的可靠性
      const index1 = patterns.findIndex(p => p === pattern1);
      if (index1 !== -1) {
        patterns[index1].reliability *= 1 - severity * 0.3;
      }
    }
  }
}

/**
 * 解决重叠冲突
 */
function resolveOverlapConflict(
  patterns: PatternAnalysisResult[],
  pattern1: PatternAnalysisResult,
  pattern2: PatternAnalysisResult,
  severity: number
): void {
  // 对于重叠冲突，根据形态类型和可靠性调整
  const priority1 = getPatternPriority(pattern1.patternType);
  const priority2 = getPatternPriority(pattern2.patternType);

  // 如果优先级不同，保留高优先级形态
  if (priority1 !== priority2) {
    if (priority1 > priority2) {
      // 降低pattern2的重要性
      const index2 = patterns.findIndex(p => p === pattern2);
      if (index2 !== -1) {
        patterns[index2].significance *= 1 - severity * 0.4;
      }
    } else {
      // 降低pattern1的重要性
      const index1 = patterns.findIndex(p => p === pattern1);
      if (index1 !== -1) {
        patterns[index1].significance *= 1 - severity * 0.4;
      }
    }
  } else {
    // 优先级相同，根据可靠性调整
    if (pattern1.reliability > pattern2.reliability) {
      // 降低pattern2的重要性
      const index2 = patterns.findIndex(p => p === pattern2);
      if (index2 !== -1) {
        patterns[index2].significance *= 1 - severity * 0.3;
      }
    } else {
      // 降低pattern1的重要性
      const index1 = patterns.findIndex(p => p === pattern1);
      if (index1 !== -1) {
        patterns[index1].significance *= 1 - severity * 0.3;
      }
    }
  }
}

/**
 * 解决水平冲突
 */
function resolveLevelConflict(
  patterns: PatternAnalysisResult[],
  pattern1: PatternAnalysisResult,
  pattern2: PatternAnalysisResult
): void {
  // 对于水平冲突，根据形态类型调整
  const priority1 = getPatternPriority(pattern1.patternType);
  const priority2 = getPatternPriority(pattern2.patternType);

  // 如果优先级不同，保留高优先级形态的关键价位
  if (priority1 !== priority2) {
    if (priority1 > priority2) {
      // 调整pattern2的突破水平
      const index2 = patterns.findIndex(p => p === pattern2);
      if (index2 !== -1) {
        // 将突破水平调整5%以避免冲突
        if (pattern2.direction === PatternDirection.Bullish) {
          patterns[index2].component.breakoutLevel *= 1.05;
        } else {
          patterns[index2].component.breakoutLevel *= 0.95;
        }
      }
    } else {
      // 调整pattern1的突破水平
      const index1 = patterns.findIndex(p => p === pattern1);
      if (index1 !== -1) {
        // 将突破水平调整5%以避免冲突
        if (pattern1.direction === PatternDirection.Bullish) {
          patterns[index1].component.breakoutLevel *= 1.05;
        } else {
          patterns[index1].component.breakoutLevel *= 0.95;
        }
      }
    }
  } else {
    // 优先级相同，根据可靠性调整
    if (pattern1.reliability > pattern2.reliability) {
      // 调整pattern2的突破水平
      const index2 = patterns.findIndex(p => p === pattern2);
      if (index2 !== -1) {
        if (pattern2.direction === PatternDirection.Bullish) {
          patterns[index2].component.breakoutLevel *= 1.03;
        } else {
          patterns[index2].component.breakoutLevel *= 0.97;
        }
      }
    } else {
      // 调整pattern1的突破水平
      const index1 = patterns.findIndex(p => p === pattern1);
      if (index1 !== -1) {
        if (pattern1.direction === PatternDirection.Bullish) {
          patterns[index1].component.breakoutLevel *= 1.03;
        } else {
          patterns[index1].component.breakoutLevel *= 0.97;
        }
      }
    }
  }
}
