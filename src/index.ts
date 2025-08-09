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
