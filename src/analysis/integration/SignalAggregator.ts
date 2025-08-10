/**
 * 信号汇总与权重计算模块（简化版）
 * 负责将各个分析模块的信号进行汇总和权重计算
 */

import { TradeDirection, SignalStrength } from '../../types.js';
import { PatternDirection } from '../patterns/analyzeMultiTimeframePatterns.js';
import type {
  AnalysisInputData,
  SignalAggregationResult,
  DirectionConversionResult,
  ScoreCalculationResult,
  IntegrationContext,
} from './IntegrationTypes.js';
import type {
  IntegrationConfig,
  IntegrationWeights,
} from './IntegrationConfig.js';

export class SignalAggregator {
  constructor(private config: IntegrationConfig) {}

  /**
   * 汇总所有分析信号
   */
  aggregateSignals(
    input: AnalysisInputData,
    context: IntegrationContext
  ): SignalAggregationResult {
    const normalizedWeights = this.normalizeWeights(this.config.weights);

    // 提取各模块的方向和分数（简化处理）
    const chipResult = this.extractChipSignal(input.analyses.chip);
    const patternResult = this.extractPatternSignal(input.analyses.pattern);
    const volumeResult = this.extractVolumeSignal(input.analyses.volatility);
    const bbsrResult = this.extractBBSRSignal(input.analyses.bbsr);

    // 附加分析模块
    const structureResult = this.extractStructureSignal(
      input.analyses.structure
    );
    const supplyDemandResult = this.extractSupplyDemandSignal(
      input.analyses.supplyDemand
    );
    const rangeResult = this.extractRangeSignal(input.analyses.range);
    const trendlineResult = this.extractTrendlineSignal(
      input.analyses.trendline
    );

    // 计算加权分数
    const chipWeighted = this.calculateWeightedScore(
      chipResult,
      normalizedWeights.chip
    );
    const patternWeighted = this.calculateWeightedScore(
      patternResult,
      normalizedWeights.pattern
    );
    const volumeWeighted = this.calculateWeightedScore(
      volumeResult,
      normalizedWeights.volume
    );
    const bbsrWeighted = this.calculateWeightedScore(
      bbsrResult,
      normalizedWeights.bbsr
    );

    // 附加权重（不计入基础100%）
    const structureWeighted = this.calculateAdditionalScore(
      structureResult,
      normalizedWeights.structure || 0
    );
    const supplyDemandWeighted = this.calculateAdditionalScore(
      supplyDemandResult,
      normalizedWeights.supplyDemand || 0
    );
    const rangeWeighted = this.calculateAdditionalScore(
      rangeResult,
      normalizedWeights.range || 0
    );
    const trendlineWeighted = this.calculateAdditionalScore(
      trendlineResult,
      normalizedWeights.trendline || 0
    );

    // 计算最终分数
    const finalScore =
      chipWeighted.weightedScore +
      patternWeighted.weightedScore +
      volumeWeighted.weightedScore +
      bbsrWeighted.weightedScore +
      structureWeighted +
      supplyDemandWeighted +
      rangeWeighted +
      trendlineWeighted;

    // 确定方向
    const direction = this.determineDirection(finalScore);

    // 确定信号强度
    const signalStrength = this.determineSignalStrength(
      Math.abs(finalScore),
      chipResult.direction,
      patternResult.direction
    );

    // 计算置信度
    const confidenceScore = this.calculateConfidenceScore(
      finalScore,
      signalStrength,
      input.analyses.volatility
    );

    return {
      finalScore,
      direction,
      signalStrength,
      confidenceScore,
      contributions: {
        chip: chipWeighted.contribution,
        pattern: patternWeighted.contribution,
        volume: volumeWeighted.contribution,
        bbsr: bbsrWeighted.contribution,
        structure: structureWeighted / (normalizedWeights.structure || 1),
        supplyDemand:
          supplyDemandWeighted / (normalizedWeights.supplyDemand || 1),
        range: rangeWeighted / (normalizedWeights.range || 1),
        trendline: trendlineWeighted / (normalizedWeights.trendline || 1),
      },
      weightedScores: {
        chip: chipWeighted.weightedScore,
        pattern: patternWeighted.weightedScore,
        volume: volumeWeighted.weightedScore,
        bbsr: bbsrWeighted.weightedScore,
        structure: structureWeighted,
        supplyDemand: supplyDemandWeighted,
        range: rangeWeighted,
        trendline: trendlineWeighted,
      },
    };
  }

  /**
   * 权重归一化
   */
  private normalizeWeights(weights: IntegrationWeights): IntegrationWeights {
    const totalWeight =
      weights.chip + weights.pattern + weights.volume + weights.bbsr;

    return {
      chip: weights.chip / totalWeight,
      pattern: weights.pattern / totalWeight,
      volume: weights.volume / totalWeight,
      bbsr: weights.bbsr / totalWeight,
      // 附加权重保持不变
      structure: weights.structure,
      supplyDemand: weights.supplyDemand,
      range: weights.range,
      trendline: weights.trendline,
    };
  }

  /**
   * 提取筹码分析信号
   */
  private extractChipSignal(
    chipAnalysis: AnalysisInputData['analyses']['chip']
  ): DirectionConversionResult {
    let direction: TradeDirection = TradeDirection.Neutral;
    let confidence = 0;

    const buyStrength = chipAnalysis.combinedBuySignalStrength;
    const shortStrength = chipAnalysis.combinedShortSignalStrength;
    const threshold = this.config.thresholds.chipDirectionThreshold;

    if (buyStrength > shortStrength + threshold) {
      direction = TradeDirection.Long;
      confidence = Math.min(100, buyStrength);
    } else if (shortStrength > buyStrength + threshold) {
      direction = TradeDirection.Short;
      confidence = Math.min(100, shortStrength);
    } else {
      confidence = Math.max(buyStrength, shortStrength) * 0.5; // 中性时置信度降低
    }

    return { direction, confidence, source: 'chip' };
  }

  /**
   * 提取形态分析信号
   */
  private extractPatternSignal(
    patternAnalysis: AnalysisInputData['analyses']['pattern']
  ): DirectionConversionResult {
    const direction = this.convertPatternDirection(
      patternAnalysis.combinedSignal
    );
    const confidence = Math.abs(patternAnalysis.signalStrength || 0);

    return { direction, confidence, source: 'pattern' };
  }

  /**
   * 提取波动率/成交量信号
   */
  private extractVolumeSignal(
    volatilityAnalysis: AnalysisInputData['analyses']['volatility']
  ): DirectionConversionResult {
    // 波动率分析主要影响置信度，不直接提供方向信号
    const confidence = 50; // 默认置信度，因为波动率分析主要影响置信度调整

    return {
      direction: TradeDirection.Neutral,
      confidence,
      source: 'volume',
    };
  }

  /**
   * 提取BBSR信号
   */
  private extractBBSRSignal(
    bbsrAnalysis: AnalysisInputData['analyses']['bbsr']
  ): DirectionConversionResult {
    // 根据BBSR分析结果提取方向信号
    let direction = TradeDirection.Neutral;
    let confidence = 0;

    // 检查日线和周线BBSR结果
    const signals = [
      bbsrAnalysis.dailyBBSRResult,
      bbsrAnalysis.weeklyBBSRResult,
    ].filter(Boolean);

    for (const signal of signals) {
      if (signal && signal.strength > confidence) {
        // 简化处理：基于强度判断方向
        direction =
          signal.strength > 50 ? TradeDirection.Long : TradeDirection.Short;
        confidence = signal.strength;
      }
    }

    return { direction, confidence, source: 'bbsr' };
  }

  /**
   * 提取结构分析信号
   */
  private extractStructureSignal(
    structureAnalysis: AnalysisInputData['analyses']['structure']
  ): DirectionConversionResult {
    let direction = TradeDirection.Neutral;
    let confidence = 50;

    // 根据趋势方向确定信号
    if (structureAnalysis.trend === 'up') {
      direction = TradeDirection.Long;
      confidence = 70;
    } else if (structureAnalysis.trend === 'down') {
      direction = TradeDirection.Short;
      confidence = 70;
    }

    // 如果有最近的结构事件，调整置信度
    if (structureAnalysis.lastEvent) {
      if (structureAnalysis.lastEvent.direction === 'bullish') {
        direction = TradeDirection.Long;
        confidence = Math.max(confidence, 75);
      } else if (structureAnalysis.lastEvent.direction === 'bearish') {
        direction = TradeDirection.Short;
        confidence = Math.max(confidence, 75);
      }
    }

    return { direction, confidence, source: 'structure' };
  }

  /**
   * 提取供需分析信号
   */
  private extractSupplyDemandSignal(
    sdAnalysis: AnalysisInputData['analyses']['supplyDemand']
  ): DirectionConversionResult {
    let direction = TradeDirection.Neutral;
    let confidence = 50;

    // 基于溢价/折价位置判断
    const position = sdAnalysis.premiumDiscount?.position || 50;

    if (position < 30) {
      // 在折价区域，偏向做多
      direction = TradeDirection.Long;
      confidence = 60 + (30 - position); // 越靠近底部置信度越高
    } else if (position > 70) {
      // 在溢价区域，偏向做空
      direction = TradeDirection.Short;
      confidence = 60 + (position - 70); // 越靠近顶部置信度越高
    }

    // 考虑有效供需区域
    const freshZones =
      sdAnalysis.recentEffectiveZones?.filter(
        zone => zone.status === 'fresh'
      ) || [];
    if (freshZones.length > 0) {
      const demandZones = freshZones.filter(zone => zone.type === 'demand');
      const supplyZones = freshZones.filter(zone => zone.type === 'supply');

      if (demandZones.length > supplyZones.length) {
        direction = TradeDirection.Long;
        confidence = Math.max(confidence, 65);
      } else if (supplyZones.length > demandZones.length) {
        direction = TradeDirection.Short;
        confidence = Math.max(confidence, 65);
      }
    }

    return { direction, confidence, source: 'supplyDemand' };
  }

  /**
   * 提取区间突破分析信号
   */
  private extractRangeSignal(
    rangeAnalysis: AnalysisInputData['analyses']['range']
  ): DirectionConversionResult {
    let direction = TradeDirection.Neutral;
    let confidence = 50;

    // 如果有突破信号
    if (rangeAnalysis.breakout) {
      if (rangeAnalysis.breakout.direction === 'up') {
        direction = TradeDirection.Long;
        confidence = rangeAnalysis.breakout.qualityScore || 60;
      } else if (rangeAnalysis.breakout.direction === 'down') {
        direction = TradeDirection.Short;
        confidence = rangeAnalysis.breakout.qualityScore || 60;
      }

      // 如果有回踩确认，提高置信度
      if (
        rangeAnalysis.breakout.retested &&
        rangeAnalysis.breakout.followThrough
      ) {
        confidence = Math.min(100, confidence + 15);
      }
    } else if (rangeAnalysis.compressionScore > 70) {
      // 高压缩状态，等待突破，保持中性但提高潜在信号强度
      confidence = 40; // 略降低置信度，表示等待状态
    }

    return { direction, confidence, source: 'range' };
  }

  /**
   * 提取趋势线分析信号
   */
  private extractTrendlineSignal(
    trendlineAnalysis: AnalysisInputData['analyses']['trendline']
  ): DirectionConversionResult {
    let direction = TradeDirection.Neutral;
    let confidence = 50;

    // 基于通道斜率判断大趋势
    if (trendlineAnalysis.channel) {
      if (trendlineAnalysis.channel.slope > 0) {
        direction = TradeDirection.Long;
        confidence = 60;
      } else if (trendlineAnalysis.channel.slope < 0) {
        direction = TradeDirection.Short;
        confidence = 60;
      }
    }

    // 如果有突破回踩信号
    if (trendlineAnalysis.breakoutRetest) {
      if (trendlineAnalysis.breakoutRetest.direction === 'up') {
        direction = TradeDirection.Long;
        confidence = trendlineAnalysis.breakoutRetest.qualityScore || 65;
      } else if (trendlineAnalysis.breakoutRetest.direction === 'down') {
        direction = TradeDirection.Short;
        confidence = trendlineAnalysis.breakoutRetest.qualityScore || 65;
      }

      // 如果已经回踩确认，大幅提高置信度
      if (trendlineAnalysis.breakoutRetest.retested) {
        confidence = Math.min(100, confidence + 20);
      }
    }

    return { direction, confidence, source: 'trendline' };
  }

  /**
   * 计算加权分数
   */
  private calculateWeightedScore(
    signal: DirectionConversionResult,
    weight: number
  ): ScoreCalculationResult {
    const directionMultiplier =
      signal.direction === TradeDirection.Long
        ? 1
        : signal.direction === TradeDirection.Short
          ? -1
          : 0;

    const rawScore = signal.confidence;
    const weightedScore = rawScore * weight * directionMultiplier;
    const contribution = Math.abs(weightedScore) / weight;

    return {
      rawScore,
      weightedScore,
      direction: signal.direction,
      contribution,
      source: signal.source,
    };
  }

  /**
   * 计算附加分数（不计入主要权重）
   */
  private calculateAdditionalScore(
    signal: DirectionConversionResult,
    weight: number
  ): number {
    const directionMultiplier =
      signal.direction === TradeDirection.Long
        ? 1
        : signal.direction === TradeDirection.Short
          ? -1
          : 0;

    return signal.confidence * weight * directionMultiplier;
  }

  /**
   * 转换形态方向
   */
  private convertPatternDirection(
    patternDirection: PatternDirection
  ): TradeDirection {
    switch (patternDirection) {
      case PatternDirection.Bullish:
        return TradeDirection.Long;
      case PatternDirection.Bearish:
        return TradeDirection.Short;
      default:
        return TradeDirection.Neutral;
    }
  }

  /**
   * 确定最终方向
   */
  private determineDirection(finalScore: number): TradeDirection {
    if (finalScore > this.config.thresholds.scoreLong) {
      return TradeDirection.Long;
    } else if (finalScore < this.config.thresholds.scoreShort) {
      return TradeDirection.Short;
    }
    return TradeDirection.Neutral;
  }

  /**
   * 确定信号强度
   */
  private determineSignalStrength(
    absScore: number,
    chipDirection: TradeDirection,
    patternDirection: TradeDirection
  ): SignalStrength {
    // 考虑筹码和形态方向的一致性
    const directionsAlign =
      chipDirection === patternDirection &&
      chipDirection !== TradeDirection.Neutral;

    let threshold = this.config.thresholds.volatilityAdjustedScoreStrong;
    if (directionsAlign) {
      threshold *= 0.8; // 方向一致时降低强信号阈值
    }

    if (absScore > threshold) {
      return SignalStrength.Strong;
    } else if (
      absScore > this.config.thresholds.volatilityAdjustedScoreModerate
    ) {
      return SignalStrength.Moderate;
    } else if (absScore > this.config.thresholds.volatilityAdjustedScoreWeak) {
      return SignalStrength.Weak;
    }

    return SignalStrength.Neutral;
  }

  /**
   * 计算置信度
   */
  private calculateConfidenceScore(
    finalScore: number,
    signalStrength: SignalStrength,
    volatilityAnalysis: AnalysisInputData['analyses']['volatility']
  ): number {
    let baseConfidence = Math.min(100, Math.abs(finalScore));

    // 根据信号强度调整
    switch (signalStrength) {
      case SignalStrength.Strong:
        baseConfidence = Math.min(100, baseConfidence * 1.2);
        break;
      case SignalStrength.Moderate:
        baseConfidence = baseConfidence;
        break;
      case SignalStrength.Weak:
        baseConfidence = baseConfidence * 0.8;
        break;
      default:
        baseConfidence = baseConfidence * 0.5;
    }

    // 根据波动率调整置信度（恢复原有逻辑）
    const volatilityScore =
      this.calculateVolatilitySignalStrength(volatilityAnalysis);
    const volatilityMultiplier = 0.5 + (volatilityScore / 100) * 0.5; // 0.5 - 1.0

    return Math.min(100, Math.max(0, baseConfidence * volatilityMultiplier));
  }

  /**
   * 计算波动率信号强度（恢复原有逻辑）
   */
  private calculateVolatilitySignalStrength(
    volatilityAnalysis: AnalysisInputData['analyses']['volatility']
  ): number {
    // 提取波动率分析数据（修正结构）
    const volAnalysis =
      volatilityAnalysis.volatilityAnalysis.volatilityAnalysis;
    const volPriceConfirmation =
      volatilityAnalysis.volumeAnalysis.volumeAnalysis;

    // 计算波动率强度（基于ATR百分比和布林带宽度）- 修正原有计算
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
        directionScore += volPriceConfirmation.volumePriceConfirmation
          ? 40
          : -40;
      } else {
        // 高波动率下降 - 波动率下降时，通常是反转信号
        directionScore += volPriceConfirmation.volumePriceConfirmation
          ? -30
          : 30;
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

    // 返回波动率信号强度（绝对值）
    return Math.abs(directionScore);
  }
}
