import { Candle } from '../../types.js';
import {
  calculateATR,
  calculateATRSeries,
  calculateReturns,
  calculateSMA,
  calculateStandardDeviation,
} from '../../util/taUtil.js';

export interface VolatilityAnalysisResult {
  historicalVolatility: number;
  bollingerBandWidth: number;
  atr: number;
  atrPercent: number;
  volatilityRegime: 'low' | 'medium' | 'high' | 'extreme';
  isVolatilityIncreasing: boolean;
  impliedVolatility?: number; // 如果有期权数据
  volatilityPercentile: number; // 当前波动率在过去N天的百分位
  volatilityTrend: string;
  recentRanges: { daily: number; weekly: number; monthly: number }; // 各时间段的波动范围（%）
  riskMetrics: {
    sharpeRatio?: number; // 在有足够历史数据的情况下
    maxDrawdown: number;
    downsideDeviation: number;
  };
}

/**
 * 计算综合波动率分析，包括多项波动率指标
 * @param data 历史K线数据
 * @param lookbackPeriod 回溯期（默认为20个交易日）
 */
export function calculateVolatilityAnalysis(
  data: Candle[],
  lookbackPeriod: number = 15
): VolatilityAnalysisResult {
  if (data.length < Math.max(lookbackPeriod, 30)) {
    throw new Error('数据不足以进行有效的波动率分析');
  }

  // 提取价格数据
  const closes = data.map(d => d.close);
  const highs = data.map(d => d.high);
  const lows = data.map(d => d.low);
  const recentCloses = closes.slice(-lookbackPeriod);

  // 1. 计算历史波动率 (标准差法)
  const returns = calculateReturns(closes);
  const recentReturns = returns.slice(-lookbackPeriod);
  const historicalVolatility =
    calculateStandardDeviation(recentReturns) * Math.sqrt(252); // 年化

  // 2. 计算布林带宽度 (相对于价格的百分比)
  const sma20 = calculateSMA(closes, 20);
  const stdDev = calculateStandardDeviation(closes.slice(-20));
  const upperBand = sma20 + stdDev * 2;
  const lowerBand = sma20 - stdDev * 2;
  const bollingerBandWidth = ((upperBand - lowerBand) / sma20) * 100;

  // 3. 计算平均真实范围 (ATR)
  const atr = calculateATR(data, 14);
  const atrPercent = (atr / closes[closes.length - 1]) * 100;

  // 4. 判断波动率状态
  const volatilityRegime = determineVolatilityRegime(
    atrPercent,
    bollingerBandWidth
  );

  // 5. 波动率趋势判断
  const atrValues = calculateATRSeries(data, 14);
  const isVolatilityIncreasing =
    atrValues[atrValues.length - 1] > atrValues[atrValues.length - 5];

  // 6. 计算波动率百分位
  const longTermATRs = calculateATRSeries(data, 14);
  const volatilityPercentile = calculatePercentile(
    atrValues[atrValues.length - 1],
    longTermATRs
  );

  // 7. 确定波动率趋势描述
  const volatilityTrend = determineVolatilityTrend(
    atrValues,
    bollingerBandWidth
  );

  // 8. 计算各时间段的价格波动范围
  const recentRanges = {
    daily: calculateAverageRange(data.slice(-5), 1),
    weekly: calculateAverageRange(data.slice(-20), 5),
    monthly: calculateAverageRange(data, 20),
  };

  // 9. 计算风险度量
  const riskMetrics = {
    maxDrawdown: calculateMaxDrawdown(closes),
    downsideDeviation: calculateDownsideDeviation(returns),
    sharpeRatio:
      returns.length >= 60 ? calculateSharpeRatio(returns) : undefined,
  };

  return {
    historicalVolatility,
    bollingerBandWidth,
    atr,
    atrPercent,
    volatilityRegime,
    isVolatilityIncreasing,
    volatilityPercentile,
    volatilityTrend,
    recentRanges,
    riskMetrics,
  };
}

/**
 * 基于ATR百分比和布林带宽度判断波动率状态
 */
function determineVolatilityRegime(
  atrPercent: number,
  bbWidth: number
): 'low' | 'medium' | 'high' | 'extreme' {
  // 根据ATR百分比和布林带宽度综合判断
  if (atrPercent < 1.2 && bbWidth < 3.0) {
    return 'low';
  } else if (atrPercent < 2.5 && bbWidth < 6.0) {
    return 'medium';
  } else if (atrPercent < 4.0 || bbWidth < 10.0) {
    return 'high';
  } else {
    return 'extreme';
  }
}

/**
 * 计算值在数组中的百分位
 */
function calculatePercentile(value: number, array: number[]): number {
  const sorted = [...array].sort((a, b) => a - b);
  const position = sorted.findIndex(item => item >= value);

  if (position === -1) return 100;

  return (position / sorted.length) * 100;
}

/**
 * 确定波动率趋势描述
 */
function determineVolatilityTrend(
  atrValues: number[],
  bbWidth: number
): string {
  // 取最近的ATR值进行比较
  const recentATRs = atrValues.slice(-20);
  const currentATR = recentATRs[recentATRs.length - 1];
  const fiveDaysAgoATR = recentATRs[recentATRs.length - 5] || recentATRs[0];

  // 计算5天变化百分比
  const fiveDayChange = ((currentATR - fiveDaysAgoATR) / fiveDaysAgoATR) * 100;

  // 根据波动率变化和布林带宽度判断趋势
  if (fiveDayChange > 15) {
    return '波动率快速增加，可能预示着价格剧烈波动';
  } else if (fiveDayChange > 5) {
    return '波动率稳步增加，市场不确定性上升';
  } else if (fiveDayChange < -15) {
    return '波动率显著下降，价格可能进入盘整阶段';
  } else if (fiveDayChange < -5) {
    return '波动率逐渐下降，市场趋于稳定';
  } else if (bbWidth < 3) {
    return '波动率处于极低水平，可能即将爆发行情';
  } else {
    return '波动率保持相对稳定';
  }
}

/**
 * 计算平均价格范围
 */
function calculateAverageRange(data: Candle[], groupSize: number): number {
  if (data.length < groupSize) return 0;

  let totalRangePercent = 0;
  let groupCount = 0;

  for (let i = 0; i < data.length; i += groupSize) {
    if (i + groupSize <= data.length) {
      const group = data.slice(i, i + groupSize);
      const highInGroup = Math.max(...group.map(c => c.high));
      const lowInGroup = Math.min(...group.map(c => c.low));
      const rangePercent = ((highInGroup - lowInGroup) / lowInGroup) * 100;

      totalRangePercent += rangePercent;
      groupCount++;
    }
  }

  return groupCount > 0 ? totalRangePercent / groupCount : 0;
}

/**
 * 计算最大回撤
 */
function calculateMaxDrawdown(prices: number[]): number {
  let maxDrawdown = 0;
  let peak = prices[0];

  for (let i = 1; i < prices.length; i++) {
    if (prices[i] > peak) {
      peak = prices[i];
    } else {
      const drawdown = ((peak - prices[i]) / peak) * 100;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }
  }

  return maxDrawdown;
}

/**
 * 计算下行偏差（只考虑负收益）
 */
function calculateDownsideDeviation(returns: number[]): number {
  const negativeReturns = returns.filter(r => r < 0);
  if (negativeReturns.length === 0) return 0;

  const squaredNegativeReturns = negativeReturns.map(r => r * r);
  const avgSquaredNegativeReturn =
    squaredNegativeReturns.reduce((sum, r) => sum + r, 0) /
    negativeReturns.length;

  return Math.sqrt(avgSquaredNegativeReturn);
}

/**
 * 计算夏普比率
 */
function calculateSharpeRatio(returns: number[]): number {
  const annualFactor = 252; // 假设是日收益率，年化因子为252个交易日
  const riskFreeRate = 0.04 / annualFactor; // 假设无风险利率为4%

  // 计算超额收益
  const excessReturns = returns.map(r => r - riskFreeRate);

  // 计算超额收益的平均值
  const meanExcessReturn =
    excessReturns.reduce((sum, r) => sum + r, 0) / excessReturns.length;

  // 计算标准差
  const stdDev = calculateStandardDeviation(returns);

  if (stdDev === 0) return 0;

  // 年化超额收益和标准差
  const annualizedMeanExcessReturn = meanExcessReturn * annualFactor;
  const annualizedStdDev = stdDev * Math.sqrt(annualFactor);

  return annualizedMeanExcessReturn / annualizedStdDev;
}

/**
 * 格式化波动率分析结果为易读的字符串
 */
export function formatVolatilityAnalysis(
  analysis: VolatilityAnalysisResult
): string {
  let result = '=== 波动率分析 ===\n\n';

  result += `历史波动率: ${analysis.historicalVolatility.toFixed(2)}%（年化）\n`;
  result += `ATR: ${analysis.atr.toFixed(4)}（${analysis.atrPercent.toFixed(2)}%）\n`;
  result += `布林带宽度: ${analysis.bollingerBandWidth.toFixed(2)}%\n`;
  result += `波动率状态: ${translateVolatilityRegime(analysis.volatilityRegime)}\n`;
  result += `波动率趋势: ${analysis.volatilityTrend}\n`;
  result += `波动率百分位: ${analysis.volatilityPercentile.toFixed(2)}%\n\n`;

  result += '平均波动范围:\n';
  result += `  日: ${analysis.recentRanges.daily.toFixed(2)}%\n`;
  result += `  周: ${analysis.recentRanges.weekly.toFixed(2)}%\n`;
  result += `  月: ${analysis.recentRanges.monthly.toFixed(2)}%\n\n`;

  result += '风险指标:\n';
  result += `  最大回撤: ${analysis.riskMetrics.maxDrawdown.toFixed(2)}%\n`;
  result += `  下行偏差: ${analysis.riskMetrics.downsideDeviation.toFixed(4)}\n`;

  if (analysis.riskMetrics.sharpeRatio !== undefined) {
    result += `  夏普比率: ${analysis.riskMetrics.sharpeRatio.toFixed(2)}\n`;
  }

  return result;
}

/**
 * 翻译波动率状态为中文
 */
function translateVolatilityRegime(
  regime: 'low' | 'medium' | 'high' | 'extreme'
): string {
  switch (regime) {
    case 'low':
      return '低波动';
    case 'medium':
      return '中等波动';
    case 'high':
      return '高波动';
    case 'extreme':
      return '极端波动';
    default:
      return regime;
  }
}
