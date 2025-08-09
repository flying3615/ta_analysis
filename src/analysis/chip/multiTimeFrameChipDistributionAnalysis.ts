import { Candle } from '../../types.js';
import {
  analyzeChipDistribution,
  calculateChipDistribution,
} from './chipDistributionAnalysis.js';
import type { ChipAnalysisResult } from './chipTypes.js';
import type {
  MultiTimeframeAnalysisResult,
  TimeframeAnalysis,
} from './chipMultiTypes.js';
import { combineTimeframeAnalyses } from './combineTimeframes.js';
import { formatAndPrintChipAnalysis } from './formatChipAnalysis.js';
import { getStockDataForTimeframe } from '../../util/util.js';

/**
 * 获取不同时间周期的K线数据
 * @param symbol 股票代码
 * @param startDate 开始日期
 * @param endDate 结束日期
 * @param timeframe 时间周期
 */

/**
 * 分析多个时间周期并生成综合建议
 */
function multiTimeFrameChipDistAnalysis(
  symbol: string,
  primaryTimeframe: 'weekly' | 'daily' | '1hour' = 'daily',
  includeTimeframes: ('weekly' | 'daily' | '1hour')[] = [
    'weekly',
    'daily',
    '1hour',
  ],
  weights: { [key: string]: number } = {
    weekly: 0.3,
    daily: 0.5,
    '1hour': 0.2,
  },
  weeklyData: Candle[],
  dailyData: Candle[],
  hourlyData: Candle[]
): MultiTimeframeAnalysisResult {
  const timeframeAnalyses: TimeframeAnalysis[] = [];
  let candles = [];

  // 为每个时间周期获取数据并分析
  for (const timeframe of includeTimeframes) {
    if (timeframe === 'weekly') {
      candles = weeklyData;
    } else if (timeframe === '1hour') {
      candles = hourlyData;
    } else {
      candles = dailyData;
    }

    // 计算筹码分布
    const chipDistribution = calculateChipDistribution(candles);

    // 分析筹码分布
    const analysis = analyzeChipDistribution(
      symbol,
      chipDistribution,
      candles[candles.length - 1].close,
      candles
    );

    // 添加到时间周期分析结果中，带有权重
    timeframeAnalyses.push({
      timeframe,
      analysis,
      weight: weights[timeframe] || 0.33, // 如果未指定则使用平均权重
    });
  }

  // 组合各时间周期的分析结果，生成综合建议
  return combineTimeframeAnalyses(timeframeAnalyses, primaryTimeframe);
}

// 导出核心函数，使其可供其他模块使用
export {
  multiTimeFrameChipDistAnalysis,
};

export type { MultiTimeframeAnalysisResult, TimeframeAnalysis };
export { formatAndPrintChipAnalysis };
