export {
  // 类型和接口
  PatternType,
  PatternStatus,
  PatternDirection,
  PeakValley,
  PatternComponent,
  PatternAnalysisResult,
  MultiTimeframePatternAnalysis,
  ComprehensivePatternAnalysis,

  // 核心分析函数
  analyzeAllPatterns,
  combinePatternAnalyses,
  analyzeMultiTimeframePatterns,

  // 辅助和输出相关函数
  formatAndPrintPatternAnalysis,
} from './analysis/patterns/multiTimeFramePatternAnalysis.js';

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
  integrateAnalyses,
  determineEntryStrategy,
  determineExitStrategy,
  determineRiskManagement,
  generateWarnings,
  generateConfirmationSignals,
  generateInvalidationConditions,
  generateKeyObservations,
  generatePrimaryRationale,
  generateSecondaryRationale,
  generateSummary,
  executeIntegratedAnalysis,
  assignTimeframePriorities,
} from './analysis/IntegratedAnalysis.js';
