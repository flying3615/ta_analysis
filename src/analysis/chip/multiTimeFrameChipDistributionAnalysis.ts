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

/**
 * 多时间周期分析示例
 */
async function main(symbol: string) {
  try {
    console.log(`\n====== 多时间周期筹码分布分析: ${symbol} ======`);

    // 获取不同时间周期的数据
    const today = new Date();
    console.log('正在获取数据与分析筹码分布...');

    const startDateWeekly = new Date();
    startDateWeekly.setDate(today.getDate() - 365); // 获取一年的数据

    const startDateDaily = new Date();
    startDateDaily.setDate(today.getDate() - 90); // 获取三个月的数据

    const startDateHourly = new Date();
    startDateHourly.setDate(today.getDate() - 30); // 获取一个月的数据

    const weeklyData = await getStockDataForTimeframe(
      symbol,
      startDateWeekly,
      today,
      'weekly'
    ); // 获取周线数据

    const dailyData = await getStockDataForTimeframe(
      symbol,
      startDateDaily,
      today,
      'daily'
    ); // 获取日线数据

    const hourlyData = await getStockDataForTimeframe(
      symbol,
      startDateHourly,
      today,
      '1hour'
    ); // 获取小时线数据

    // 进行多时间周期分析
    const multiTimeframeResult = await multiTimeFrameChipDistAnalysis(
      symbol,
      'daily', // 主要时间周期
      ['weekly', 'daily', '1hour'], // 包含所有时间周期
      { weekly: 0.3, daily: 0.5, '1hour': 0.2 }, // 各时间周期权重
      weeklyData,
      dailyData,
      hourlyData
    );

    // 使用格式化函数打印结果
    formatAndPrintChipAnalysis(multiTimeframeResult, symbol);
  } catch (error) {
    console.error('多时间周期筹码分析失败:', error);
  }
}

// 使用示例
// main('COIN');
