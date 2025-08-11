/**
 * 信号汇总与权重计算模块（简化版）
 * 负责将各个分析模块的信号进行汇总和权重计算
 */

import { TradeDirection, SignalStrength } from '../../types.js';
import { PatternDirection } from '../basic/patterns/analyzeMultiTimeframePatterns.js';
import type {
  AnalysisInputData,
  SignalAggregationResult,
  DirectionConversionResult,
  ScoreCalculationResult,
  IntegrationContext,
  AnalyzerPlugin,
} from './IntegrationTypes.js';
import type {
  IntegrationConfig,
  IntegrationWeights,
} from './IntegrationConfig.js';

export class SignalAggregator {
  // 可选插件列表：用于扩展更多分析器
  private plugins: AnalyzerPlugin[] = [];

  constructor(private config: IntegrationConfig) {}

  /** 注册插件（遵循开闭原则，无需改核心逻辑即可扩展） */
  registerPlugin(plugin: AnalyzerPlugin): void {
    this.plugins.push(plugin);
  }

  /** 获取已注册插件（用于外部如 orchestrator 获取 summarize 能力） */
  getPlugins(): ReadonlyArray<AnalyzerPlugin> {
    return this.plugins;
  }

  /** 将数值限制在区间内，默认 [0,100] */
  private clamp(value: number, min: number = 0, max: number = 100): number {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * 汇总所有分析信号
   */
  aggregateSignals(
    input: AnalysisInputData,
    context: IntegrationContext
  ): SignalAggregationResult {
    const normalizedWeights = this.normalizeWeights(this.config.weights);

    // 提取各模块的方向和分数
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

    // 插件信号处理
    const extraWeightedScores: Record<string, number> = {};
    const extraContributions: Record<string, number> = {};
    let pluginsTotalWeighted = 0;
    for (const plugin of this.plugins) {
      try {
        const res = plugin.extract(input, context);
        const weight = plugin.category === 'main'
          ? (this.config.weights.plugins?.[plugin.id] ?? 0)
          : (this.config.weights.plugins?.[plugin.id] ?? 0); // 统一按单独权重乘
        const ws = this.calculateAdditionalScore(res, weight);
        pluginsTotalWeighted += ws;
        extraWeightedScores[plugin.id] = ws;
        extraContributions[plugin.id] = Math.abs(weight === 0 ? 0 : ws / weight);
      } catch {
        // 忽略单插件错误，避免影响主流程
      }
    }

    // 计算最终分数（主模块 + 附加模块 + 插件）
    const finalScore = this.config.options.usePluginsOnly
      ? pluginsTotalWeighted
      : (
          chipWeighted.weightedScore +
          patternWeighted.weightedScore +
          volumeWeighted.weightedScore +
          bbsrWeighted.weightedScore +
          structureWeighted +
          supplyDemandWeighted +
          rangeWeighted +
          trendlineWeighted +
          pluginsTotalWeighted
        );

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
      extraContributions,
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
      extraWeightedScores,
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

    // 基于多周期主导形态状态微调
    const timeframeWeights: Record<'weekly' | 'daily' | '1hour', number> = {
      weekly: 0.4,
      daily: 0.4,
      '1hour': 0.2,
    };

    let statusAdjustment = 0;
    const timeframeAnalyses = (patternAnalysis as any).timeframeAnalyses as
      | { timeframe: 'weekly' | 'daily' | '1hour'; dominantPattern?: { status?: string } }[]
      | undefined;

    if (Array.isArray(timeframeAnalyses)) {
      for (const tf of timeframeAnalyses) {
        const weight = timeframeWeights[tf.timeframe] ?? 0.2;
        const status = tf.dominantPattern?.status;
        if (status === 'confirmed') statusAdjustment += 20 * weight;
        else if (status === 'completed') statusAdjustment += 10 * weight;
        else if (status === 'forming') statusAdjustment += -10 * weight;
        else if (status === 'failed') statusAdjustment += -20 * weight;
      }
    }

    let confidence = (Math.abs((patternAnalysis as any).signalStrength ?? 0) + statusAdjustment);
    confidence = this.clamp(confidence);
    
    return { direction, confidence, source: 'pattern' };
  }

  /**
   * 提取波动率/成交量信号
   */
  private extractVolumeSignal(
    volatilityAnalysis: AnalysisInputData['analyses']['volatility']
  ): DirectionConversionResult {
    // 从分析数据中获取成交量分析结果
    const v = volatilityAnalysis.volumeAnalysis.volumeAnalysis as any;

    let direction: TradeDirection = TradeDirection.Neutral;

    // 基础方向来自 AD 趋势
    if (v.adTrend === 'bullish') direction = TradeDirection.Long;
    else if (v.adTrend === 'bearish') direction = TradeDirection.Short;

    // 背离微调方向
    if (v.divergence?.type === 'bullish' || v.divergence?.type === 'hidden_bullish') {
      direction = TradeDirection.Long;
    } else if (v.divergence?.type === 'bearish' || v.divergence?.type === 'hidden_bearish') {
      direction = TradeDirection.Short;
    }

    // 置信度构成：量价确认 + 力度 + OBV 斜率 + 背离强度 + MFI 极值
    let confidence = 50;
    confidence += v.volumePriceConfirmation ? 15 : -10;
    confidence += Math.min(25, Math.max(0, Math.abs(v.volumeForce ?? 0) * 0.5));
    confidence += Math.min(15, Math.abs(v.obvSlope ?? 0) * 50);
    confidence += Math.min(10, Math.max(0, v.divergence?.strength ?? 0) * 0.2);
    if (typeof v.moneyFlowIndex === 'number') {
      if (v.moneyFlowIndex > 80) confidence -= 5;
      else if (v.moneyFlowIndex < 20) confidence += 5;
    }
    confidence = this.clamp(confidence);

    return { direction, confidence, source: 'volume' };
  }

  /**
   * 提取BBSR信号
   */
  private extractBBSRSignal(
    bbsrAnalysis: AnalysisInputData['analyses']['bbsr']
  ): DirectionConversionResult {
    const daily = (bbsrAnalysis as any).dailyBBSRResult;
    const weekly = (bbsrAnalysis as any).weeklyBBSRResult;
    const signals = [daily, weekly].filter(Boolean) as any[];
    if (signals.length === 0) {
      return { direction: TradeDirection.Neutral, confidence: 0, source: 'bbsr' };
    }

    let bestDirection: TradeDirection = TradeDirection.Neutral;
    let bestScore = 0;
    const now = Date.now();

    for (const s of signals) {
      const pt = s.signal?.patternType;
      const dir = pt === 'bullish' ? TradeDirection.Long : pt === 'bearish' ? TradeDirection.Short : TradeDirection.Neutral;

      const proximityPct = Math.abs(s.currentPrice - s.SRLevel) / Math.max(1e-8, s.SRLevel) * 100;
      const proximityScore = Math.max(0, 30 - proximityPct); // 靠近关键位更高
      const days = Math.max(0, (now - new Date(s.signalDate).getTime()) / 86400000);
      const recencyScore = Math.max(0, 20 - days * 2);

      const score = this.clamp(0.6 * (s.strength ?? 0) + proximityScore + recencyScore);
      if (score > bestScore) {
        bestScore = score;
        bestDirection = dir;
      }
    }

    const d = daily?.signal?.patternType;
    const w = weekly?.signal?.patternType;
    if (d && w && d !== w) bestScore = Math.max(0, bestScore - 10);

    return { direction: bestDirection, confidence: bestScore, source: 'bbsr' };
  }

  /**
   * 提取结构分析信号
   */
  private extractStructureSignal(
    structureAnalysis: AnalysisInputData['analyses']['structure']
  ): DirectionConversionResult {
    let direction = TradeDirection.Neutral;
    let confidence = 50;

    if (structureAnalysis.trend === 'up') { direction = TradeDirection.Long; confidence = 65; }
    else if (structureAnalysis.trend === 'down') { direction = TradeDirection.Short; confidence = 65; }

    const evt = (structureAnalysis as any).lastEvent as { type?: string; direction?: 'bullish'|'bearish'|'neutral'; timeframe?: string } | undefined;
    if (evt) {
      if (evt.type === 'CHOCH') {
        confidence += 25;
        if (evt.direction === 'bullish') direction = TradeDirection.Long;
        else if (evt.direction === 'bearish') direction = TradeDirection.Short;
      } else if (evt.type === 'BOS') {
        confidence += 15;
        if (evt.direction === 'bullish') direction = TradeDirection.Long;
        else if (evt.direction === 'bearish') direction = TradeDirection.Short;
      } else {
        confidence -= 10;
      }
      if (evt.timeframe === 'daily') confidence += 5;
    }

    confidence = this.clamp(confidence);
    return { direction, confidence, source: 'structure' };
  }

  /**
   * 提取供需分析信号
   */
  private extractSupplyDemandSignal(
    sdAnalysis: AnalysisInputData['analyses']['supplyDemand']
  ): DirectionConversionResult {
    const current = sdAnalysis.premiumDiscount?.currentPrice ?? NaN;
    const zones = sdAnalysis.recentEffectiveZones ?? [];

    let direction = TradeDirection.Neutral;
    let confidence = 50;

    const inZone = zones.find(z => current >= z.low && current <= z.high);
    if (inZone) {
      direction = inZone.type === 'demand' ? TradeDirection.Long : TradeDirection.Short;
      confidence = inZone.status === 'fresh' ? 75 : 65;
      const mid = (inZone.low + inZone.high) / 2;
      const proxPct = Math.abs(current - mid) / Math.max(1e-8, mid) * 100;
      confidence += Math.max(0, 10 - proxPct);
    } else {
      const position = sdAnalysis.premiumDiscount?.position ?? 50;
      if (position < 30) { direction = TradeDirection.Long; confidence = 60 + (30 - position); }
      else if (position > 70) { direction = TradeDirection.Short; confidence = 60 + (position - 70); }
    }

    confidence = this.clamp(confidence);
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

    if ((rangeAnalysis as any).breakout) {
      const br = (rangeAnalysis as any).breakout as any;
      direction = br.direction === 'up' ? TradeDirection.Long : TradeDirection.Short;
      confidence = br.qualityScore ?? 60;
      if (br.volumeExpansion) confidence += 10;
      if (br.followThrough) confidence += 10;
      if (br.retested) confidence += 10;
    } else if ((rangeAnalysis as any).compressionScore > 70) {
      confidence = 35;
    }

    confidence = this.clamp(confidence);
    return { direction, confidence, source: 'range' };
  }

  /**
   * 提取趋势线分析信号
   */
  private extractTrendlineSignal(
    trendlineAnalysis: AnalysisInputData['analyses']['trendline']
  ): DirectionConversionResult {
    const tl = trendlineAnalysis as any;
    let direction = TradeDirection.Neutral;
    let confidence = 50;

    if (tl.channel) {
      if (tl.channel.slope > 0) direction = TradeDirection.Long;
      else if (tl.channel.slope < 0) direction = TradeDirection.Short;

      confidence = 55 + Math.min(15, Math.abs(tl.channel.slope) * 1e4 * 0.5);
      const touches = (tl.channel.touchesUpper ?? 0) + (tl.channel.touchesLower ?? 0);
      confidence += Math.min(10, touches * 1.5);
    }

    if (tl.breakoutRetest) {
      direction = tl.breakoutRetest.direction === 'up' ? TradeDirection.Long : TradeDirection.Short;
      confidence = Math.max(confidence, tl.breakoutRetest.qualityScore ?? 65);
      if (tl.breakoutRetest.retested) confidence += 20;
    }

    confidence = this.clamp(confidence);
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
