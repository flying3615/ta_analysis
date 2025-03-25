import { Candle, VolatilityAnalysisResult } from '../../types.js';

import {
  calculateAccumulationDistribution,
  formatAccumulationDistributionAnalysis,
  AccumulationDistributionResult,
} from '../../util/accumulationDistribution.js';

export interface IntegratedVolumeAnalysisResult {
  volumeAnalysis: AccumulationDistributionResult;
  formattedVolumeAnalysis: string;
}

export interface IntegratedVolatilityAnalysisResult {
  volatilityAnalysis: VolatilityAnalysisResult;
  formattedVolatilityAnalysis: string;
}

export interface CombinedVVAnalysisResult {
  volumeAnalysis: IntegratedVolumeAnalysisResult;
  volumeAnalysisReason: string;
  volatilityAnalysis: IntegratedVolatilityAnalysisResult;
  volatilityAnalysisReason: string;
  combinedAnalysisSummary: string;
}

/**
 * 执行综合量价分析，包括积累分布线及相关指标
 * @param data 历史K线数据
 * @param lookbackPeriod 回溯期（默认为20个交易日）
 */
export function executeVolumeAnalysis(
  data: Candle[],
  lookbackPeriod: number = 20
): IntegratedVolumeAnalysisResult {
  try {
    const volumeAnalysis = calculateAccumulationDistribution(
      data,
      lookbackPeriod
    );
    const formattedVolumeAnalysis =
      formatAccumulationDistributionAnalysis(volumeAnalysis);

    return {
      volumeAnalysis,
      formattedVolumeAnalysis,
    };
  } catch (error) {
    console.error('执行量价分析时出错:', error);
    throw error;
  }
}
