import { DataProvider } from './data/DataProvider.js';

export {
  // 类型和接口
  PatternType,
  PatternStatus,
  PatternDirection,
  PeakValley,
  PatternComponent,
  PatternAnalysisResult,
  AnalyzeMultiTimeframePatterns,
  ComprehensivePatternAnalysis,
  analyzeAllPatterns,
  combinePatternAnalyses,
  analyzeMultiTimeframePatterns,
  formatAndPrintPatternAnalysis,
} from './analysis/basic/patterns/analyzeMultiTimeframePatterns.js';
// 暴露形态分析配置，便于外部项目按需调整
export {
  patternConfig,
  updatePatternConfig,
} from './analysis/basic/patterns/patternConfig.js';

export {
  determineTrendDirection,
  detectTrendReversal,
  TrendReversalSignal,
  EnhancedPatternAnalysis,
  analyzeMultiTimeframePattern,
} from './analysis/analyzer/trendReversal/multiTimeFrameTrendReversal.js';
export {
  trendReversalConfig,
  updateTrendReversalConfig,
} from './analysis/analyzer/trendReversal/trendReversalConfig.js';
export { formatAndPrintEnhancedPatternAnalysis } from './analysis/analyzer/trendReversal/formatReport.js';

export {
  hasTrendReversalSignal,
  checkStockForReversalSignal,
  batchCheckForReversalSignals,
  generateReversalReport,
} from './analysis/analyzer/trendReversal/trendReversalChecker.js';

export {
  MultiTimeframeAnalysisResult,
  TimeframeAnalysis,
  multiTimeFrameChipDistAnalysis,
  formatAndPrintChipAnalysis,
} from './analysis/analyzer/chip/multiTimeFrameChipDistributionAnalysis.js';

// 暴露筹码配置，便于外部项目调整阈值与权重
export {
  chipConfig,
  updateChipConfig,
} from './analysis/analyzer/chip/chipConfig.js';

export {
  executeIntegratedAnalysisV2,
  executeIntegratedCryptoAnalysisV2,
  executeBatchAnalysis,
} from './analysis/IntegratedAnalysis.js';

// 新增的波动率分析导出
export {
  calculateVolatilityAnalysis,
  formatVolatilityAnalysis,
  EnhancedVolatilityAnalysisResult,
  analyzeVolumeVolatilityCombined,
} from './analysis/analyzer/volatility/volatilityAnalysis.js';
export {
  volatilityConfig,
  updateVolatilityConfig,
} from './analysis/analyzer/volatility/volatilityConfig.js';

// 新增的积累分布线分析导出
export {
  calculateAccumulationDistribution,
  formatAccumulationDistributionAnalysis,
  AccumulationDistributionResult,
} from './util/accumulationDistribution.js';

// 新增的综合波动率和量价分析导出
export {
  executeVolumeAnalysis,
  IntegratedVolumeAnalysisResult,
  IntegratedVolatilityAnalysisResult,
} from './analysis/analyzer/volatility/volumeVolatilityAnalysis.js';

export { fetchChartData } from './image/chartImage.js';

export * from './types.js';

export {
  getStockDataForTimeframe,
  getFullExchangeNameBySymbol,
} from './util/util.js';

// 暴露蜡烛图配置，便于外部按需调整
export {
  candleConfig,
  updateCandleConfig,
} from './analysis/basic/candle/candleConfig.js';
// 暴露蜡烛图多时间框架分析入口与格式化
export { multiTimeCandleAnalysis } from './analysis/basic/candle/multiTimeCandleAnalysis.js';
export { formatAndPrintCandleAnalysis } from './analysis/basic/candle/formatCandleAnalysis.js';
// 导出综合交易计划的格式化与机器摘要构建
export {
  formatTradePlanOutput,
  buildMachineReadableSummary,
} from './analysis/FormatTradePlan.js';

// 暴露BBSR（支撑阻力 + 近期多空）分析能力与配置
export { analyzeMultiTimeBBSR } from './analysis/analyzer/sr/multiTimeFrameBBSRAnalysis.js';
export { formatAndPrintSrAnalysis } from './analysis/analyzer/sr/formatSrAnalysis.js';
export { srConfig, updateSrConfig } from './analysis/analyzer/sr/srConfig.js';

// Market Structure
export { runMultiTimeStructure } from './analysis/analyzer/structure/multiTimeStructure.js';
export { formatAndPrintStructureResult } from './analysis/analyzer/structure/formatStructure.js';
export {
  structureConfig,
  updateStructureConfig,
} from './analysis/analyzer/structure/structureConfig.js';

// Supply/Demand Zones
export { analyzeSupplyDemandZone } from './analysis/analyzer/supplyDemand/sdDetector.js';
export { formatAndPrintSupplyDemand } from './analysis/analyzer/supplyDemand/formatSupplyDemand.js';
export {
  sdConfig,
  updateSdConfig,
} from './analysis/analyzer/supplyDemand/sdConfig.js';
export { multiTimeSupplyDemand } from './analysis/analyzer/supplyDemand/multiTimeSupplyDemand.js';

// Range & Breakout
export { analyzeRange } from './analysis/analyzer/range/rangeDetector.js';
export { formatAndPrintRange } from './analysis/analyzer/range/formatRange.js';
export {
  rangeConfig,
  updateRangeConfig,
} from './analysis/analyzer/range/rangeConfig.js';

// Trendlines & Channels
export { analyzeTrendlinesAndChannels } from './analysis/analyzer/trendline/trendlineDetector.js';
export { formatAndPrintTrendlines } from './analysis/analyzer/trendline/formatTrendline.js';
export { multiTimeTrendlines } from './analysis/analyzer/trendline/multiTimeTrendlines.js';
export {
  trendlineConfig,
  updateTrendlineConfig,
} from './analysis/analyzer/trendline/trendlineConfig.js';

// === 新架构集成分析模块 ===
// 集成配置管理
export {
  DEFAULT_INTEGRATION_CONFIG,
  updateIntegrationConfig,
  normalizeWeights,
  validateConfig,
} from './analysis/integration/IntegrationConfig.js';
export type {
  IntegrationConfig,
  IntegrationWeights,
  IntegrationThresholds,
  IntegrationOptions,
} from './analysis/integration/IntegrationConfig.js';

// 集成类型定义
export type {
  AnalysisInputData,
  SignalAggregationResult,
  AnalysisResultWrapper,
  AnalysisError,
  KeyLevelMergeResult,
  StrategyGenerationInput,
  StrategyGenerationResult,
  IntegrationContext,
  IntegratedAnalysisResult,
  BatchAnalysisInput,
  BatchAnalysisResult,
} from './analysis/integration/IntegrationTypes.js';

// 信号汇总器
export { SignalAggregator } from './analysis/integration/SignalAggregator.js';

// 关键位管理器
export { KeyLevelManager } from './analysis/integration/KeyLevelManager.js';

// 策略生成器
export { StrategyGenerator } from './analysis/integration/StrategyGenerator.js';

// 集成编排器（主要入口）
export { IntegratedOrchestrator } from './analysis/integration/IntegratedOrchestrator.js';

export {
  runGridSearch,
  type ParamGrid,
  type StrategyFactory,
  formatMetricsPanel,
} from './analysis/backtest/GridSearch.js';
export { Backtester } from './analysis/backtest/Backtester.js';
export { TrendlineBreakoutStrategy } from './analysis/backtest/strategies/TrendlineBreakoutStrategy.js';
export { IntegrationSignalStrategy } from './analysis/backtest/strategies/IntegrationSignalStrategy.js';
export { RangeBreakoutStrategy } from './analysis/backtest/strategies/RangeBreakoutStrategy.js';

export { DataProvider } from './data/DataProvider.js';
