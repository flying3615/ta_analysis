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

export * from './types.js';

export { getStockDataForTimeframe } from './util/util.js';
