// 注意：只做类型定义聚合，避免运行时依赖
import type { Candle } from '../../types.js';

// 多时间周期分析相关接口
export interface TimeframeAnalysis {
  timeframe: 'weekly' | 'daily' | '1hour';
  analysis: ChipAnalysisResult;
  weight: number; // 该时间周期在综合分析中的权重
}

// 从同目录类型模块导入类型（仅类型导入避免运行时依赖）
import type { ChipAnalysisResult } from './chipTypes.js';

export interface MultiTimeframeAnalysisResult {
  symbol: string;
  currentPrice: number;
  timeframes: TimeframeAnalysis[];

  // 综合指标
  combinedBuySignalStrength: number;
  combinedShortSignalStrength: number;

  // 时间周期一致性指标
  timeframeAlignment: string; // '看多', '看空', '混合', '中性'
  alignmentStrength: number; // 0-100

  // 建议
  primaryTimeframeRecommendation: string;
  combinedRecommendation: string;
  recommendationComment: string;

  // 趋势分析
  trendConsistency: string; // '强', '中等', '弱'
  trendDirection: string; // '上升趋势', '下降趋势', '震荡整理'

  // 跨时间周期聚合的关键价格水平
  aggregatedSupportLevels: number[];
  aggregatedResistanceLevels: number[];

  // 策略建议
  entryStrategy: string;
  exitStrategy: string;
  stopLossLevels: number[];
  takeProfitLevels: number[];

  // 时间周期冲突分析
  timeframeConflicts: string[];

  // 短中长期展望
  shortTermOutlook: string;
  mediumTermOutlook: string;
  longTermOutlook: string;

  primaryTimeframe: 'weekly' | 'daily' | '1hour';
}
