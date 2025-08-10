import {
  MultiTimeframeAnalysisResult,
  multiTimeFrameChipDistAnalysis,
} from './chip/multiTimeFrameChipDistributionAnalysis.js';
import { PatternDirection } from './patterns/analyzeMultiTimeframePatterns.js';
import { formatTradePlanOutput } from './FormatTradePlan.js';
import {
  EnhancedPatternAnalysis,
  multiTimeframePatternAnalysis,
} from './trendReversal/multiTimeFrameTrendReversal.js';
import { getStockDataForTimeframe } from '../util/util.js';
import { multiTimeBBSRAnalysis } from './sr/multiTimeFrameBBSRAnalysis.js';
import type { MultiTimeFrameBBSRAnalysisResult } from '../types.js';
import { CombinedVVAnalysisResult } from './volatility/volumeVolatilityAnalysis.js';
import {
  determineEntryStrategy,
  determineExitStrategy,
  determineRiskManagement,
  generateConfirmationSignals,
  generateInvalidationConditions,
  generateKeyObservations,
  generatePrimaryRationale,
  generateSecondaryRationale,
  generateSummary,
  generateWarnings,
} from '../util/analysisUtils.js';
import {
  IntegratedTradePlan,
  KeyLevel,
  SignalStrength,
  TradeDirection,
} from '../types.js';
import { executeEnhancedCombinedAnalysis } from './volatility/volatilityAnalysis.js';
import { analyzeStructure } from './structure/structureDetector.js';
import { analyzeSupplyDemand } from './supplyDemand/sdDetector.js';
import { analyzeRange } from './range/rangeDetector.js';
import type { StructureResult } from './structure/structureTypes.js';
import type { SdAnalysisResult } from './supplyDemand/sdTypes.js';
import type { RangeAnalysisResult } from './range/rangeTypes.ts';

// 定义决策阈值
const SCORE_THRESHOLD_LONG = 15;
const SCORE_THRESHOLD_SHORT = -15;
const VOLATILITY_ADJUSTED_SCORE_STRONG = 60;
const VOLATILITY_ADJUSTED_SCORE_MODERATE = 40;
const VOLATILITY_ADJUSTED_SCORE_WEAK = 20;

const DEFAULT_WEIGHTS = {
  chip: 0.25,
  pattern: 0.35,
  volume: 0.25,
  bbsr: 0.15,
};

/**
 * 将形态分析信号转换为交易方向
 */
function convertPatternDirectionToTradeDirection(
  patternDirection: PatternDirection
): TradeDirection {
  if (patternDirection === PatternDirection.Bullish) {
    return TradeDirection.Long;
  } else if (patternDirection === PatternDirection.Bearish) {
    return TradeDirection.Short;
  }
  return TradeDirection.Neutral;
}

/**
 * 计算加权分数
 */
function calculateWeightedScore(
  score: number,
  weight: number,
  direction: TradeDirection
): number {
  const directionMultiplier =
    direction === TradeDirection.Long
      ? 1
      : direction === TradeDirection.Short
        ? -1
        : 0;

  return score * weight * directionMultiplier;
}

/**
 * 根据分数确定信号强度
 */
function determineSignalStrength(
  score: number,
  chipDirection: TradeDirection,
  patternDirection: TradeDirection
): SignalStrength {
  if (score > VOLATILITY_ADJUSTED_SCORE_STRONG) {
    return SignalStrength.Strong;
  } else if (score > VOLATILITY_ADJUSTED_SCORE_MODERATE) {
    return SignalStrength.Moderate;
  } else if (score > VOLATILITY_ADJUSTED_SCORE_WEAK) {
    return SignalStrength.Weak;
  } else if (
    chipDirection !== patternDirection &&
    chipDirection !== TradeDirection.Neutral &&
    patternDirection !== TradeDirection.Neutral
  ) {
    return SignalStrength.Conflicting;
  }
  return SignalStrength.Neutral;
}

/**
 * 添加关键价位到列表
 */
function addKeyLevels(
  keyLevels: KeyLevel[],
  source: 'chip' | 'pattern' | 'combined',
  timeframe: 'weekly' | 'daily' | '1hour',
  levels: number[],
  type: 'support' | 'resistance',
  description: string
): void {
  levels.forEach((level, index) => {
    keyLevels.push({
      price: level,
      type: type,
      strength: index < 2 ? 'strong' : 'moderate',
      source: source,
      timeframe: timeframe,
      description: description,
    });
  });
}

/**
 * 综合筹码和形态分析结果的方法
 * @param combinedVolumeVolatilityAnalysis 波动率和成交量分析结果
 * @param chipAnalysis 筹码分布分析结果
 * @param patternAnalysis 形态分析结果
 * @param bbsrAnalysis 支撑阻力分析结果
 * @param customWeights 自定义权重，默认均分
 *
 * 注意：波动率分析用于调整信号强度和置信度。
 * 交易方向仅由筹码分析和形态分析决定，权重中的volatility参数影响波动率对信号强度的调整程度。
 */
function integrateAnalyses(
  combinedVolumeVolatilityAnalysis: CombinedVVAnalysisResult,
  chipAnalysis: MultiTimeframeAnalysisResult,
  patternAnalysis: EnhancedPatternAnalysis,
  bbsrAnalysis: MultiTimeFrameBBSRAnalysisResult,
  structureDaily: StructureResult,
  sdDaily: SdAnalysisResult,
  rangeDaily: RangeAnalysisResult,
  customWeights: {
    chip: number;
    pattern: number;
    volume: number;
    bbsr: number;
  } = DEFAULT_WEIGHTS
): IntegratedTradePlan {
  // 确保权重总和为1
  const totalWeight =
    customWeights.chip +
    customWeights.pattern +
    customWeights.volume +
    customWeights.bbsr;
  const normalizedWeights = {
    chip: customWeights.chip / totalWeight,
    pattern: customWeights.pattern / totalWeight,
    volume: customWeights.volume / totalWeight,
    bbsr: customWeights.bbsr / totalWeight,
  };

  // 确定基本信息
  const symbol = chipAnalysis.symbol;
  const currentPrice = chipAnalysis.currentPrice;
  const date = new Date();

  // 提取筹码分析的信号
  let chipDirection: TradeDirection = TradeDirection.Neutral;
  if (
    chipAnalysis.combinedBuySignalStrength >
    chipAnalysis.combinedShortSignalStrength + 20
  ) {
    chipDirection = TradeDirection.Long;
  } else if (
    chipAnalysis.combinedShortSignalStrength >
    chipAnalysis.combinedBuySignalStrength + 20
  ) {
    chipDirection = TradeDirection.Short;
  }

  // 提取形态分析的信号
  const patternDirection = convertPatternDirectionToTradeDirection(
    patternAnalysis.combinedSignal
  );

  // 提取BBSR分析的信号
  let bbsrDirection = TradeDirection.Neutral;
  let bbsrScore = 0;
  if (bbsrAnalysis.dailyBBSRResult) {
    bbsrScore = bbsrAnalysis.dailyBBSRResult.strength;
    bbsrDirection = convertPatternDirectionToTradeDirection(
      bbsrAnalysis.dailyBBSRResult.signal.patternType
    );
  }

  // 计算各自的贡献分数
  const chipScore = Math.max(
    0,
    Math.min(
      100,
      Math.abs(
        chipAnalysis.combinedBuySignalStrength -
          chipAnalysis.combinedShortSignalStrength
      )
    )
  );
  const patternScore = patternAnalysis.signalStrength;

  // 获取波动率和成交量分析数据
  const volAnalysis =
    combinedVolumeVolatilityAnalysis.volatilityAnalysis.volatilityAnalysis;
  const volPriceConfirmation =
    combinedVolumeVolatilityAnalysis.volumeAnalysis.volumeAnalysis;

  // 提取成交量分析方向
  const volumeAnalysisDirection = volPriceConfirmation.adTrend;
  const volumeAnalysisForce = volPriceConfirmation.volumeForce;
  const volumeBasedDirection =
    volumeAnalysisForce > 0
      ? convertPatternDirectionToTradeDirection(volumeAnalysisDirection)
      : TradeDirection.Neutral;

  // 计算波动率强度评分 (0-100)
  // 综合ATR百分比和布林带宽度
  const volatilityStrength = Math.min(
    100,
    Math.max(
      0,
      volAnalysis.atrPercent * 20 + // ATR百分比贡献
        volAnalysis.bollingerBandWidth * 5 // 布林带宽度贡献
    )
  );

  // 波动率分析逻辑 - 计算波动率信号强度而非方向
  let directionScore = 0;
  if (volatilityStrength > 50) {
    // 高波动率情况
    if (volAnalysis.isVolatilityIncreasing) {
      // 高波动率上升 - 波动率上升时，成交量确认更重要
      directionScore += volPriceConfirmation.volumePriceConfirmation ? 40 : -40;
    } else {
      // 高波动率下降 - 波动率下降时，通常是反转信号
      directionScore += volPriceConfirmation.volumePriceConfirmation ? -30 : 30;
    }

    // 极高波动率时的额外调整
    if (volAnalysis.atrPercent > 3.5) {
      // 极高波动率通常意味着趋势加速或即将反转
      const extremeVolatilityAdjustment = volAnalysis.isVolatilityIncreasing
        ? 15
        : -15;
      directionScore += extremeVolatilityAdjustment;
    }
  } else if (volatilityStrength > 25) {
    // 中等波动率情况 - 更平衡地考虑波动率和成交量
    if (volAnalysis.isVolatilityIncreasing) {
      directionScore += 20; // 波动率上升
    } else {
      directionScore -= 20; // 波动率下降
    }

    // 成交量确认在中等波动率下的贡献
    directionScore += volPriceConfirmation.volumePriceConfirmation ? 25 : -25;
  } else {
    // 低波动率情况 - 信号较弱，主要依赖成交量确认
    directionScore += volPriceConfirmation.volumePriceConfirmation ? 15 : -15;

    // 低波动率环境下，整体信号强度降低
    directionScore = directionScore * 0.7;
  }

  // 波动率信号强度保存，用于后续信号强度计算
  const volatilitySignalStrength = Math.abs(directionScore);

  // 应用权重计算各分析的得分
  const chipWeightedScore = calculateWeightedScore(
    chipScore,
    normalizedWeights.chip,
    chipDirection
  );
  const patternWeightedScore = calculateWeightedScore(
    patternScore,
    normalizedWeights.pattern,
    patternDirection
  );
  const bbsrWeightedScore = calculateWeightedScore(
    bbsrScore,
    normalizedWeights.bbsr,
    bbsrDirection
  );

  // 计算成交量分析的得分,只要volumeAnalysisForce大于0，才有意义
  let volumeWeightedScore = 0;
  if (volumeAnalysisForce > 0) {
    volumeWeightedScore = calculateWeightedScore(
      volumeAnalysisForce,
      normalizedWeights.volume,
      volumeBasedDirection
    );
  }

  // 计算最终得分
  let finalScore =
    chipWeightedScore +
    patternWeightedScore +
    volumeWeightedScore +
    bbsrWeightedScore;

  let structureWeighted = 0;
  let sdWeighted = 0;
  let rangeWeighted = 0;
  const addScore = (raw: number, weight: number) => raw * weight;
  // 结构方向
  const structureDir = structureDaily.trend === 'up' ? 1 : structureDaily.trend === 'down' ? -1 : 0;
  structureWeighted = addScore(structureDir * 30, 0.15);
  finalScore += structureWeighted;
  // 供需：最近有效区更近者决定方向
  const priceNow = sdDaily.premiumDiscount.currentPrice;
  const dZones = sdDaily.recentEffectiveZones.filter(z => z.type === 'demand');
  const sZones = sdDaily.recentEffectiveZones.filter(z => z.type === 'supply');
  const nd = dZones.sort((a, b) => Math.abs(priceNow - mid(a.low, a.high)) - Math.abs(priceNow - mid(b.low, b.high)))[0];
  const ns = sZones.sort((a, b) => Math.abs(priceNow - mid(a.low, a.high)) - Math.abs(priceNow - mid(b.low, b.high)))[0];
  const sdDir = nd && ns ? (Math.abs(priceNow - mid(nd.low, nd.high)) <= Math.abs(priceNow - mid(ns.low, ns.high)) ? 1 : -1) : nd ? 1 : ns ? -1 : 0;
  sdWeighted = addScore(sdDir * 25, 0.12);
  finalScore += sdWeighted;
  // 区间突破方向与质量
  const brDir = rangeDaily.breakout ? (rangeDaily.breakout.direction === 'up' ? 1 : -1) : 0;
  const brQual = rangeDaily.breakout ? rangeDaily.breakout.qualityScore : 0;
  rangeWeighted = addScore(brDir * Math.min(30, brQual * 0.3), 0.1);
  finalScore += rangeWeighted;

  // 确定最终交易方向
  let direction = TradeDirection.Neutral;
  if (finalScore > SCORE_THRESHOLD_LONG) {
    direction = TradeDirection.Long;
  } else if (finalScore < SCORE_THRESHOLD_SHORT) {
    direction = TradeDirection.Short;
  }

  // 波动率调整因子 (0.7-1.3范围)
  const volatilityAdjustmentFactor =
    1 + (volatilitySignalStrength / 100 - 0.5) * 0.6;

  // 应用波动率调整后的分数
  const volatilityAdjustedScore =
    Math.abs(finalScore) * volatilityAdjustmentFactor;

  // 基于调整后的分数确定信号强度
  const signalStrength = determineSignalStrength(
    volatilityAdjustedScore,
    chipDirection,
    patternDirection
  );

  // 计算置信度分数
  const confidenceScore = Math.max(
    0,
    Math.min(
      100,
      volatilityAdjustedScore +
        // 筹码和形态方向一致时增加置信度
        (chipDirection === patternDirection &&
        chipDirection !== TradeDirection.Neutral
          ? 20
          : 0) +
        // 成交量方向与最终方向一致时增加置信度
        (volumeBasedDirection === direction ? 25 : -15) +
        // 成交量力度直接贡献
        volumeAnalysisForce * 0.3 -
        // 信号冲突时降低置信度
        (signalStrength === SignalStrength.Conflicting ? 30 : 0) +
        // 波动率信号强度贡献
        volatilitySignalStrength * 0.2
    )
  );

  // 提取主要时间周期
  const primaryTimeframe = chipAnalysis.primaryTimeframe || 'daily';

  // 确定时间周期一致性
  const timeframeConsistency = chipAnalysis.timeframeAlignment;
  const timeframeConsistencyStrength = chipAnalysis.alignmentStrength;

  // 整合关键价位
  const keyLevels: KeyLevel[] = [];

  // 添加筹码分析的支撑位和阻力位
  addKeyLevels(
    keyLevels,
    'chip',
    primaryTimeframe,
    chipAnalysis.aggregatedSupportLevels,
    'support',
    '筹码分析显示的支撑位'
  );

  addKeyLevels(
    keyLevels,
    'chip',
    primaryTimeframe,
    chipAnalysis.aggregatedResistanceLevels,
    'resistance',
    '筹码分析显示的阻力位'
  );

  // 从形态分析添加关键价位
  patternAnalysis.timeframeAnalyses.forEach(tfAnalysis => {
    if (tfAnalysis.dominantPattern) {
      const pattern = tfAnalysis.dominantPattern;
      const patternType = pattern.patternType;
      const patternDirection = pattern.direction;
      const timeframe = tfAnalysis.timeframe;

      // 添加突破水平
      keyLevels.push({
        price: pattern.component.breakoutLevel,
        type:
          patternDirection === PatternDirection.Bullish
            ? 'resistance'
            : 'support',
        strength: pattern.reliability > 70 ? 'strong' : 'moderate',
        source: 'pattern',
        timeframe: timeframe,
        description: `${patternType} 形态的${patternDirection === PatternDirection.Bullish ? '突破' : '支撑'}位`,
      });

      // 添加目标价
      if (pattern.priceTarget) {
        keyLevels.push({
          price: pattern.priceTarget,
          type:
            patternDirection === PatternDirection.Bullish
              ? 'resistance'
              : 'support',
          strength: 'moderate',
          source: 'pattern',
          timeframe: timeframe,
          description: `${patternType} 形态的目标价位`,
        });
      }

      // 添加止损位
      if (pattern.stopLoss) {
        keyLevels.push({
          price: pattern.stopLoss,
          type:
            patternDirection === PatternDirection.Bullish
              ? 'support'
              : 'resistance',
          strength: 'strong',
          source: 'pattern',
          timeframe: timeframe,
          description: `${patternType} 形态的建议止损位`,
        });
      }
    }
  });

  // 从供需分析添加关键价位（日线近端区带边界）
  sdDaily.recentEffectiveZones.forEach(z => {
    if (z.type === 'demand') {
      keyLevels.push({
        price: z.low,
        type: 'support',
        strength: 'strong',
        source: 'combined',
        timeframe: 'daily',
        description: '供需分析-需求区下沿',
      });
      keyLevels.push({
        price: z.high,
        type: 'support',
        strength: 'moderate',
        source: 'combined',
        timeframe: 'daily',
        description: '供需分析-需求区上沿',
      });
    } else {
      keyLevels.push({
        price: z.high,
        type: 'resistance',
        strength: 'strong',
        source: 'combined',
        timeframe: 'daily',
        description: '供需分析-供应区上沿',
      });
      keyLevels.push({
        price: z.low,
        type: 'resistance',
        strength: 'moderate',
        source: 'combined',
        timeframe: 'daily',
        description: '供需分析-供应区下沿',
      });
    }
  });

  // 从区间分析添加边界（作为次级支撑/阻力）
  if (rangeDaily.range) {
    keyLevels.push({
      price: rangeDaily.range.low,
      type: 'support',
      strength: 'moderate',
      source: 'combined',
      timeframe: 'daily',
      description: '区间下沿',
    });
    keyLevels.push({
      price: rangeDaily.range.high,
      type: 'resistance',
      strength: 'moderate',
      source: 'combined',
      timeframe: 'daily',
      description: '区间上沿',
    });
  }

  // 形态总体分析描述
  const patternDesc = patternAnalysis.description;

  // 合并相近的关键价位
  const mergedKeyLevels = mergeNearbyKeyLevels(keyLevels, currentPrice);

  // 生成各时间周期的展望
  const shortTermOutlook = chipAnalysis.shortTermOutlook;
  const mediumTermOutlook = chipAnalysis.mediumTermOutlook;
  const longTermOutlook = chipAnalysis.longTermOutlook;

  // 确定入场策略
  const entryStrategy = determineEntryStrategy(
    direction,
    currentPrice,
    mergedKeyLevels,
    patternAnalysis,
    confidenceScore
  );

  // 确定出场策略
  const exitStrategy = determineExitStrategy(
    direction,
    mergedKeyLevels,
    entryStrategy.idealEntryPrice,
    chipAnalysis,
    patternAnalysis,
    combinedVolumeVolatilityAnalysis.volatilityAnalysis
  );

  // 风险管理策略
  const riskManagement = determineRiskManagement(
    direction,
    entryStrategy,
    exitStrategy,
    confidenceScore,
    signalStrength,
    combinedVolumeVolatilityAnalysis.volatilityAnalysis
  );

  // 生成警告信息
  const warnings = generateWarnings(
    chipAnalysis,
    patternAnalysis,
    direction,
    signalStrength
  );

  // 生成确认信号
  const confirmationSignals = generateConfirmationSignals(
    direction,
    chipAnalysis,
    patternAnalysis
  );

  // 生成无效信号条件
  const invalidationConditions = generateInvalidationConditions(
    direction,
    chipAnalysis,
    patternAnalysis,
    mergedKeyLevels,
    exitStrategy
  );

  // 提取关键观察点
  const keyObservations = generateKeyObservations(
    chipAnalysis,
    patternAnalysis,
    mergedKeyLevels
  );

  // 生成理由描述
  const primaryRationale = generatePrimaryRationale(
    direction,
    chipAnalysis,
    patternAnalysis
  );

  const secondaryRationale = generateSecondaryRationale(
    direction,
    chipAnalysis,
    timeframeConsistency,
    timeframeConsistencyStrength
  );

  // 生成总结
  const summary = generateSummary(
    symbol,
    direction,
    signalStrength,
    confidenceScore,
    patternDesc,
    entryStrategy.idealEntryPrice,
    combinedVolumeVolatilityAnalysis.volumeAnalysis,
    combinedVolumeVolatilityAnalysis.volatilityAnalysis,
    exitStrategy.takeProfitLevels[0]?.price,
    exitStrategy.stopLossLevels[0]?.price
  );

  // 添加趋势逆转信息处理
  const trendReversalInfo = processTrendReversalInfo(
    patternAnalysis,
    keyObservations
  );

  // 构建完整的交易计划
  return {
    symbol,
    currentPrice,
    date,

    direction,
    signalStrength,
    confidenceScore,

    chipAnalysisWeight: normalizedWeights.chip,
    patternAnalysisWeight: normalizedWeights.pattern,
    volumeAnalysisWeight: normalizedWeights.volume,
    bbsrAnalysisWeight: normalizedWeights.bbsr,

    chipAnalysisContribution:
      Math.abs(chipWeightedScore) / normalizedWeights.chip,
    patternAnalysisContribution:
      Math.abs(patternWeightedScore) / normalizedWeights.pattern,
    bbsrAnalysisContribution:
      Math.abs(bbsrWeightedScore) / normalizedWeights.bbsr,
    volumeAnalysisContribution:
      Math.abs(volumeWeightedScore) / normalizedWeights.volume,
    // 结构/供需/区间突破作为附加因子参与总分，但不计入百分比构成展示，避免总和超过100

    summary,
    primaryRationale,
    secondaryRationale,
    warnings,

    primaryTimeframe,
    timeframeConsistency,
    shortTermOutlook,
    mediumTermOutlook,
    longTermOutlook,

    bbsrAnalysis,

    entryStrategy,
    exitStrategy,
    riskManagement,
    keyLevels: mergedKeyLevels,
    confirmationSignals,
    invalidationConditions,
    keyObservations,
    trendReversalInfo,
    summaries: {
      chipSummary: `筹码差值 ${Math.abs(
        chipAnalysis.combinedBuySignalStrength - chipAnalysis.combinedShortSignalStrength
      )}/100，主要周期 ${primaryTimeframe}，一致性：${timeframeConsistency}`,
      patternSummary: patternDesc,
      bbsrSummary: bbsrAnalysis.dailyBBSRResult
        ? `日线${bbsrAnalysis.dailyBBSRResult.signal.patternNames.join(',')}，强度 ${bbsrAnalysis.dailyBBSRResult.strength}/100 @ ${bbsrAnalysis.dailyBBSRResult.SRLevel.toFixed(
            2
          )}`
        : '暂无日线关键位信号',
      vvSummary: `${combinedVolumeVolatilityAnalysis.volatilityAnalysis.volatilityAnalysis.volatilityTrend}；资金流向 ${combinedVolumeVolatilityAnalysis.volumeAnalysis.volumeAnalysis.adTrend}`,
      structureSummary: `结构: ${structureDaily.trend === 'up' ? '上涨' : structureDaily.trend === 'down' ? '下跌' : '震荡'}${structureDaily.lastEvent ? `，事件: ${structureDaily.lastEvent.type}` : ''}`,
      supplyDemandSummary: sdDir > 0 ? '靠近需求区，偏多' : sdDir < 0 ? '靠近供应区，偏空' : '附近无明确供需区',
      rangeSummary: rangeDaily.range
        ? `区间 ${rangeDaily.range.low.toFixed(2)}-${rangeDaily.range.high.toFixed(2)}${rangeDaily.breakout ? `，突破${rangeDaily.breakout.direction === 'up' ? '向上' : '向下'} 质量 ${rangeDaily.breakout.qualityScore}/100` : '，未突破'}`
        : '未检测到稳定区间',
    },
  };
}

/**
 * 合并相近的关键价位
 */
function mergeNearbyKeyLevels(
  keyLevels: KeyLevel[],
  currentPrice: number
): KeyLevel[] {
  // 按价格排序
  keyLevels.sort((a, b) => a.price - b.price);
  const mergedKeyLevels: KeyLevel[] = [];

  for (let i = 0; i < keyLevels.length; i++) {
    if (
      i > 0 &&
      Math.abs(keyLevels[i].price - keyLevels[i - 1].price) / currentPrice <
        0.01
    ) {
      // 合并相近的价位(相差1%以内)
      const prevLevel = mergedKeyLevels[mergedKeyLevels.length - 1];

      // 如果同为支撑或阻力，则合并
      if (prevLevel.type === keyLevels[i].type) {
        // 提升强度
        if (
          keyLevels[i].strength === 'strong' ||
          prevLevel.strength === 'strong'
        ) {
          prevLevel.strength = 'strong';
        }

        // 更新来源
        if (prevLevel.source !== keyLevels[i].source) {
          prevLevel.source = 'combined';
          prevLevel.description += ` + ${keyLevels[i].description}`;
        }
      } else {
        mergedKeyLevels.push(keyLevels[i]);
      }
    } else {
      mergedKeyLevels.push(keyLevels[i]);
    }
  }

  return mergedKeyLevels;
}

function mid(a: number, b: number) {
  return (a + b) / 2;
}

/**
 * 处理趋势逆转信息
 */
function processTrendReversalInfo(
  patternAnalysis: EnhancedPatternAnalysis,
  keyObservations: string[]
) {
  if (
    patternAnalysis.reversalSignals &&
    patternAnalysis.reversalSignals.length > 0
  ) {
    const primaryReversalSignal = patternAnalysis.primaryReversalSignal;

    const trendReversalInfo = {
      hasReversalSignal: true,
      primaryReversalSignal,
      reversalSignalStrength: primaryReversalSignal?.reversalStrength || 0,
      smallTimeframe: primaryReversalSignal?.smallTimeframe,
      largeTimeframe: primaryReversalSignal?.largeTimeframe,
      reversalDirection: primaryReversalSignal?.direction,
      entryPrice: primaryReversalSignal?.entryPrice,
      stopLoss: primaryReversalSignal?.stopLoss,
      description: `检测到${primaryReversalSignal?.smallTimeframe}周期从逆势调整转为顺应${primaryReversalSignal?.largeTimeframe}大趋势，${primaryReversalSignal?.direction > 0 ? '做多' : '做空'}信号`,
    };

    // 如果存在强趋势逆转信号，将其添加到关键观察中
    if (primaryReversalSignal && primaryReversalSignal.reversalStrength > 70) {
      keyObservations.unshift(
        `强烈的小周期顺势逆转信号: ${primaryReversalSignal.smallTimeframe}周期趋势逆转并顺从${primaryReversalSignal.largeTimeframe}周期趋势，信号强度: ${primaryReversalSignal.reversalStrength.toFixed(1)}/100`
      );
    }

    return trendReversalInfo;
  } else {
    return {
      hasReversalSignal: false,
      description: '未检测到小周期顺势逆转信号',
    };
  }
}

/**
 * 执行综合分析并生成格式化输出
 * @param symbol 股票代码
 * @param customWeights 自定义权重设置
 *        - chip: 筹码分析权重，影响交易方向
 *        - pattern: 形态分析权重，影响交易方向
 *        - volatility: 波动率分析权重，影响信号强度和置信度（不影响交易方向）
 * @returns 综合交易计划对象
 */
async function executeIntegratedAnalysis(
  symbol: string,
  customWeights: {
    chip: number;
    pattern: number;
    volume: number;
    bbsr: number;
  } = {
    chip: 0.2,
    pattern: 0.2,
    volume: 0.5,
    bbsr: 0.1,
  } // 默认权重分配
): Promise<IntegratedTradePlan> {
  try {
    console.log(`======== 开始执行 ${symbol} 综合分析 ========`);

    // 获取不同时间周期的数据
    const today = new Date();

    const startDateWeekly = new Date(today);
    startDateWeekly.setDate(startDateWeekly.getDate() - 365); // 获取一年的数据

    const startDateDaily = new Date(today);
    startDateDaily.setDate(startDateDaily.getDate() - 90); // 获取三个月的数据

    const startDateHourly = new Date(today);
    startDateHourly.setDate(startDateHourly.getDate() - 60); // 获取一个月的数据

    console.log('正在获取各时间周期数据...');

    // 获取周线、日线和小时线数据
    const weeklyData = await getStockDataForTimeframe(
      symbol,
      startDateWeekly,
      today,
      'weekly'
    );

    const dailyData = await getStockDataForTimeframe(
      symbol,
      startDateDaily,
      today,
      'daily'
    );

    const hourlyData = await getStockDataForTimeframe(
      symbol,
      startDateHourly,
      today,
      '1hour'
    );

    console.log('正在执行筹码分布分析...');

    // 执行筹码分析
    const multiTimeframeChipDistResult = multiTimeFrameChipDistAnalysis(
      symbol,
      'daily', // 主要时间周期
      ['weekly', 'daily', '1hour'],
      { weekly: 0.3, daily: 0.5, '1hour': 0.2 }, // 时间周期权重
      weeklyData,
      dailyData,
      hourlyData
    );

    // 执行形态分析
    console.log('正在执行形态分析...');
    const patternAnalysisResult = multiTimeframePatternAnalysis(
      weeklyData,
      dailyData,
      hourlyData
    );

    // 执行支撑阻力关键位k线形态分析
    const bbsrAnalysis = multiTimeBBSRAnalysis(symbol, dailyData, hourlyData);

    // 执行波动率，成交量综合分析，小时线
    const combinedVolumeVolatilityAnalysis =
      executeEnhancedCombinedAnalysis(hourlyData);

    // 整合分析结果
    console.log('正在整合分析结果...');
    const structureDaily = analyzeStructure(dailyData, 'daily');
    const sdDaily = analyzeSupplyDemand(symbol, dailyData, 'daily');
    const rangeDaily = analyzeRange(symbol, dailyData, 'daily');

    const integratedResult = integrateAnalyses(
      combinedVolumeVolatilityAnalysis,
      multiTimeframeChipDistResult,
      patternAnalysisResult,
      bbsrAnalysis,
      structureDaily,
      sdDaily,
      rangeDaily,
      customWeights
    );

    console.log(`\n======== ${symbol} 综合分析完成 ========`);

    // 使用格式化函数输出结果
    const formattedOutput = formatTradePlanOutput(
      integratedResult,
      combinedVolumeVolatilityAnalysis.combinedAnalysisSummary,
      combinedVolumeVolatilityAnalysis.volumeAnalysisReason,
      combinedVolumeVolatilityAnalysis.volatilityAnalysisReason
    );
    console.log(formattedOutput);

    return integratedResult;
  } catch (error) {
    console.error('综合分析执行失败:', error);
    throw error;
  }
}

// 导出所有主要函数和接口
export { executeIntegratedAnalysis };

// executeIntegratedAnalysis('TSLA', DEFAULT_WEIGHTS);
