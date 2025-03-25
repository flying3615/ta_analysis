import { Candle } from '../../types.js';
import {
  calculateVolatilityAnalysis,
  formatVolatilityAnalysis,
  VolatilityAnalysisResult,
} from './volatilityAnalysis.js';
import {
  calculateAccumulationDistribution,
  formatAccumulationDistributionAnalysis,
  AccumulationDistributionResult,
} from '../../util/accumulationDistribution.js';
import { getStockDataForTimeframe } from '../../util/util.js';

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
  volatilityAnalysis: IntegratedVolatilityAnalysisResult;
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

/**
 * 执行综合波动率分析
 * @param data 历史K线数据
 * @param lookbackPeriod 回溯期（默认为20个交易日）
 */
export function executeVolatilityAnalysis(
  data: Candle[],
  lookbackPeriod: number = 20
): IntegratedVolatilityAnalysisResult {
  try {
    const volatilityAnalysis = calculateVolatilityAnalysis(
      data,
      lookbackPeriod
    );
    const formattedVolatilityAnalysis =
      formatVolatilityAnalysis(volatilityAnalysis);

    return {
      volatilityAnalysis,
      formattedVolatilityAnalysis,
    };
  } catch (error) {
    console.error('执行波动率分析时出错:', error);
    throw error;
  }
}

/**
 * 执行综合技术分析，将波动率和量价分析结合
 * @param data 历史K线数据
 * @param lookbackPeriod 回溯期（默认为20个交易日）
 */
export function executeCombinedAnalysis(
  data: Candle[],
  lookbackPeriod: number = 20
): CombinedVVAnalysisResult {
  const volumeAnalysis = executeVolumeAnalysis(data, lookbackPeriod);
  const volatilityAnalysis = executeVolatilityAnalysis(data, lookbackPeriod);

  // 结合波动率和量价分析生成综合结论
  const combinedAnalysisSummary = generateCombinedAnalysisSummary(
    volumeAnalysis.volumeAnalysis,
    volatilityAnalysis.volatilityAnalysis
  );

  return {
    volumeAnalysis,
    volatilityAnalysis,
    combinedAnalysisSummary,
  };
}

/**
 * 生成波动率和量价分析的综合结论
 */
function generateCombinedAnalysisSummary(
  volumeAnalysis: AccumulationDistributionResult,
  volatilityAnalysis: VolatilityAnalysisResult
): string {
  let summary = '\n【波动率量能分析结论】\n';

  // 波动率状态评估
  summary += `波动率状态: ${translateVolatilityRegime(volatilityAnalysis.volatilityRegime)}`;
  summary += volatilityAnalysis.isVolatilityIncreasing
    ? '（波动率上升中）\n'
    : '（波动率下降中）\n';

  // 积累分布线趋势评估
  summary += `资金流向趋势: ${translateADTrend(volumeAnalysis.adTrend)}\n`;

  // 交易力量和风险评估
  const tradeForce = assessTradeForce(volumeAnalysis, volatilityAnalysis);
  summary += `交易力量: ${tradeForce.description}\n`;

  // 潜在信号
  summary += `潜在信号: ${identifySignals(volumeAnalysis, volatilityAnalysis)}\n\n`;

  // 综合建议
  summary += `交易建议: ${generateTradingRecommendation(volumeAnalysis, volatilityAnalysis)}\n`;

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
 * 评估交易力量
 */
function assessTradeForce(
  volumeAnalysis: AccumulationDistributionResult,
  volatilityAnalysis: VolatilityAnalysisResult
): { strength: number; description: string } {
  // 评估积累分布线的力量
  let adStrength = 0;
  if (volumeAnalysis.adTrend === 'bullish') adStrength = 1;
  else if (volumeAnalysis.adTrend === 'bearish') adStrength = -1;

  // 如果有背离，调整力量
  if (volumeAnalysis.divergence.type === 'bullish') adStrength += 0.5;
  else if (volumeAnalysis.divergence.type === 'bearish') adStrength -= 0.5;

  // 考虑资金流指标
  if (volumeAnalysis.moneyFlowIndex > 70) adStrength += 0.5;
  else if (volumeAnalysis.moneyFlowIndex < 30) adStrength -= 0.5;

  // 波动率影响
  let volatilityImpact = 0;
  if (
    volatilityAnalysis.volatilityRegime === 'high' ||
    volatilityAnalysis.volatilityRegime === 'extreme'
  ) {
    volatilityImpact = 1; // 高波动率增强信号
  }

  // 计算最终力量
  const strength = adStrength * (1 + volatilityImpact);

  // 生成描述
  let description = '';
  if (strength > 1.5) description = '强烈看涨力量，买盘明显占优';
  else if (strength > 0.5) description = '温和看涨力量，买盘略占优势';
  else if (strength > -0.5) description = '中性力量，买卖相对平衡';
  else if (strength > -1.5) description = '温和看跌力量，卖盘略占优势';
  else description = '强烈看跌力量，卖盘明显占优';

  return { strength, description };
}

/**
 * 识别潜在交易信号
 */
function identifySignals(
  volumeAnalysis: AccumulationDistributionResult,
  volatilityAnalysis: VolatilityAnalysisResult
): string {
  const signals: string[] = [];

  // 检查积累分布线背离
  if (volumeAnalysis.divergence.type === 'bullish') {
    signals.push('积累分布线显示看涨背离，可能是底部信号');
  } else if (volumeAnalysis.divergence.type === 'bearish') {
    signals.push('积累分布线显示看跌背离，可能是顶部信号');
  }

  // 检查波动率变化
  if (
    volatilityAnalysis.volatilityRegime === 'low' &&
    volatilityAnalysis.isVolatilityIncreasing
  ) {
    signals.push('波动率从低位开始上升，可能预示新趋势开始');
  } else if (
    volatilityAnalysis.volatilityRegime === 'extreme' &&
    !volatilityAnalysis.isVolatilityIncreasing
  ) {
    signals.push('极端波动率开始下降，可能预示趋势将转为震荡');
  }

  // 检查MFI超买超卖
  if (volumeAnalysis.moneyFlowIndex > 80) {
    signals.push('MFI处于超买区域，可能即将回调');
  } else if (volumeAnalysis.moneyFlowIndex < 20) {
    signals.push('MFI处于超卖区域，可能即将反弹');
  }

  // 检查布林带挤压
  if (volatilityAnalysis.bollingerBandWidth < 3.5) {
    signals.push('布林带挤压，波动率较低，可能即将爆发行情');
  }

  // 检查资金流与波动率组合
  if (
    volumeAnalysis.adTrend === 'bullish' &&
    volatilityAnalysis.isVolatilityIncreasing &&
    volumeAnalysis.volumePriceConfirmation
  ) {
    signals.push('资金流入伴随波动率上升和价格上涨，强烈看涨信号');
  } else if (
    volumeAnalysis.adTrend === 'bearish' &&
    volatilityAnalysis.isVolatilityIncreasing &&
    volumeAnalysis.volumePriceConfirmation
  ) {
    signals.push('资金流出伴随波动率上升和价格下跌，强烈看跌信号');
  }

  return signals.length > 0 ? signals.join('；') : '未检测到明显信号';
}

/**
 * 生成交易建议
 */
function generateTradingRecommendation(
  volumeAnalysis: AccumulationDistributionResult,
  volatilityAnalysis: VolatilityAnalysisResult
): string {
  // 评估积累分布线的看涨/看跌信号强度
  let bullishStrength = 0;
  let bearishStrength = 0;

  // 积累分布线趋势
  if (volumeAnalysis.adTrend === 'bullish') bullishStrength += 20;
  else if (volumeAnalysis.adTrend === 'bearish') bearishStrength += 20;

  // 背离
  if (volumeAnalysis.divergence.type === 'bullish') bullishStrength += 30;
  else if (volumeAnalysis.divergence.type === 'bearish') bearishStrength += 30;
  else if (volumeAnalysis.divergence.type === 'hidden_bullish')
    bullishStrength += 15;
  else if (volumeAnalysis.divergence.type === 'hidden_bearish')
    bearishStrength += 15;

  // 成交量力量
  if (volumeAnalysis.volumeForce > 30) bullishStrength += 15;
  else if (volumeAnalysis.volumeForce < -30) bearishStrength += 15;

  // MFI
  if (volumeAnalysis.moneyFlowIndex > 80) bearishStrength += 10;
  else if (volumeAnalysis.moneyFlowIndex < 20) bullishStrength += 10;

  // 波动率考虑
  if (volatilityAnalysis.volatilityRegime === 'low') {
    // 低波动率环境，信号可能不太可靠
    bullishStrength *= 0.8;
    bearishStrength *= 0.8;
  } else if (volatilityAnalysis.volatilityRegime === 'extreme') {
    // 极端波动率环境，信号可能被放大
    bullishStrength *= 1.2;
    bearishStrength *= 1.2;
  }

  // 确定最终建议
  if (bullishStrength > bearishStrength + 20 && bullishStrength > 40) {
    return (
      '考虑看涨策略，寻找有利的买入机会' +
      (volatilityAnalysis.volatilityRegime === 'high'
        ? '，但应注意控制头寸大小以应对高波动'
        : '')
    );
  } else if (bearishStrength > bullishStrength + 20 && bearishStrength > 40) {
    return (
      '考虑看跌策略，寻找有利的卖出机会' +
      (volatilityAnalysis.volatilityRegime === 'high'
        ? '，但应注意控制头寸大小以应对高波动'
        : '')
    );
  } else if (Math.abs(bullishStrength - bearishStrength) <= 20) {
    return '信号混杂，建议保持观望或考虑中性策略';
  } else if (bullishStrength > bearishStrength) {
    return '轻微看涨偏向，可小仓位试探性买入，设置止损';
  } else {
    return '轻微看跌偏向，可小仓位试探性卖出，设置止损';
  }
}

/**
 * 多时间周期分析示例
 */
async function exampleVVAnalysisUsage(symbol: string) {
  try {
    // 获取不同时间周期的数据
    const today = new Date();

    const startDateDaily = new Date();
    startDateDaily.setDate(today.getDate() - 90); // 获取一年的数据

    const startDateHourly = new Date();
    startDateHourly.setDate(today.getDate() - 30); // 获取一年的数据

    const dailyData = await getStockDataForTimeframe(
      symbol,
      startDateDaily,
      today,
      'daily'
    ); // 获取日线数据

    // 进行多时间周期分析
    const result = executeCombinedAnalysis(dailyData);

    console.log(result.combinedAnalysisSummary);
  } catch (error) {
    console.error('量能分析失败:', error);
  }
}

exampleVVAnalysisUsage('COIN');
