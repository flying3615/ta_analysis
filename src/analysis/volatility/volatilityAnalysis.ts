import { Candle, VolatilityAnalysisResult } from '../../types.js';
import {
  calculateATR,
  calculateATRSeries,
  calculateReturns,
  calculateSMA,
  calculateStandardDeviation,
} from '../../util/taUtil.js';
import { AccumulationDistributionResult } from '../../util/accumulationDistribution.js';
import {
  CombinedVVAnalysisResult,
  executeVolumeAnalysis,
} from './volumeVolatilityAnalysis.js';

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
 * 计算值在数组中的百分位
 */
function calculatePercentile(value: number, array: number[]): number {
  const sorted = [...array].sort((a, b) => a - b);
  const position = sorted.findIndex(item => item >= value);

  if (position === -1) return 100;

  return (position / sorted.length) * 100;
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
 * 增强版的波动率分析结果接口 - 扩展了VolatilityAnalysisResult
 */
export interface EnhancedVolatilityAnalysisResult
  extends VolatilityAnalysisResult {
  // 价格位置信息
  pricePosition: {
    relativeToYearHigh: number; // 0-100，当前价格相对于52周高点的百分比位置
    relativeToYearLow: number; // 0-100，当前价格相对于52周低点的百分比位置
    relativeTo200MA: number; // 相对于200日均线的百分比偏离
  };
  // 波动率渐变特征
  volatilityTransition: {
    isTransitioning: boolean;
    fromRegime: 'low' | 'medium' | 'high' | 'extreme';
    toRegime: 'low' | 'medium' | 'high' | 'extreme';
    transitionStrength: number; // 0-100
  };
  // 底部反转信号指标
  bottomSignals: {
    potentialBottomReversal: boolean;
    reversalStrength: number; // 0-100
  };
}

/**
 * 增强底部检测的波动率分析函数
 * @param data 历史K线数据
 * @param lookbackPeriod 回溯期
 */
export function calculateEnhancedVolatilityAnalysis(
  data: Candle[],
  lookbackPeriod: number = 20
): EnhancedVolatilityAnalysisResult {
  // 首先获取基础波动率分析结果
  const baseAnalysis = calculateVolatilityAnalysis(data, lookbackPeriod);

  // 计算价格位置信息
  const pricePosition = calculatePricePosition(data);

  // 分析波动率渐变特征
  const volatilityTransition = analyzeVolatilityTransition(data);

  // 检测底部反转信号
  const bottomSignals = detectBottomSignals(data, baseAnalysis);

  // 整合所有分析结果
  return {
    ...baseAnalysis,
    pricePosition,
    volatilityTransition,
    bottomSignals,
  };
}

/**
 * 计算价格相对于历史高低点和均线的位置
 *
 * 注意：
 * relativeToYearHigh - 表示价格在52周区间中的位置百分比（0=低点，100=高点）
 * relativeToYearLow - 表示价格距离52周低点的距离百分比（越小表示越接近低点）
 */
function calculatePricePosition(
  data: Candle[]
): EnhancedVolatilityAnalysisResult['pricePosition'] {
  const closes = data.map(d => d.close);
  const currentPrice = closes[closes.length - 1];

  // 计算52周（约250个交易日）高低点
  const yearData = data.slice(-Math.min(250, data.length));
  const yearHigh = Math.max(...yearData.map(d => d.high));
  const yearLow = Math.min(...yearData.map(d => d.low));

  // 计算区间中的相对位置百分比（0=低点，100=高点）
  const positionInRange =
    ((currentPrice - yearLow) / (yearHigh - yearLow)) * 100;

  // 为保持与现有代码兼容性，维持原变量名但更新计算逻辑
  // relativeToYearHigh实际表示在区间中的位置百分比
  const relativeToYearHigh = positionInRange;
  // relativeToYearLow实际表示距离低点的百分比距离，接近0表示接近低点
  const relativeToYearLow = 100 - positionInRange;

  // 计算200日均线（如果有足够数据）
  let relativeTo200MA = 0;
  if (data.length >= 200) {
    const ma200 = calculateSMA(closes, 200);
    relativeTo200MA = ((currentPrice - ma200) / ma200) * 100;
  }

  return {
    relativeToYearHigh,
    relativeToYearLow,
    relativeTo200MA,
  };
}

// TODO, 小时周期判定
/**
 * 分析波动率渐变特征
 */
function analyzeVolatilityTransition(
  data: Candle[]
): EnhancedVolatilityAnalysisResult['volatilityTransition'] {
  // 默认结果
  const defaultResult = {
    isTransitioning: false,
    fromRegime: 'medium' as const,
    toRegime: 'medium' as const,
    transitionStrength: 0,
  };

  if (data.length < 60) return defaultResult;

  // 分析两个不同时间窗口的波动率
  const previousPeriod = data.slice(-60, -30);
  const currentPeriod = data.slice(-30);

  const previousAnalysis = calculateVolatilityAnalysis(previousPeriod, 10);
  const currentAnalysis = calculateVolatilityAnalysis(currentPeriod, 10);

  // 如果波动率状态不同，则识别为过渡期
  if (previousAnalysis.volatilityRegime !== currentAnalysis.volatilityRegime) {
    // 计算过渡强度
    let transitionStrength = 0;

    // 通过ATR变化百分比来估计过渡强度
    const atrChange =
      (Math.abs(currentAnalysis.atrPercent - previousAnalysis.atrPercent) /
        previousAnalysis.atrPercent) *
      100;

    // 将变化映射到0-100的范围
    transitionStrength = Math.min(100, atrChange * 5);

    return {
      isTransitioning: true,
      fromRegime: previousAnalysis.volatilityRegime,
      toRegime: currentAnalysis.volatilityRegime,
      transitionStrength,
    };
  }

  return defaultResult;
}

/**
 * 检测底部反转信号
 */
function detectBottomSignals(
  data: Candle[],
  baseAnalysis: VolatilityAnalysisResult
): EnhancedVolatilityAnalysisResult['bottomSignals'] {
  // 初始化信号强度
  let signalStrength = 0;

  // 获取价格和成交量数据
  const closes = data.map(d => d.close);
  const volumes = data.map(d => d.volume);

  // 1. 检查价格是否处于历史低位
  const pricePosition = calculatePricePosition(data);
  if (pricePosition.relativeToYearLow > 80) {
    signalStrength += 20; // 价格接近年度低点
  }

  // 2. 检查波动率特征
  // 高波动率开始下降通常是底部特征之一
  if (
    baseAnalysis.volatilityRegime === 'high' ||
    baseAnalysis.volatilityRegime === 'extreme'
  ) {
    if (!baseAnalysis.isVolatilityIncreasing) {
      signalStrength += 15; // 高波动率开始下降
    }
  }

  // 3. 检查布林带宽度
  // 布林带收缩后开始扩张可能预示趋势反转
  if (baseAnalysis.bollingerBandWidth < 3.5) {
    signalStrength += 10; // 布林带收缩，可能即将爆发行情
  }

  // 4. 通过短期价格走势判断是否企稳
  const recentCloses = closes.slice(-10);
  const previousCloses = closes.slice(-20, -10);

  const previousTrend = calculateSimpleTrend(previousCloses);
  const recentTrend = calculateSimpleTrend(recentCloses);

  // 前期下跌，近期企稳或上涨
  if (previousTrend < -0.05 && recentTrend >= -0.01) {
    signalStrength += 20;
  }

  // 5. 检查成交量特征
  const recentVolumes = volumes.slice(-10);
  const previousVolumes = volumes.slice(-20, -10);

  const avgRecentVolume = calculateAverageVolume(recentVolumes);
  const avgPreviousVolume = calculateAverageVolume(previousVolumes);

  // 成交量放大通常是底部特征之一
  if (avgRecentVolume > avgPreviousVolume * 1.3) {
    signalStrength += 15; // 近期成交量放大
  }

  // 是否可能为底部反转
  const potentialBottomReversal = signalStrength > 50;

  return {
    potentialBottomReversal,
    reversalStrength: Math.min(100, signalStrength),
  };
}

/**
 * 计算简单趋势
 */
function calculateSimpleTrend(prices: number[]): number {
  if (prices.length < 2) return 0;
  return (prices[prices.length - 1] - prices[0]) / prices[0];
}

/**
 * 计算平均成交量
 */
function calculateAverageVolume(volumes: number[]): number {
  return volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;
}

/**
 * 格式化增强版波动率分析结果
 */
export function formatEnhancedVolatilityAnalysis(
  analysis: EnhancedVolatilityAnalysisResult
): string {
  // 先获取基本格式化结果
  let result = formatVolatilityAnalysis(analysis);

  // 添加价格位置分析
  result += '\n=== 价格位置分析 ===\n';
  result += `相对52周高点: ${analysis.pricePosition.relativeToYearHigh.toFixed(2)}%\n`;
  result += `相对52周低点: ${analysis.pricePosition.relativeToYearLow.toFixed(2)}%\n`;

  if (analysis.pricePosition.relativeTo200MA !== 0) {
    result += `相对200日均线: ${analysis.pricePosition.relativeTo200MA.toFixed(2)}%\n`;
  }

  // 添加波动率渐变分析
  if (analysis.volatilityTransition.isTransitioning) {
    result += '\n=== 波动率渐变分析 ===\n';
    result += `波动率状态: 从${translateVolatilityRegime(analysis.volatilityTransition.fromRegime)}向${translateVolatilityRegime(analysis.volatilityTransition.toRegime)}过渡\n`;
    result += `渐变强度: ${analysis.volatilityTransition.transitionStrength.toFixed(0)}%\n`;
  }

  // 添加底部反转信号分析
  if (analysis.bottomSignals.potentialBottomReversal) {
    result += '\n=== 底部反转信号分析 ===\n';
    result += `反转信号强度: ${analysis.bottomSignals.reversalStrength.toFixed(0)}/100\n`;

    if (analysis.bottomSignals.reversalStrength > 70) {
      result += '底部反转信号强烈\n';
    } else if (analysis.bottomSignals.reversalStrength > 50) {
      result += '存在明显的底部反转迹象\n';
    } else {
      result += '出现初步底部反转特征\n';
    }
  }

  return result;
}

/**
 * 增强版量能波动率综合分析
 */
export function generateEnhancedCombinedAnalysis(
  volumeAnalysis: AccumulationDistributionResult,
  volatilityAnalysis: EnhancedVolatilityAnalysisResult
): string {
  let summary = '\n【波动率量能分析结论】\n\n';

  // 1. 价格位置分析
  const pricePosition = volatilityAnalysis.pricePosition;
  if (pricePosition.relativeToYearLow > 80) {
    summary += `价格位置: 接近年度低点（位于年度区间底部${(100 - pricePosition.relativeToYearLow).toFixed(1)}%处）\n`;
  } else if (pricePosition.relativeToYearHigh > 80) {
    summary += `价格位置: 接近年度高点（位于年度区间顶部${pricePosition.relativeToYearHigh.toFixed(1)}%处）\n`;
  } else {
    summary += `价格位置: 位于年度价格区间中段（距底部${(100 - pricePosition.relativeToYearLow).toFixed(1)}%，距顶部${(100 - pricePosition.relativeToYearHigh).toFixed(1)}%）\n`;
  }

  // 2. 波动率状态
  summary += `波动率状态: ${translateVolatilityRegime(volatilityAnalysis.volatilityRegime)}`;
  summary += volatilityAnalysis.isVolatilityIncreasing
    ? '（波动率上升中）\n'
    : '（波动率下降中）\n';

  // 3. 波动率渐变特征
  if (volatilityAnalysis.volatilityTransition.isTransitioning) {
    summary += `波动率渐变: 从${translateVolatilityRegime(volatilityAnalysis.volatilityTransition.fromRegime)}向${translateVolatilityRegime(volatilityAnalysis.volatilityTransition.toRegime)}过渡中\n`;
  }

  // 4. 资金流向
  summary += `资金流向趋势: ${translateADTrend(volumeAnalysis.adTrend)}\n`;

  // 5. 底部反转信号
  if (volatilityAnalysis.bottomSignals.potentialBottomReversal) {
    summary += `\n检测到潜在底部反转信号（强度: ${volatilityAnalysis.bottomSignals.reversalStrength.toFixed(0)}/100）\n`;
  }

  // 6. 潜在信号
  summary += '\n';

  // 检测常见底部形态信号
  if (
    pricePosition.relativeToYearLow > 80 &&
    !volatilityAnalysis.isVolatilityIncreasing
  ) {
    summary += '- 价格处于低位且波动率开始下降，可能是恐慌情绪逐渐释放\n';
  }

  if (
    volatilityAnalysis.bottomSignals.potentialBottomReversal &&
    volumeAnalysis.adTrend !== 'bearish'
  ) {
    summary += '- 底部形态特征明显，同时资金流向未呈现明显流出，支持反转观点\n';
  }

  if (
    volatilityAnalysis.volatilityRegime === 'extreme' &&
    !volatilityAnalysis.isVolatilityIncreasing
  ) {
    summary += '- 极端波动率开始下降，可能预示趋势将转为震荡或反转\n';
  }

  if (
    volumeAnalysis.moneyFlowIndex < 30 &&
    pricePosition.relativeToYearLow > 70
  ) {
    summary += '- MFI处于超卖区域，且价格位于低位，具备反弹条件\n';
  }

  if (volatilityAnalysis.bollingerBandWidth < 3.5) {
    summary += '- 布林带挤压，波动率较低，可能即将爆发行情\n';
  }

  // 7. 交易建议
  summary += '\n';

  // 针对底部反转情况给出更具体的建议
  if (
    volatilityAnalysis.bottomSignals.potentialBottomReversal &&
    pricePosition.relativeToYearLow > 70
  ) {
    // 底部区域
    summary += '价格处于低位且展现底部特征，可考虑分批建仓，设置合理止损。';

    // 根据波动率给出更具体的策略
    if (
      volatilityAnalysis.volatilityRegime === 'high' ||
      volatilityAnalysis.volatilityRegime === 'extreme'
    ) {
      summary +=
        '由于波动率较高，建议采用小仓位、多批次方式逐步介入，避免一次性建仓。';
    } else {
      summary += '波动率相对可控，可采用较为常规的建仓策略。';
    }
  }
  // 其他情况保留原有判断逻辑
  else if (
    volumeAnalysis.adTrend === 'bullish' &&
    volatilityAnalysis.isVolatilityIncreasing
  ) {
    summary +=
      '资金流入且波动率上升，市场可能处于上升趋势初期，可考虑逐步建仓。';
  } else if (
    volumeAnalysis.adTrend === 'bearish' &&
    volatilityAnalysis.isVolatilityIncreasing
  ) {
    summary += '资金流出且波动率上升，下跌趋势增强，建议保持观望或考虑做空。';
  } else if (volumeAnalysis.adTrend === 'neutral') {
    summary += '资金流向中性，建议等待更明确的信号。';
  }

  return summary;
}

/**
 * 波动率状态翻译
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

/**
 * 积累分布线趋势翻译
 */
function translateADTrend(trend: 'bullish' | 'bearish' | 'neutral'): string {
  switch (trend) {
    case 'bullish':
      return '资金流入占优（看涨）';
    case 'bearish':
      return '资金流出占优（看跌）';
    case 'neutral':
      return '资金流向中性';
    default:
      return trend;
  }
}

/**
 * 执行增强版波动率分析
 */
export function executeEnhancedVolatilityAnalysis(
  data: Candle[],
  lookbackPeriod: number = 20
): {
  volatilityAnalysis: EnhancedVolatilityAnalysisResult;
  formattedVolatilityAnalysis: string;
} {
  try {
    // 获取增强版波动率分析结果
    const enhancedVolatilityAnalysis = calculateEnhancedVolatilityAnalysis(
      data,
      lookbackPeriod
    );

    // 格式化输出
    const formattedVolatilityAnalysis = formatEnhancedVolatilityAnalysis(
      enhancedVolatilityAnalysis
    );

    return {
      volatilityAnalysis: enhancedVolatilityAnalysis,
      formattedVolatilityAnalysis,
    };
  } catch (error) {
    console.error('执行增强版波动率分析时出错:', error);
    throw error;
  }
}

/**
 * 执行增强版综合分析
 */
export function executeEnhancedCombinedAnalysis(
  data: Candle[],
  lookbackPeriod: number = 20
): CombinedVVAnalysisResult {
  try {
    // 执行量价分析
    const volumeAnalysisResult = executeVolumeAnalysis(data, lookbackPeriod);

    // 执行增强版波动率分析
    const volatilityAnalysisResult = executeEnhancedVolatilityAnalysis(
      data,
      lookbackPeriod
    );

    // 生成增强版综合分析结论
    const enhancedSummary = generateEnhancedCombinedAnalysis(
      volumeAnalysisResult.volumeAnalysis,
      volatilityAnalysisResult.volatilityAnalysis
    );

    return {
      volumeAnalysis: volumeAnalysisResult,
      volatilityAnalysis: volatilityAnalysisResult,
      combinedAnalysisSummary: enhancedSummary,
    };
  } catch (error) {
    console.error('执行增强版综合分析时出错:', error);
    throw error;
  }
}
