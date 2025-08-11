/**
 * 集成分析专用类型定义
 */

import type {
  MultiTimeFrameBBSRAnalysisResult,
  IntegratedTradePlan,
  TradeDirection,
  SignalStrength,
  KeyLevel,
} from '../../types.js';
import type { MultiTimeframeAnalysisResult } from '../analyzer/chip/chipMultiTypes.js';
import type { ComprehensivePatternAnalysis } from '../basic/patterns/analyzeMultiTimeframePatterns.js';
import type { CombinedVVAnalysisResult } from '../analyzer/volatility/volumeVolatilityAnalysis.js';
import type { StructureResult } from '../analyzer/structure/structureTypes.js';
import type { SdAnalysisResult } from '../analyzer/supplyDemand/sdTypes.js';
import type { RangeAnalysisResult } from '../analyzer/range/rangeTypes.js';
import type { TrendlineChannelAnalysisResult } from '../analyzer/trendline/trendlineTypes.js';
import type { IntegrationConfig } from './IntegrationConfig.js';

/**
 * 分析输入数据结构
 */
export interface AnalysisInputData {
  symbol: string;
  analyses: {
    chip: MultiTimeframeAnalysisResult;
    pattern: ComprehensivePatternAnalysis;
    volatility: CombinedVVAnalysisResult;
    bbsr: MultiTimeFrameBBSRAnalysisResult;
    structure: StructureResult;
    supplyDemand: SdAnalysisResult;
    range: RangeAnalysisResult;
    trendline: TrendlineChannelAnalysisResult;
  };
}

/**
 * 信号汇总结果
 */
export interface SignalAggregationResult {
  finalScore: number;
  direction: TradeDirection;
  signalStrength: SignalStrength;
  confidenceScore: number;
  contributions: {
    chip: number;
    pattern: number;
    volume: number;
    bbsr: number;
    structure?: number;
    supplyDemand?: number;
    range?: number;
    trendline?: number;
  };
  // 额外（插件）贡献与分数，按模块ID记录，便于扩展
  extraContributions?: Record<string, number>;
  weightedScores: {
    chip: number;
    pattern: number;
    volume: number;
    bbsr: number;
    structure?: number;
    supplyDemand?: number;
    range?: number;
    trendline?: number;
  };
  extraWeightedScores?: Record<string, number>;
}

/**
 * 个别分析结果包装
 */
export interface AnalysisResultWrapper<T> {
  success: boolean;
  data?: T;
  error?: AnalysisError;
  fallback?: Partial<T>;
  executionTime?: number;
}

/**
 * 分析错误类型
 */
export interface AnalysisError {
  code: string;
  message: string;
  module: string;
  details?: any;
  recoverable: boolean;
}

/**
 * 关键位合并结果
 */
export interface KeyLevelMergeResult {
  mergedLevels: KeyLevel[];
  originalCount: number;
  mergedCount: number;
  compressionRatio: number;
}

/**
 * 策略生成输入
 */
export interface StrategyGenerationInput {
  symbol: string;
  currentPrice: number;
  signalResult: SignalAggregationResult;
  keyLevels: KeyLevel[];
  analyses: AnalysisInputData['analyses'];
  config: IntegrationConfig;
}

/**
 * 策略生成结果
 */
export interface StrategyGenerationResult {
  entryStrategy: IntegratedTradePlan['entryStrategy'];
  exitStrategy: IntegratedTradePlan['exitStrategy'];
  riskManagement: IntegratedTradePlan['riskManagement'];
  confirmationSignals: IntegratedTradePlan['confirmationSignals'];
  invalidationConditions: IntegratedTradePlan['invalidationConditions'];
  keyObservations: IntegratedTradePlan['keyObservations'];
  warnings: IntegratedTradePlan['warnings'];
}

/**
 * 执行上下文
 */
export interface IntegrationContext {
  symbol: string;
  timestamp: Date;
  config: IntegrationConfig;
  executionId: string;
  metadata?: Record<string, any>;
}

/**
 * 集成分析结果（包含调试信息）
 */
export interface IntegratedAnalysisResult {
  tradePlan: IntegratedTradePlan;
  context: IntegrationContext;
  performance: {
    totalExecutionTime: number;
    moduleExecutionTimes: Record<string, number>;
    cacheHitRate?: number;
  };
  diagnostics?: {
    warnings: string[];
    errors: AnalysisError[];
    fallbacksUsed: string[];
  };
}

/**
 * 方向转换结果
 */
export interface DirectionConversionResult {
  direction: TradeDirection;
  confidence: number;
  source: string;
}

/**
 * 分析插件接口：用于扩展新的分析模块而无需修改聚合器核心逻辑
 * id: 模块唯一标识
 * category: 'additional' 类别默认不参与主权重归一化
 * extract: 提取方向与置信度
 */
export interface AnalyzerPlugin {
  id: string;
  category: 'additional' | 'main';
  extract: (input: AnalysisInputData, context: IntegrationContext) => DirectionConversionResult;
}

/**
 * 分数计算结果
 */
export interface ScoreCalculationResult {
  rawScore: number;
  weightedScore: number;
  direction: TradeDirection;
  contribution: number;
  source: string;
}

/**
 * 批量分析输入
 */
export interface BatchAnalysisInput {
  symbols: string[];
  config?: IntegrationConfig;
  parallelLimit?: number;
}

/**
 * 批量分析结果
 */
export interface BatchAnalysisResult {
  results: Map<string, IntegratedAnalysisResult>;
  summary: {
    totalSymbols: number;
    successCount: number;
    errorCount: number;
    totalExecutionTime: number;
    averageExecutionTime: number;
  };
  errors: Map<string, AnalysisError>;
}

/**
 * 缓存键类型
 */
export type CacheKey = string;

/**
 * 缓存条目
 */
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  size?: number;
}

/**
 * 缓存统计
 */
export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  totalEntries: number;
  totalSize: number;
}
