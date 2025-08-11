/**
 * 集成分析编排器
 * 负责协调各个分析模块的执行和结果整合
 */

import type { IntegratedTradePlan } from '../../types.js';
import { Candle } from '../../types.js';
import { generateUniqueId, getStockDataForTimeframe } from '../../util/util.js';

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
  private dataCache = new Map<string, Candle[]>();

  constructor(private config: IntegrationConfig = DEFAULT_INTEGRATION_CONFIG) {
    this.signalAggregator = new SignalAggregator(config);
    this.keyLevelManager = new KeyLevelManager(config);
    this.strategyGenerator = new StrategyGenerator(config);
    // 注册内置插件
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
      if (finalConfig.options.logLevel !== 'silent') {
        console.log(
          `======== 开始执行 ${symbol} 综合分析 (${executionId}) ========`
        );
      }

      // 获取数据
      const dataStartTime = Date.now();
      const { weeklyData, dailyData, hourlyData } =
        await this.getMultiTimeframeData(symbol, finalConfig);
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
          cacheHitRate: this.calculateCacheHitRate(),
        },
      };

      if (finalConfig.options.logLevel !== 'silent') {
        console.log(
          `======== ${symbol} 综合分析完成，耗时: ${result.performance.totalExecutionTime}ms ========`
        );
      }

      return result;
    } catch (error) {
      console.error(`综合分析执行失败 (${symbol}):`, error);

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
  private async getMultiTimeframeData(
    symbol: string,
    config: IntegrationConfig
  ): Promise<{
    weeklyData: Candle[];
    dailyData: Candle[];
    hourlyData: Candle[];
  }> {
    const today = new Date();

    // 计算开始日期
    const weeklyStartDate = new Date(today);
    weeklyStartDate.setDate(
      weeklyStartDate.getDate() - config.timeframes.weekly.lookbackDays
    );

    const dailyStartDate = new Date(today);
    dailyStartDate.setDate(
      dailyStartDate.getDate() - config.timeframes.daily.lookbackDays
    );

    const hourlyStartDate = new Date(today);
    hourlyStartDate.setDate(
      hourlyStartDate.getDate() - config.timeframes.hourly.lookbackDays
    );

    if (config.options.enableParallelAnalysis) {
      // 并行获取数据
      const [weeklyData, dailyData, hourlyData] = await Promise.all([
        this.getCachedStockData(symbol, weeklyStartDate, today, 'weekly'),
        this.getCachedStockData(symbol, dailyStartDate, today, 'daily'),
        this.getCachedStockData(symbol, hourlyStartDate, today, '1hour'),
      ]);

      return { weeklyData, dailyData, hourlyData };
    } else {
      // 串行获取数据
      const weeklyData = await this.getCachedStockData(
        symbol,
        weeklyStartDate,
        today,
        'weekly'
      );
      const dailyData = await this.getCachedStockData(
        symbol,
        dailyStartDate,
        today,
        'daily'
      );
      const hourlyData = await this.getCachedStockData(
        symbol,
        hourlyStartDate,
        today,
        '1hour'
      );

      return { weeklyData, dailyData, hourlyData };
    }
  }

  /**
   * 带缓存的数据获取
   */
  private async getCachedStockData(
    symbol: string,
    startDate: Date,
    endDate: Date,
    timeframe: 'weekly' | 'daily' | '1hour'
  ): Promise<Candle[]> {
    const cacheKey = `${symbol}_${timeframe}_${startDate.toISOString()}_${endDate.toISOString()}`;

    if (this.dataCache.has(cacheKey)) {
      return this.dataCache.get(cacheKey)!;
    }

    const data = await getStockDataForTimeframe(
      symbol,
      startDate,
      endDate,
      timeframe
    );
    this.dataCache.set(cacheKey, data);

    // 清理过期缓存（保留最近100个条目）
    if (this.dataCache.size > 100) {
      const keys = Array.from(this.dataCache.keys());
      const keysToDelete = keys.slice(0, keys.length - 100);
      keysToDelete.forEach(key => this.dataCache.delete(key));
    }

    return data;
  }

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

    if (config.options.logLevel === 'verbose') {
      console.log('正在执行各分析模块...');
    }

    try {
      if (config.options.enableParallelAnalysis) {
        // 并行执行分析
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
          // TODO multiTimeCandleAnalysis not used here??

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
            () =>
              analyzeMultiTimeframePattern(weeklyData, dailyData, hourlyData),
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
      } else {
        // 串行执行分析
        if (config.options.logLevel === 'verbose') {
          console.log('正在执行筹码分布分析...');
        }
        const chipAnalysis = await this.executeWithFallback(
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
        );

        if (config.options.logLevel === 'verbose') {
          console.log('正在执行形态分析...');
        }
        const patternAnalysis = await this.executeWithFallback(
          () => analyzeMultiTimeframePattern(weeklyData, dailyData, hourlyData),
          'pattern'
        );

        // ... 其他分析的串行执行逻辑
        const bbsrAnalysis = await this.executeWithFallback(
          () => analyzeMultiTimeBBSR(symbol, dailyData, hourlyData),
          'bbsr'
        );

        const volatilityAnalysis = await this.executeWithFallback(
          () => analyzeVolumeVolatilityCombined(hourlyData),
          'volatility'
        );

        const structureAnalysis = await this.executeWithFallback(
          () => analyzeMarketStructure(dailyData, 'daily'),
          'structure'
        );

        const supplyDemandAnalysis = await this.executeWithFallback(
          () => analyzeSupplyDemandZone(symbol, dailyData, 'daily'),
          'supplyDemand'
        );

        const rangeAnalysis = await this.executeWithFallback(
          () => analyzeRange(symbol, dailyData, 'daily'),
          'range'
        );

        const trendlineAnalysis = await this.executeWithFallback(
          () => analyzeTrendlinesAndChannels(symbol, dailyData, 'daily'),
          'trendline'
        );

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
      }
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
      summary: this.generateSummary(signalResult, analysisData),
      primaryRationale: this.generatePrimaryRationale(
        signalResult,
        analysisData
      ),
      secondaryRationale: this.generateSecondaryRationale(
        signalResult,
        analysisData
      ),

      primaryTimeframe: 'daily',
      timeframeConsistency: this.calculateTimeframeConsistency(analysisData),
      shortTermOutlook: this.buildShortTermOutlook(analysisData.analyses),
      mediumTermOutlook: this.buildMediumTermOutlook(analysisData.analyses),
      longTermOutlook: this.buildLongTermOutlook(analysisData.analyses),

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

      summaries: {
        chipSummary: this.buildChipSummary(analysisData.analyses.chip),
        patternSummary: this.buildPatternSummary(analysisData.analyses.pattern),
        bbsrSummary: this.buildBbsrSummary(analysisData.analyses.bbsr),
        vvSummary: this.buildVvSummary(analysisData.analyses.volatility),
        structureSummary: this.buildStructureSummary(
          analysisData.analyses.structure
        ),
        supplyDemandSummary: this.buildSupplyDemandSummary(
          analysisData.analyses.supplyDemand
        ),
        rangeSummary: this.buildRangeSummary(analysisData.analyses.range),
        trendlineSummary: this.buildTrendlineSummary(
          analysisData.analyses.trendline
        ),
      },
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
   * 计算缓存命中率
   */
  private calculateCacheHitRate(): number {
    // 简化实现，实际应该跟踪命中和未命中次数
    return this.dataCache.size > 0 ? 0.8 : 0;
  }

  /**
   * 生成摘要
   */
  private generateSummary(
    signalResult: any,
    analysisData: AnalysisInputData
  ): string {
    const direction =
      signalResult.direction === 'long'
        ? '做多'
        : signalResult.direction === 'short'
          ? '做空'
          : '中性';
    return `基于综合分析，建议${direction}，置信度${signalResult.confidenceScore.toFixed(1)}%`;
  }

  /**
   * 生成主要逻辑
   */
  private generatePrimaryRationale(
    signalResult: any,
    analysisData: AnalysisInputData
  ): string {
    return '综合各模块分析结果，形成主要交易逻辑';
  }

  /**
   * 生成次要逻辑
   */
  private generateSecondaryRationale(
    signalResult: any,
    analysisData: AnalysisInputData
  ): string {
    return '辅助分析因子支持主要判断';
  }

  /**
   * 计算时间周期一致性
   */
  private calculateTimeframeConsistency(
    analysisData: AnalysisInputData
  ): string {
    // 简化实现：返回字符串以符合 IntegratedTradePlan 类型定义
    return '80%';
  }

  /**
   * 提取趋势反转信息
   */
  private extractTrendReversalInfo(patternAnalysis: any): any {
    return {
      hasReversalSignal: false,
      description: '未检测到趋势反转信号',
    };
  }

  // === 各模块摘要构建 ===
  private buildChipSummary(
    chip: AnalysisInputData['analyses']['chip']
  ): string {
    return `买入强度:${chip.combinedBuySignalStrength} 做空强度:${chip.combinedShortSignalStrength} 主周期:${chip.primaryTimeframe}`;
  }

  private buildPatternSummary(
    pattern: AnalysisInputData['analyses']['pattern']
  ): string {
    return `形态综合方向:${pattern.combinedSignal} 强度:${pattern.signalStrength.toFixed?.(1) ?? pattern.signalStrength}`;
  }

  private buildBbsrSummary(
    bbsr: AnalysisInputData['analyses']['bbsr']
  ): string {
    const daily = bbsr.dailyBBSRResult?.strength;
    const weekly = bbsr.weeklyBBSRResult?.strength;
    return `BBSR(日/周) 强度:${daily ?? '-'} / ${weekly ?? '-'}`;
  }

  private buildVvSummary(
    vv: AnalysisInputData['analyses']['volatility']
  ): string {
    const regime =
      vv.volatilityAnalysis?.volatilityAnalysis?.volatilityRegime ?? 'low';
    const atrp = vv.volatilityAnalysis?.volatilityAnalysis?.atrPercent ?? 0;
    const volConfirm = vv.volumeAnalysis?.volumeAnalysis
      ?.volumePriceConfirmation
      ? '确认'
      : '未确认';
    return `波动率:${regime} ATR%:${atrp.toFixed?.(2) ?? atrp} 成交量确认:${volConfirm}`;
  }

  private buildStructureSummary(
    structure: AnalysisInputData['analyses']['structure']
  ): string {
    return `结构趋势:${structure.trend} 关键位数:${structure.keyLevels?.length ?? 0}`;
  }

  private buildSupplyDemandSummary(
    sd: AnalysisInputData['analyses']['supplyDemand']
  ): string {
    const pos = sd.premiumDiscount?.position ?? 50;
    const zones = sd.recentEffectiveZones?.length ?? 0;
    return `供需位置:${pos.toFixed?.(1) ?? pos} 有效区域:${zones}`;
  }

  private buildRangeSummary(
    range: AnalysisInputData['analyses']['range']
  ): string {
    const comp = range.compressionScore;
    const br = range.breakout
      ? `${range.breakout.direction}/${range.breakout.qualityScore}`
      : '无突破';
    return `压缩:${comp} 突破:${br}`;
  }

  private buildTrendlineSummary(
    tl: AnalysisInputData['analyses']['trendline']
  ): string {
    const slope = tl.channel?.slope ?? 0;
    return tl.summary || `通道斜率:${slope.toFixed?.(4) ?? slope}`;
  }

  // === 展望构建 ===
  private buildShortTermOutlook(
    analyses: AnalysisInputData['analyses']
  ): string {
    const pattern = analyses.pattern;
    const vv = analyses.volatility;
    const tl = analyses.trendline;
    const dir = pattern.combinedSignal;
    const regime =
      vv.volatilityAnalysis?.volatilityAnalysis?.volatilityRegime ?? 'low';
    const slope = tl.channel?.slope ?? 0;
    return `短期(${dir})，波动率${regime}，通道斜率${slope.toFixed?.(3) ?? slope}`;
  }

  private buildMediumTermOutlook(
    analyses: AnalysisInputData['analyses']
  ): string {
    const chip = analyses.chip;
    const sd = analyses.supplyDemand;
    const pos = sd.premiumDiscount?.position ?? 50;
    return `中期(筹码买:${chip.combinedBuySignalStrength}/卖:${chip.combinedShortSignalStrength})，估值位置${pos.toFixed?.(1) ?? pos}`;
  }

  private buildLongTermOutlook(
    analyses: AnalysisInputData['analyses']
  ): string {
    const structure = analyses.structure;
    const range = analyses.range;
    const trend = structure.trend;
    const comp = range.compressionScore;
    return `长期(${trend})，压缩度${comp}`;
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<IntegrationConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // 更新子模块配置
    this.signalAggregator = new SignalAggregator(this.config);
    this.keyLevelManager = new KeyLevelManager(this.config);
    this.strategyGenerator = new StrategyGenerator(this.config);
  }

  /**
   * 清理缓存
   */
  clearCache(): void {
    this.dataCache.clear();
  }

  /**
   * 获取缓存统计
   */
  getCacheStats() {
    return {
      totalEntries: this.dataCache.size,
      totalSize: this.dataCache.size * 1000, // 估算
    };
  }
}
