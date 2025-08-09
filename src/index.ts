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
} from './analysis/patterns/analyzeMultiTimeframePatterns.js';
// 暴露形态分析配置，便于外部项目按需调整
export { patternConfig, updatePatternConfig } from './analysis/patterns/patternConfig.js';

export {
  determineTrendDirection,
  detectTrendReversal,
  TrendReversalSignal,
  EnhancedPatternAnalysis,
  multiTimeframePatternAnalysis,
  printoutMultiTimeFramePatternAnalysis,
} from './analysis/trendReversal/multiTimeFrameTrendReversal.js';

export {
  hasTrendReversalSignal,
  checkStockForReversalSignal,
  batchCheckForReversalSignals,
  generateReversalReport,
} from './analysis/trendReversal/trendReversalChecker.js';

export {
  MultiTimeframeAnalysisResult,
  TimeframeAnalysis,
  multiTimeFrameChipDistAnalysis,
  formatAndPrintChipAnalysis,
} from './analysis/chip/multiTimeFrameChipDistributionAnalysis.js';

// 暴露筹码配置，便于外部项目调整阈值与权重
export { chipConfig, updateChipConfig } from './analysis/chip/chipConfig.js';

export { executeIntegratedAnalysis } from './analysis/IntegratedAnalysis.js';

// 新增的波动率分析导出
export {
  calculateVolatilityAnalysis,
  formatVolatilityAnalysis,
  EnhancedVolatilityAnalysisResult,
  executeEnhancedCombinedAnalysis,
} from './analysis/volatility/volatilityAnalysis.js';

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
} from './analysis/volatility/volumeVolatilityAnalysis.js';

export { fetchChartData } from './image/chartImage.js';

export * from './types.js';

export {
  getStockDataForTimeframe,
  getFullExchangeNameBySymbol,
} from './util/util.js';

// 暴露蜡烛图配置，便于外部按需调整
export { candleConfig, updateCandleConfig } from './analysis/candle/candleConfig.js';
// 暴露蜡烛图多时间框架分析入口与格式化
export {
  multiTimeCandleAnalysis,
  main as runMultiTimeframeCandleAnalysis,
} from './analysis/candle/multiTImeFrameCandleAnalysis.js';
export { formatAndPrintCandleAnalysis } from './analysis/candle/formatCandleAnalysis.js';

// 暴露BBSR（支撑阻力 + 近期多空）分析能力与配置
export { multiTimeBBSRAnalysis, main as runBBSRAnalysis } from './analysis/sr/multiTimeFrameBBSRAnalysis.js';
export { formatAndPrintSrAnalysis } from './analysis/sr/formatSrAnalysis.js';
export { srConfig, updateSrConfig } from './analysis/sr/srConfig.js';
