/**
 * 策略生成器模块（简化版）
 * 负责根据信号汇总结果和关键位生成具体的交易策略
 */

import type {
  StrategyGenerationInput,
  StrategyGenerationResult,
  AnalysisInputData,
} from './IntegrationTypes.js';
import type { IntegrationConfig } from './IntegrationConfig.js';
import {
  TradeDirection,
  RiskLevel,
  SignalStrength,
  type IntegratedTradePlan,
  type KeyLevel,
} from '../../types.js';
import {
  determineEntryStrategy,
  determineExitStrategy,
  determineRiskManagement,
} from '../../util/analysisUtils.js';

export class StrategyGenerator {
  constructor(private config: IntegrationConfig) {}

  /**
   * 生成完整的交易策略（恢复原有完整功能）
   */
  generateStrategy(input: StrategyGenerationInput): StrategyGenerationResult {
    // 使用原有的完整策略生成函数
    const entryStrategy = determineEntryStrategy(
      input.signalResult.direction,
      input.currentPrice,
      input.keyLevels,
      input.analyses.pattern,
      input.signalResult.confidenceScore
    );

    const exitStrategy = determineExitStrategy(
      input.signalResult.direction,
      input.keyLevels,
      entryStrategy.idealEntryPrice,
      input.analyses.chip,
      input.analyses.pattern,
      (input.analyses as any)?.volatility?.volatilityAnalysis
    );

    const riskManagement = determineRiskManagement(
      input.signalResult.direction,
      entryStrategy,
      exitStrategy,
      input.signalResult.confidenceScore,
      input.signalResult.signalStrength,
      (input.analyses as any)?.volatility?.volatilityAnalysis
    );

    // 生成增强的信号和条件
    const confirmationSignals = this.generateEnhancedConfirmationSignals(input);
    const invalidationConditions =
      this.generateEnhancedInvalidationConditions(input);
    const keyObservations = this.generateEnhancedKeyObservations(input);
    const warnings = this.generateEnhancedWarnings(input);

    return {
      entryStrategy,
      exitStrategy,
      riskManagement,
      confirmationSignals,
      invalidationConditions,
      keyObservations,
      warnings,
    };
  }

  /**
   * 生成增强的确认信号
   */
  private generateEnhancedConfirmationSignals(
    input: StrategyGenerationInput
  ): IntegratedTradePlan['confirmationSignals'] {
    const { signalResult, analyses } = input;
    const confirmationSignals = [];

    // 基础方向确认
    confirmationSignals.push({
      type: 'pattern',
      description: `${signalResult.direction === TradeDirection.Long ? '多头' : '空头'}信号确认`,
      priority: 'important',
    });

    // 筹码分析确认
    if (signalResult.direction === TradeDirection.Long) {
      if (analyses.chip.combinedBuySignalStrength > 60) {
        confirmationSignals.push({
          type: 'chip',
          description: `筹码买入强度${analyses.chip.combinedBuySignalStrength}，支持做多`,
          priority: 'important',
        });
      }
    } else if (signalResult.direction === TradeDirection.Short) {
      if (analyses.chip.combinedShortSignalStrength > 60) {
        confirmationSignals.push({
          type: 'chip',
          description: `筹码做空强度${analyses.chip.combinedShortSignalStrength}，支持做空`,
          priority: 'important',
        });
      }
    }

    // 波动率确认
    const volatilityRegime =
      (analyses as any)?.volatility?.volatilityAnalysis?.volatilityAnalysis
        ?.volatilityRegime ?? 'unknown';
    if (volatilityRegime === 'high' || volatilityRegime === 'extreme') {
      confirmationSignals.push({
        type: 'volatility',
        description: `当前处于${volatilityRegime === 'extreme' ? '极高' : '高'}波动率环境，需要谨慎操作`,
        priority: 'critical',
      });
    }

    return confirmationSignals;
  }

  /**
   * 生成增强的失效条件
   */
  private generateEnhancedInvalidationConditions(
    input: StrategyGenerationInput
  ): IntegratedTradePlan['invalidationConditions'] {
    const { signalResult, currentPrice, keyLevels } = input;
    const invalidationConditions = [];

    // 基于关键位的失效条件
    if (signalResult.direction === TradeDirection.Long) {
      // 找到关键支撑位作为失效条件
      const keySupport = keyLevels
        .filter(level => level.type === 'support' && level.price < currentPrice)
        .sort((a, b) => b.price - a.price)[0];

      if (keySupport) {
        invalidationConditions.push({
          type: 'price',
          description: `价格跌破关键支撑位 ${keySupport.price.toFixed(2)}`,
          priority: 'critical',
        });
      } else {
        // 如果没有关键支撑位，使用百分比止损
        const invalidationPrice = currentPrice * 0.95;
        invalidationConditions.push({
          type: 'price',
          description: `价格跌破 ${invalidationPrice.toFixed(2)} (5%止损)`,
          priority: 'critical',
        });
      }
    } else if (signalResult.direction === TradeDirection.Short) {
      // 找到关键阻力位作为失效条件
      const keyResistance = keyLevels
        .filter(
          level => level.type === 'resistance' && level.price > currentPrice
        )
        .sort((a, b) => a.price - b.price)[0];

      if (keyResistance) {
        invalidationConditions.push({
          type: 'price',
          description: `价格突破关键阻力位 ${keyResistance.price.toFixed(2)}`,
          priority: 'critical',
        });
      } else {
        // 如果没有关键阻力位，使用百分比止损
        const invalidationPrice = currentPrice * 1.05;
        invalidationConditions.push({
          type: 'price',
          description: `价格突破 ${invalidationPrice.toFixed(2)} (5%止损)`,
          priority: 'critical',
        });
      }
    }

    // 置信度失效条件
    if (signalResult.confidenceScore < 50) {
      invalidationConditions.push({
        type: 'indicator',
        description: '信号置信度过低，如果没有其他技术指标确认，应考虑退出',
        priority: 'important',
      });
    }

    return invalidationConditions;
  }

  /**
   * 生成增强的关键观察点
   */
  private generateEnhancedKeyObservations(
    input: StrategyGenerationInput
  ): string[] {
    const { signalResult, analyses, keyLevels } = input;
    const observations = [];

    // 信号基础信息
    observations.push(
      `当前${signalResult.direction === TradeDirection.Long ? '做多' : '做空'}信号，` +
        `置信度: ${signalResult.confidenceScore.toFixed(1)}%，` +
        `信号强度: ${signalResult.signalStrength}`
    );

    // 筹码分析详情
    observations.push(
      `筹码分析 - 买入强度: ${analyses.chip.combinedBuySignalStrength}, ` +
        `做空强度: ${analyses.chip.combinedShortSignalStrength}`
    );

    // 形态分析
    if (analyses.pattern.signalStrength) {
      observations.push(
        `形态分析 - 方向: ${analyses.pattern.combinedSignal}, ` +
          `评分: ${analyses.pattern.signalStrength.toFixed(1)}`
      );
    }

    // 波动率状态
    const volatilityRegime =
      (analyses as any)?.volatility?.volatilityAnalysis?.volatilityAnalysis
        ?.volatilityRegime ?? 'unknown';
    const atrPercent =
      (analyses as any)?.volatility?.volatilityAnalysis?.volatilityAnalysis
        ?.atrPercent ?? 0;
    observations.push(
      `波动率状态: ${volatilityRegime}, ATR百分比: ${atrPercent.toFixed(2)}%`
    );

    // 关键位信息
    const supportLevels = keyLevels.filter(
      level => level.type === 'support'
    ).length;
    const resistanceLevels = keyLevels.filter(
      level => level.type === 'resistance'
    ).length;
    observations.push(
      `关键位统计 - 支撑位: ${supportLevels}个, 阻力位: ${resistanceLevels}个`
    );

    // BBSR分析
    if (analyses.bbsr.dailyBBSRResult) {
      observations.push(
        `BBSR日线强度: ${analyses.bbsr.dailyBBSRResult.strength.toFixed(1)}`
      );
    }

    return observations;
  }

  /**
   * 生成增强的警告信息
   */
  private generateEnhancedWarnings(input: StrategyGenerationInput): string[] {
    const { signalResult, analyses } = input;
    const warnings = [];

    // 置信度警告
    if (signalResult.confidenceScore < 60) {
      warnings.push(
        `信号置信度较低(${signalResult.confidenceScore.toFixed(1)}%)，建议谨慎操作或等待更强信号`
      );
    }

    // 信号强度警告
    if (signalResult.signalStrength === SignalStrength.Weak) {
      warnings.push('当前信号强度较弱，建议降低仓位或等待信号增强');
    }

    // 波动率警告
    const volatilityRegime =
      (analyses as any)?.volatility?.volatilityAnalysis?.volatilityAnalysis
        ?.volatilityRegime;
    if (volatilityRegime === 'extreme') {
      warnings.push('市场处于极高波动率状态，风险极大，建议大幅降低仓位');
    } else if (volatilityRegime === 'high') {
      warnings.push('市场波动率较高，需要密切关注止损位');
    } else if (volatilityRegime === 'low') {
      warnings.push('市场波动率较低，可能面临突然的波动率扩张');
    }

    // 筹码分析矛盾警告
    const chipBuyStrength = analyses.chip.combinedBuySignalStrength;
    const chipShortStrength = analyses.chip.combinedShortSignalStrength;
    const strengthDiff = Math.abs(chipBuyStrength - chipShortStrength);

    if (strengthDiff < 20) {
      warnings.push('筹码分析显示买卖力量接近，市场方向不明确');
    }

    // 信号冲突警告
    if (signalResult.signalStrength === SignalStrength.Conflicting) {
      warnings.push('多个分析模块信号冲突，建议等待信号一致性提高后再操作');
    }

    // 成交量确认警告
    const volumeConfirmation = (analyses as any)?.volatility?.volumeAnalysis
      ?.volumeAnalysis?.volumePriceConfirmation;
    if (!volumeConfirmation) {
      warnings.push('成交量未能确认价格走势，信号可靠性降低');
    }

    return warnings;
  }
}
