/**
 * 集成分析编排器
 * 负责协调各个分析模块的执行和结果整合
 */

import type { IntegratedTradePlan } from '../../types.js';
import type { Candle } from '../../types.js';
import { generateUniqueId } from '../../util/util.js';
import { createLogger } from '../../util/logger.js';

// 分析模块导入
import { multiTimeFrameChipDistAnalysis } from '../analyzer/chip/multiTimeFrameChipDistributionAnalysis.js';
import { analyzeMultiTimeframePattern } from '../analyzer/trendReversal/multiTimeFrameTrendReversal.js';
import { analyzeMultiTimeBBSR } from '../analyzer/sr/multiTimeFrameBBSRAnalysis.js';
import { analyzeVolumeVolatilityCombined } from '../analyzer/volatility/volatilityAnalysis.js';
import { analyzeMarketStructure } from '../analyzer/structure/structureDetector.js';
import { analyzeSupplyDemandZone } from '../analyzer/supplyDemand/sdDetector.js';
import { analyzeRange } from '../analyzer/range/rangeDetector.js';
import { analyzeTrendlinesAndChannels } from '../analyzer/trendline/trendlineDetector.js';

// 集成模块导入
import { SignalAggregator } from './SignalAggregator.js';
import { KeyLevelManager } from './KeyLevelManager.js';
import { StrategyGenerator } from './StrategyGenerator.js';
import { createChipPlugin } from './plugins/chipPlugin.js';
import { createPatternPlugin } from './plugins/patternPlugin.js';
import { createVolumePlugin } from './plugins/volumePlugin.js';
import { createBbsrPlugin } from './plugins/bbsrPlugin.js';
import { createStructurePlugin } from './plugins/structurePlugin.js';
import { createSupplyDemandPlugin } from './plugins/supplyDemandPlugin.js';
import { createRangePlugin } from './plugins/rangePlugin.js';
import { createTrendlinePlugin } from './plugins/trendlinePlugin.js';
import { DataProvider } from './DataProvider.js';
import { NarrativeBuilder } from './NarrativeBuilder.js';

import type {
  AnalysisError,
  AnalysisInputData,
  AnalysisResultWrapper,
  BatchAnalysisInput,
  BatchAnalysisResult,
  IntegratedAnalysisResult,
  IntegrationContext,
} from './IntegrationTypes.js';
import {
  DEFAULT_INTEGRATION_CONFIG,
  type IntegrationConfig,
} from './IntegrationConfig.js';

export class IntegratedOrchestrator {
  private signalAggregator: SignalAggregator;
  private keyLevelManager: KeyLevelManager;
  private strategyGenerator: StrategyGenerator;
  private dataProvider = new DataProvider(100);
  private narrative = new NarrativeBuilder();
  private logger = createLogger('normal', '[Orchestrator]');

  constructor(private config: IntegrationConfig = DEFAULT_INTEGRATION_CONFIG) {
    this.signalAggregator = new SignalAggregator(config);
    this.keyLevelManager = new KeyLevelManager(config);
    this.strategyGenerator = new StrategyGenerator(config);
    this.registerBuiltInPlugins();
  }

  /** 统一注册内置插件，供构造与配置更新复用 */
  private registerBuiltInPlugins(): void {
    this.signalAggregator.registerPlugin(createChipPlugin());
    this.signalAggregator.registerPlugin(createPatternPlugin());
    this.signalAggregator.registerPlugin(createVolumePlugin());
    this.signalAggregator.registerPlugin(createBbsrPlugin());
    this.signalAggregator.registerPlugin(createStructurePlugin());
    this.signalAggregator.registerPlugin(createSupplyDemandPlugin());
    this.signalAggregator.registerPlugin(createRangePlugin());
    this.signalAggregator.registerPlugin(createTrendlinePlugin());
  }

  /**
   * 执行单个股票的综合分析
   */
  async executeIntegratedAnalysis(
    symbol: string,
    customConfig?: Partial<IntegrationConfig>
  ): Promise<IntegratedAnalysisResult> {
    const startTime = Date.now();
    const executionId = generateUniqueId();

    // 合并配置
    const finalConfig = customConfig
      ? { ...this.config, ...customConfig }
      : this.config;

    // 创建执行上下文
    const context: IntegrationContext = {
      symbol,
      timestamp: new Date(),
      config: finalConfig,
      executionId,
      metadata: {
        version: '2.0.0',
        orchestratorType: 'enhanced',
      },
    };

    try {
      this.logger.setLevel(finalConfig.options.logLevel ?? 'normal');
      this.logger.log(
        `======== 开始执行 ${symbol} 综合分析 (${executionId}) ========`
      );

      // 获取数据
      const dataStartTime = Date.now();
      const { weeklyData, dailyData, hourlyData } =
        await this.dataProvider.getMultiTimeframeData(symbol, finalConfig);
      const dataEndTime = Date.now();

      // 执行各个分析模块
      const analysisStartTime = Date.now();
      const analysisData = await this.executeAllAnalyses(
        symbol,
        weeklyData,
        dailyData,
        hourlyData,
        context
      );
      const analysisEndTime = Date.now();

      // 信号汇总
      const signalStartTime = Date.now();
      const signalResult = this.signalAggregator.aggregateSignals(
        analysisData,
        context
      );
      const signalEndTime = Date.now();

      // 关键位管理
      const keyLevelStartTime = Date.now();
      const keyLevelResult = this.keyLevelManager.extractAndMergeKeyLevels(
        analysisData,
        context
      );
      const keyLevelEndTime = Date.now();

      // 策略生成
      const strategyStartTime = Date.now();
      const strategyInput = {
        symbol,
        currentPrice: analysisData.analyses.chip.currentPrice,
        signalResult,
        keyLevels: keyLevelResult.mergedLevels,
        analyses: analysisData.analyses,
        config: finalConfig,
      };
      const strategyResult =
        this.strategyGenerator.generateStrategy(strategyInput);
      const strategyEndTime = Date.now();

      // 构建最终交易计划
      const tradePlan = this.buildTradePlan(
        symbol,
        analysisData,
        signalResult,
        keyLevelResult,
        strategyResult,
        context
      );

      const totalEndTime = Date.now();

      const result: IntegratedAnalysisResult = {
        tradePlan,
        context,
        performance: {
          totalExecutionTime: totalEndTime - startTime,
          moduleExecutionTimes: {
            dataFetching: dataEndTime - dataStartTime,
            analysis: analysisEndTime - analysisStartTime,
            signalAggregation: signalEndTime - signalStartTime,
            keyLevelManagement: keyLevelEndTime - keyLevelStartTime,
            strategyGeneration: strategyEndTime - strategyStartTime,
          },
          cacheHitRate: this.dataProvider.stats().hitRate,
        },
      };

      this.logger.log(
        `======== ${symbol} 综合分析完成，耗时: ${result.performance.totalExecutionTime}ms ========`
      );

      return result;
    } catch (error) {
      this.logger.error(`综合分析执行失败 (${symbol}):`, error);

      // 创建错误结果
      return {
        tradePlan: this.createFallbackTradePlan(symbol, context),
        context,
        performance: {
          totalExecutionTime: Date.now() - startTime,
          moduleExecutionTimes: {},
        },
        diagnostics: {
          warnings: [],
          errors: [
            {
              code: 'EXECUTION_FAILED',
              message: error instanceof Error ? error.message : 'Unknown error',
              module: 'orchestrator',
              details: error,
              recoverable: false,
            },
          ],
          fallbacksUsed: ['fallback-trade-plan'],
        },
      };
    }
  }

  /**
   * 执行单个加密货币的综合分析（使用 tmai-api 获取OHLCV）
   * 外部应用通过 apiKey 参数传入凭证；遵循 IntegrationConfig.timeframes 的 lookbackDays
   */
  async executeIntegratedCryptoAnalysis(
    symbol: string,
    apiKey: string,
    customConfig?: Partial<IntegrationConfig>
  ): Promise<IntegratedAnalysisResult> {
    const startTime = Date.now();
    const executionId = generateUniqueId();

    // 合并配置
    const finalConfig = customConfig ? { ...this.config, ...customConfig } : this.config;

    // 创建执行上下文
    const context: IntegrationContext = {
      symbol,
      timestamp: new Date(),
      config: finalConfig,
      executionId,
      metadata: {
        version: '2.0.0',
        orchestratorType: 'enhanced',
        dataSource: 'crypto',
      },
    };

    try {
      this.logger.setLevel(finalConfig.options.logLevel ?? 'normal');
      this.logger.log(`======== 开始执行(加密货币) ${symbol} 综合分析 (${executionId}) ========`);

      // 获取加密数据（遵循 lookbackDays）
      const dataStartTime = Date.now();
      const { weeklyData, dailyData, hourlyData } =
        await this.dataProvider.getMultiTimeframeCryptoData(symbol, finalConfig, apiKey);
      const dataEndTime = Date.now();

      // 执行各个分析模块
      const analysisStartTime = Date.now();
      const analysisData = await this.executeAllAnalyses(
        symbol,
        weeklyData,
        dailyData,
        hourlyData,
        context
      );
      const analysisEndTime = Date.now();

      // 信号汇总
      const signalStartTime = Date.now();
      const signalResult = this.signalAggregator.aggregateSignals(analysisData, context);
      const signalEndTime = Date.now();

      // 关键位管理
      const keyLevelStartTime = Date.now();
      const keyLevelResult = this.keyLevelManager.extractAndMergeKeyLevels(analysisData, context);
      const keyLevelEndTime = Date.now();

      // 策略生成
      const strategyStartTime = Date.now();
      const strategyInput = {
        symbol,
        currentPrice: analysisData.analyses.chip.currentPrice,
        signalResult,
        keyLevels: keyLevelResult.mergedLevels,
        analyses: analysisData.analyses,
        config: finalConfig,
      };
      const strategyResult = this.strategyGenerator.generateStrategy(strategyInput);
      const strategyEndTime = Date.now();

      // 构建最终交易计划
      const tradePlan = this.buildTradePlan(
        symbol,
        analysisData,
        signalResult,
        keyLevelResult,
        strategyResult,
        context
      );

      const totalEndTime = Date.now();

      const result: IntegratedAnalysisResult = {
        tradePlan,
        context,
        performance: {
          totalExecutionTime: totalEndTime - startTime,
          moduleExecutionTimes: {
            dataFetching: dataEndTime - dataStartTime,
            analysis: analysisEndTime - analysisStartTime,
            signalAggregation: signalEndTime - signalStartTime,
            keyLevelManagement: keyLevelEndTime - keyLevelStartTime,
            strategyGeneration: strategyEndTime - strategyStartTime,
          },
          cacheHitRate: this.dataProvider.stats().hitRate,
        },
      };

      this.logger.log(
        `======== (加密货币) ${symbol} 综合分析完成，耗时: ${result.performance.totalExecutionTime}ms ========`
      );

      return result;
    } catch (error) {
      this.logger.error(`(加密货币) 综合分析执行失败 (${symbol}):`, error);

      // 创建错误结果
      return {
        tradePlan: this.createFallbackTradePlan(symbol, context),
        context,
        performance: {
          totalExecutionTime: Date.now() - startTime,
          moduleExecutionTimes: {},
        },
        diagnostics: {
          warnings: [],
          errors: [
            {
              code: 'CRYPTO_EXECUTION_FAILED',
              message: error instanceof Error ? error.message : 'Unknown error',
              module: 'orchestrator',
              details: error,
              recoverable: false,
            },
          ],
          fallbacksUsed: ['fallback-trade-plan'],
        },
      };
    }
  }
  /**
   * 批量执行分析
   */
  async executeBatchAnalysis(
    input: BatchAnalysisInput
  ): Promise<BatchAnalysisResult> {
    const startTime = Date.now();
    const results = new Map<string, IntegratedAnalysisResult>();
    const errors = new Map<string, AnalysisError>();

    const parallelLimit = input.parallelLimit || 3;
    const symbols = [...input.symbols];

    // 分批处理
    for (let i = 0; i < symbols.length; i += parallelLimit) {
      const batch = symbols.slice(i, i + parallelLimit);

      const batchPromises = batch.map(async symbol => {
        try {
          const result = await this.executeIntegratedAnalysis(
            symbol,
            input.config
          );
          results.set(symbol, result);
        } catch (error) {
          const analysisError: AnalysisError = {
            code: 'BATCH_ANALYSIS_FAILED',
            message:
              error instanceof Error ? error.message : 'Batch analysis failed',
            module: 'orchestrator',
            details: error,
            recoverable: true,
          };
          errors.set(symbol, analysisError);
        }
      });

      await Promise.all(batchPromises);
    }

    const endTime = Date.now();
    const totalExecutionTime = endTime - startTime;

    return {
      results,
      summary: {
        totalSymbols: input.symbols.length,
        successCount: results.size,
        errorCount: errors.size,
        totalExecutionTime,
        averageExecutionTime: totalExecutionTime / input.symbols.length,
      },
      errors,
    };
  }

  /**
   * 获取多时间周期数据
   */
  // 数据获取已下沉至 DataProvider

  /**
   * 执行所有分析模块
   */
  private async executeAllAnalyses(
    symbol: string,
    weeklyData: Candle[],
    dailyData: Candle[],
    hourlyData: Candle[],
    context: IntegrationContext
  ): Promise<AnalysisInputData> {
    const config = context.config;

    this.logger.setLevel(config.options.logLevel ?? 'normal');
    this.logger.verbose('正在执行各分析模块...');

    try {
      // 并行执行分析（仅保留并行逻辑）
      const [
        chipAnalysis,
        patternAnalysis,
        bbsrAnalysis,
        volatilityAnalysis,
        structureAnalysis,
        supplyDemandAnalysis,
        rangeAnalysis,
        trendlineAnalysis,
      ] = await Promise.all([
        this.executeWithFallback(
          () =>
            multiTimeFrameChipDistAnalysis(
              symbol,
              'daily',
              ['weekly', 'daily', '1hour'],
              { weekly: 0.3, daily: 0.5, '1hour': 0.2 },
              weeklyData,
              dailyData,
              hourlyData
            ),
          'chip'
        ),
        this.executeWithFallback(
          () => analyzeMultiTimeframePattern(weeklyData, dailyData, hourlyData),
          'pattern'
        ),
        this.executeWithFallback(
          () => analyzeMultiTimeBBSR(symbol, dailyData, hourlyData),
          'bbsr'
        ),
        this.executeWithFallback(
          () => analyzeVolumeVolatilityCombined(hourlyData),
          'volatility'
        ),
        this.executeWithFallback(
          () => analyzeMarketStructure(dailyData, 'daily'),
          'structure'
        ),
        this.executeWithFallback(
          () => analyzeSupplyDemandZone(symbol, dailyData, 'daily'),
          'supplyDemand'
        ),
        this.executeWithFallback(
          () => analyzeRange(symbol, dailyData, 'daily'),
          'range'
        ),
        this.executeWithFallback(
          () => analyzeTrendlinesAndChannels(symbol, dailyData, 'daily'),
          'trendline'
        ),
      ]);

      return {
        symbol,
        analyses: {
          chip: chipAnalysis.data!,
          pattern: patternAnalysis.data!,
          volatility: volatilityAnalysis.data!,
          bbsr: bbsrAnalysis.data!,
          structure: structureAnalysis.data!,
          supplyDemand: supplyDemandAnalysis.data!,
          range: rangeAnalysis.data!,
          trendline: trendlineAnalysis.data!,
        },
      };
    } catch (error) {
      throw new Error(
        `分析模块执行失败: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * 带降级策略的执行包装器
   */
  private async executeWithFallback<T>(
    analysisFunction: () => Promise<T> | T,
    moduleName: string
  ): Promise<AnalysisResultWrapper<T>> {
    const startTime = Date.now();

    try {
      const result = await analysisFunction();

      return {
        success: true,
        data: result,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      const analysisError: AnalysisError = {
        code: `${moduleName.toUpperCase()}_FAILED`,
        message: error instanceof Error ? error.message : 'Analysis failed',
        module: moduleName,
        details: error,
        recoverable: true,
      };

      // 如果启用了降级策略，返回基础结果
      if (this.config.options.enableFallbackStrategy) {
        const fallbackData = this.createFallbackData(moduleName) as T;
        return {
          success: false,
          error: analysisError,
          fallback: fallbackData,
          data: fallbackData,
          executionTime: Date.now() - startTime,
        };
      }

      throw error;
    }
  }

  /**
   * 创建降级数据
   */
  private createFallbackData(moduleName: string): any {
    switch (moduleName) {
      case 'chip':
        return {
          symbol: 'UNKNOWN',
          currentPrice: 0,
          combinedBuySignalStrength: 50,
          combinedShortSignalStrength: 50,
          majorSupportLevels: [],
          majorResistanceLevels: [],
          strongSupportLevels: [],
          strongResistanceLevels: [],
          primaryTimeframe: 'daily',
        };
      case 'pattern':
        return {
          combinedSignal: 'neutral',
          signalStrength: 0,
          reversalSignals: [],
        };
      // ... 其他模块的降级数据
      default:
        return {};
    }
  }

  /**
   * 构建交易计划
   */
  private buildTradePlan(
    symbol: string,
    analysisData: AnalysisInputData,
    signalResult: any,
    keyLevelResult: any,
    strategyResult: any,
    context: IntegrationContext
  ): IntegratedTradePlan {
    // 构建完整的交易计划
    return {
      symbol,
      currentPrice: analysisData.analyses.chip.currentPrice,
      date: context.timestamp,

      direction: signalResult.direction,
      signalStrength: signalResult.signalStrength,
      confidenceScore: signalResult.confidenceScore,

      // 权重信息
      chipAnalysisWeight: context.config.weights.chip,
      patternAnalysisWeight: context.config.weights.pattern,
      volumeAnalysisWeight: context.config.weights.volume,
      bbsrAnalysisWeight: context.config.weights.bbsr,

      // 贡献度
      chipAnalysisContribution: signalResult.contributions.chip,
      patternAnalysisContribution: signalResult.contributions.pattern,
      volumeAnalysisContribution: signalResult.contributions.volume,
      bbsrAnalysisContribution: signalResult.contributions.bbsr,

      // 策略相关
      entryStrategy: strategyResult.entryStrategy,
      exitStrategy: strategyResult.exitStrategy,
      riskManagement: strategyResult.riskManagement,

      // 关键信息
      keyLevels: keyLevelResult.mergedLevels,
      confirmationSignals: strategyResult.confirmationSignals,
      invalidationConditions: strategyResult.invalidationConditions,
      keyObservations: strategyResult.keyObservations,
      warnings: strategyResult.warnings,

      // 分析相关
      bbsrAnalysis: analysisData.analyses.bbsr,

      // 新增字段
      summary: this.narrative.buildSummary(signalResult),
      primaryRationale: this.narrative.buildPrimaryRationale(
        signalResult,
        analysisData.analyses
      ),
      secondaryRationale: this.narrative.buildSecondaryRationale(
        analysisData.analyses
      ),

      primaryTimeframe: analysisData.analyses.chip?.primaryTimeframe ?? 'daily',
      timeframeConsistency: this.calculateTimeframeConsistency(analysisData),
      shortTermOutlook: this.narrative.buildShortTermOutlook(
        analysisData.analyses
      ),
      mediumTermOutlook: this.narrative.buildMediumTermOutlook(
        analysisData.analyses
      ),
      longTermOutlook: this.narrative.buildLongTermOutlook(
        analysisData.analyses
      ),

      trendReversalInfo: this.extractTrendReversalInfo(
        analysisData.analyses.pattern
      ),

      vvInsights: {
        volumeAnalysisReason:
          analysisData.analyses.volatility.volumeAnalysisReason || '',
        volatilityAnalysisReason:
          analysisData.analyses.volatility.volatilityAnalysisReason || '',
        combinedAnalysisSummary:
          analysisData.analyses.volatility.combinedAnalysisSummary || '',
      },

      summaries: this.narrative.buildSummariesFromPlugins(
        this.signalAggregator.getPlugins(),
        analysisData,
        context
      ),
    };
  }

  /**
   * 创建降级交易计划
   */
  private createFallbackTradePlan(
    symbol: string,
    context: IntegrationContext
  ): IntegratedTradePlan {
    return {
      symbol,
      currentPrice: 0,
      date: context.timestamp,
      direction: 'neutral' as any,
      signalStrength: 'none' as any,
      confidenceScore: 0,
      chipAnalysisWeight: 0.25,
      patternAnalysisWeight: 0.35,
      volumeAnalysisWeight: 0.25,
      bbsrAnalysisWeight: 0.15,
      chipAnalysisContribution: 0,
      patternAnalysisContribution: 0,
      volumeAnalysisContribution: 0,
      bbsrAnalysisContribution: 0,
      entryStrategy: {
        idealEntryPrice: 0,
        alternativeEntryPrice: 0,
        entryType: 'immediate',
        entryConditions: [],
        priceZones: { ideal: [0, 0], acceptable: [0, 0] },
        timeWindow: 'N/A',
        riskLevel: 'medium' as any,
      },
      exitStrategy: {
        takeProfitLevels: [],
        stopLossLevels: [],
        timeBasedExit: 'N/A',
        maximumHoldingPeriod: 'N/A',
      },
      riskManagement: {
        suggestionPosition: 0,
        riskRewardRatio: 0,
        maxLoss: 'N/A',
        volatilityConsideration: 'N/A',
        adjustmentTriggers: [],
      },
      keyLevels: [],
      confirmationSignals: [],
      invalidationConditions: [],
      keyObservations: ['分析执行失败，使用降级模式'],
      warnings: ['分析模块执行失败，建议手动验证'],
      bbsrAnalysis: {} as any,
      summary: '分析失败，无法生成摘要',
      primaryRationale: '分析失败，无法确定主要逻辑',
      secondaryRationale: '分析失败，无法确定次要逻辑',
      primaryTimeframe: 'daily',
      timeframeConsistency: '0%',
      shortTermOutlook: '无法确定',
      mediumTermOutlook: '无法确定',
      longTermOutlook: '无法确定',
      trendReversalInfo: { hasReversalSignal: false, description: '无法检测' },
      vvInsights: {
        volumeAnalysisReason: '分析失败',
        volatilityAnalysisReason: '分析失败',
        combinedAnalysisSummary: '分析失败',
      },
      summaries: {
        chipSummary: '分析失败',
        patternSummary: '分析失败',
        bbsrSummary: '分析失败',
        vvSummary: '分析失败',
        structureSummary: '分析失败',
        supplyDemandSummary: '分析失败',
        rangeSummary: '分析失败',
        trendlineSummary: '分析失败',
      },
    };
  }

  /**
   * 计算时间周期一致性
   */
  private calculateTimeframeConsistency(
    analysisData: AnalysisInputData
  ): string {
    const cfg = this.config.consistency;
    const pattern: any = analysisData.analyses.pattern;

    // 形态多周期方向按权重折算为分数（多头=1，空头=-1，缺省=0）
    let patternScore = 0;
    const tfAnalyses = pattern?.timeframeAnalyses as
      | { timeframe: 'weekly' | 'daily' | '1hour'; patternSignal?: string }[]
      | undefined;
    if (Array.isArray(tfAnalyses)) {
      for (const tf of tfAnalyses) {
        const w = cfg.timeframeWeights[tf.timeframe] ?? 0;
        if (tf.patternSignal === 'bullish') patternScore += 1 * w;
        else if (tf.patternSignal === 'bearish') patternScore += -1 * w;
      }
    }

    // 结构趋势辅助
    const structure = analysisData.analyses.structure;
    if (structure?.trend === 'up')
      patternScore += 1 * (cfg.structureWeight ?? 0);
    else if (structure?.trend === 'down')
      patternScore += -1 * (cfg.structureWeight ?? 0);

    // 趋势线斜率辅助
    const tl: any = analysisData.analyses.trendline;
    if (tl?.channel?.slope > 0) patternScore += 1 * (cfg.trendlineWeight ?? 0);
    else if (tl?.channel?.slope < 0)
      patternScore += -1 * (cfg.trendlineWeight ?? 0);

    // 归一化到 0-100%，绝对值越接近1一致性越高
    const maxPossible =
      (cfg.timeframeWeights.weekly ?? 0) +
      (cfg.timeframeWeights.daily ?? 0) +
      (cfg.timeframeWeights['1hour'] ?? 0) +
      (cfg.structureWeight ?? 0) +
      (cfg.trendlineWeight ?? 0);
    if (maxPossible <= 0) return '0%';

    const ratio = Math.min(1, Math.abs(patternScore) / maxPossible);
    return `${Math.round(ratio * 100)}%`;
  }

  /**
   * 提取趋势反转信息
   */
  private extractTrendReversalInfo(patternAnalysis: any): any {
    // 优先使用增强的趋势逆转信号（如存在）
    const primary = patternAnalysis?.primaryReversalSignal;
    const signals = patternAnalysis?.reversalSignals as any[] | undefined;

    if (primary) {
      const dir =
        primary.direction > 0
          ? '看多'
          : primary.direction < 0
            ? '看空'
            : '中性';
      return {
        hasReversalSignal: !!primary.isReversal,
        description: `检测到${dir}逆转信号，强度${Math.round(primary.reversalStrength ?? 0)}，小周期: ${primary.smallTimeframe} 对 大周期: ${primary.largeTimeframe}`,
        targets: primary.targets ?? undefined,
      };
    }

    if (Array.isArray(signals) && signals.length > 0) {
      const best = [...signals].sort(
        (a, b) => (b.reversalStrength ?? 0) - (a.reversalStrength ?? 0)
      )[0];
      const dir =
        best.direction > 0 ? '看多' : best.direction < 0 ? '看空' : '中性';
      return {
        hasReversalSignal: !!best.isReversal,
        description: `检测到${dir}逆转信号，强度${Math.round(best.reversalStrength ?? 0)}，小周期: ${best.smallTimeframe} 对 大周期: ${best.largeTimeframe}`,
        targets: best.targets ?? undefined,
      };
    }

    // 退化：根据综合形态方向给出提示
    const combined = patternAnalysis?.combinedSignal;
    if (combined === 'bullish' || combined === 'bearish') {
      return {
        hasReversalSignal: false,
        description: `当前形态综合方向为${combined === 'bullish' ? '看多' : '看空'}，未形成明确的逆转模板`,
      };
    }

    return { hasReversalSignal: false, description: '未检测到趋势反转信号' };
  }

  // 摘要与叙述构建已下沉到 NarrativeBuilder

  // 展望构建已下沉到 NarrativeBuilder

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<IntegrationConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // 更新子模块配置
    this.signalAggregator = new SignalAggregator(this.config);
    this.keyLevelManager = new KeyLevelManager(this.config);
    this.strategyGenerator = new StrategyGenerator(this.config);
    this.registerBuiltInPlugins();
  }

  // 缓存统计如需对外暴露，可直接使用 this.dataCache.stats()
}
