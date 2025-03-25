import { Candle } from '../types.js';
import {
  calculateADLine,
  calculateChaikinOscillator,
  calculateMoneyFlowIndex,
  calculateOBV,
  calculateSlope,
  calculateVolumeForce,
} from './taUtil.js';

export interface AccumulationDistributionResult {
  adLine: number[]; // 积累分布线的值
  adSlope: number; // 积累分布线的斜率
  adTrend: 'bullish' | 'bearish' | 'neutral'; // 积累分布线的趋势
  divergence: {
    type: 'bullish' | 'bearish' | 'hidden_bullish' | 'hidden_bearish' | 'none';
    strength: number; // 0-100
    description: string;
  };
  volumeForce: number; // 成交量力量指标 (-100 到 100)
  moneyFlowIndex: number; // 资金流指标 (0-100)
  chaikinOscillator: number; // 蔡金摆动指标
  obv: number[]; // 能量潮指标
  obvSlope: number; // 能量潮斜率
  volumePriceConfirmation: boolean; // 价格与成交量是否协同确认趋势
  summary: string; // 总结分析
}

/**
 * 计算积累分布线及相关的量价指标
 * @param data K线数据
 * @param lookbackPeriod 回溯期（默认为20个交易日）
 */
export function calculateAccumulationDistribution(
  data: Candle[],
  lookbackPeriod: number = 20
): AccumulationDistributionResult {
  if (data.length < lookbackPeriod) {
    throw new Error('数据不足以进行积累分布线分析');
  }

  // 计算积累分布线 (A/D Line)
  const adLine = calculateADLine(data);

  // 计算积累分布线的近期斜率
  const recentAD = adLine.slice(-lookbackPeriod);
  const adSlope = calculateSlope(recentAD);

  // 确定积累分布线趋势
  const adTrend = determineADTrend(adLine, lookbackPeriod);

  // 检测背离
  const divergence = detectDivergence(data, adLine, lookbackPeriod);

  // 计算成交量力量指标
  const volumeForce = calculateVolumeForce(data, lookbackPeriod);

  // 计算资金流指标 (MFI)
  const mfi = calculateMoneyFlowIndex(data, 14);

  // 计算蔡金摆动指标
  const chaikinOsc = calculateChaikinOscillator(adLine);

  // 计算能量潮 (OBV)
  const obv = calculateOBV(data);
  const obvSlope = calculateSlope(obv.slice(-lookbackPeriod));

  // 判断价格与成交量是否确认趋势
  const volumePriceConfirmation = checkVolumePriceConfirmation(
    data,
    lookbackPeriod
  );

  // 生成综合分析摘要
  const summary = generateADSummary(
    adTrend,
    divergence,
    volumeForce,
    mfi,
    chaikinOsc,
    obvSlope,
    volumePriceConfirmation
  );

  return {
    adLine,
    adSlope,
    adTrend,
    divergence,
    volumeForce,
    moneyFlowIndex: mfi,
    chaikinOscillator: chaikinOsc,
    obv,
    obvSlope,
    volumePriceConfirmation,
    summary,
  };
}

/**
 * 确定积累分布线趋势
 */
function determineADTrend(
  adLine: number[],
  lookbackPeriod: number
): 'bullish' | 'bearish' | 'neutral' {
  if (adLine.length < lookbackPeriod) {
    return 'neutral';
  }

  const recentAD = adLine.slice(-lookbackPeriod);

  // 计算AD变化率
  const startAD = recentAD[0];
  const endAD = recentAD[recentAD.length - 1];

  // 防止除以零
  if (startAD === 0) return 'neutral';

  const changeRate = ((endAD - startAD) / Math.abs(startAD)) * 100;

  if (changeRate > 2) {
    return 'bullish';
  } else if (changeRate < -2) {
    return 'bearish';
  } else {
    return 'neutral';
  }
}

/**
 * 检测价格与积累分布线之间的背离
 */
function detectDivergence(
  data: Candle[],
  adLine: number[],
  lookbackPeriod: number
): {
  type: 'bullish' | 'bearish' | 'hidden_bullish' | 'hidden_bearish' | 'none';
  strength: number;
  description: string;
} {
  if (data.length < lookbackPeriod || adLine.length < lookbackPeriod) {
    return { type: 'none', strength: 0, description: '数据不足以检测背离' };
  }

  const prices = data.map(d => d.close);
  const recentPrices = prices.slice(-lookbackPeriod);
  const recentAD = adLine.slice(-lookbackPeriod);

  // 找出近期价格的高点和低点
  const priceHighs: number[] = [];
  const priceLows: number[] = [];

  for (let i = 1; i < recentPrices.length - 1; i++) {
    if (
      recentPrices[i] > recentPrices[i - 1] &&
      recentPrices[i] > recentPrices[i + 1]
    ) {
      priceHighs.push(i);
    }
    if (
      recentPrices[i] < recentPrices[i - 1] &&
      recentPrices[i] < recentPrices[i + 1]
    ) {
      priceLows.push(i);
    }
  }

  // 找出同期内AD线的高点和低点
  const adHighs: number[] = [];
  const adLows: number[] = [];

  for (let i = 1; i < recentAD.length - 1; i++) {
    if (recentAD[i] > recentAD[i - 1] && recentAD[i] > recentAD[i + 1]) {
      adHighs.push(i);
    }
    if (recentAD[i] < recentAD[i - 1] && recentAD[i] < recentAD[i + 1]) {
      adLows.push(i);
    }
  }

  // 检测常规看涨背离：价格创新低但AD线不创新低
  if (priceLows.length >= 2 && adLows.length >= 2) {
    const lastPriceLow = priceLows[priceLows.length - 1];
    const prevPriceLow = priceLows[priceLows.length - 2];
    const lastAdLow = adLows[adLows.length - 1];
    const prevAdLow = adLows[adLows.length - 2];

    if (
      recentPrices[lastPriceLow] < recentPrices[prevPriceLow] &&
      recentAD[lastAdLow] > recentAD[prevAdLow]
    ) {
      // 计算背离强度
      const priceChange =
        ((recentPrices[lastPriceLow] - recentPrices[prevPriceLow]) /
          recentPrices[prevPriceLow]) *
        100;
      const adChange =
        ((recentAD[lastAdLow] - recentAD[prevAdLow]) /
          Math.abs(recentAD[prevAdLow])) *
        100;
      const strength = Math.min(100, Math.abs(adChange - priceChange));

      return {
        type: 'bullish',
        strength,
        description:
          '检测到看涨背离：价格创新低但积累分布线未创新低，可能指示底部形成',
      };
    }
  }

  // 检测常规看跌背离：价格创新高但AD线不创新高
  if (priceHighs.length >= 2 && adHighs.length >= 2) {
    const lastPriceHigh = priceHighs[priceHighs.length - 1];
    const prevPriceHigh = priceHighs[priceHighs.length - 2];
    const lastAdHigh = adHighs[adHighs.length - 1];
    const prevAdHigh = adHighs[adHighs.length - 2];

    if (
      recentPrices[lastPriceHigh] > recentPrices[prevPriceHigh] &&
      recentAD[lastAdHigh] < recentAD[prevAdHigh]
    ) {
      // 计算背离强度
      const priceChange =
        ((recentPrices[lastPriceHigh] - recentPrices[prevPriceHigh]) /
          recentPrices[prevPriceHigh]) *
        100;
      const adChange =
        ((recentAD[lastAdHigh] - recentAD[prevAdHigh]) /
          Math.abs(recentAD[prevAdHigh])) *
        100;
      const strength = Math.min(100, Math.abs(adChange - priceChange));

      return {
        type: 'bearish',
        strength,
        description:
          '检测到看跌背离：价格创新高但积累分布线未创新高，可能指示顶部形成',
      };
    }
  }

  // 检测隐藏看涨背离：价格不创新低但AD线创新低
  if (priceLows.length >= 2 && adLows.length >= 2) {
    const lastPriceLow = priceLows[priceLows.length - 1];
    const prevPriceLow = priceLows[priceLows.length - 2];
    const lastAdLow = adLows[adLows.length - 1];
    const prevAdLow = adLows[adLows.length - 2];

    if (
      recentPrices[lastPriceLow] > recentPrices[prevPriceLow] &&
      recentAD[lastAdLow] < recentAD[prevAdLow]
    ) {
      const strength = 70; // 隐藏背离通常强度较低

      return {
        type: 'hidden_bullish',
        strength,
        description:
          '检测到隐藏看涨背离：价格未创新低但积累分布线创新低，可能指示上升趋势将继续',
      };
    }
  }

  // 检测隐藏看跌背离：价格不创新高但AD线创新高
  if (priceHighs.length >= 2 && adHighs.length >= 2) {
    const lastPriceHigh = priceHighs[priceHighs.length - 1];
    const prevPriceHigh = priceHighs[priceHighs.length - 2];
    const lastAdHigh = adHighs[adHighs.length - 1];
    const prevAdHigh = adHighs[adHighs.length - 2];

    if (
      recentPrices[lastPriceHigh] < recentPrices[prevPriceHigh] &&
      recentAD[lastAdHigh] > recentAD[prevAdHigh]
    ) {
      const strength = 70; // 隐藏背离通常强度较低

      return {
        type: 'hidden_bearish',
        strength,
        description:
          '检测到隐藏看跌背离：价格未创新高但积累分布线创新高，可能指示下降趋势将继续',
      };
    }
  }

  return {
    type: 'none',
    strength: 0,
    description: '未检测到明显背离',
  };
}

/**
 * 检查价格与成交量是否协同确认趋势
 */
function checkVolumePriceConfirmation(
  data: Candle[],
  lookbackPeriod: number
): boolean {
  if (data.length < lookbackPeriod) {
    return false;
  }

  const recentData = data.slice(-lookbackPeriod);

  // 计算价格趋势
  const startPrice = recentData[0].close;
  const endPrice = recentData[recentData.length - 1].close;
  const priceChange = ((endPrice - startPrice) / startPrice) * 100;

  // 计算成交量趋势
  const volumeData = recentData.map(d => d.volume);
  const volumeSlope = calculateSlope(volumeData);

  // 确定是否协同确认
  return (
    (priceChange > 1 && volumeSlope > 0) ||
    (priceChange < -1 && volumeSlope < 0)
  );
}

/**
 * 生成积累分布线分析摘要
 */
function generateADSummary(
  adTrend: 'bullish' | 'bearish' | 'neutral',
  divergence: {
    type: 'bullish' | 'bearish' | 'hidden_bullish' | 'hidden_bearish' | 'none';
    strength: number;
    description: string;
  },
  volumeForce: number,
  mfi: number,
  chaikinOsc: number,
  obvSlope: number,
  volumePriceConfirmation: boolean
): string {
  let summary = '';

  // 根据AD趋势添加评估
  if (adTrend === 'bullish') {
    summary += '积累分布线呈上升趋势，表明买方力量占优，支持价格上涨。';
  } else if (adTrend === 'bearish') {
    summary += '积累分布线呈下降趋势，表明卖方力量占优，支持价格下跌。';
  } else {
    summary += '积累分布线趋势中性，买卖力量相对平衡。';
  }

  // 添加背离信息
  if (divergence.type !== 'none') {
    summary += ` ${divergence.description} `;

    if (divergence.strength > 80) {
      summary += '背离强度很高，可能导致显著的价格反转。';
    } else if (divergence.strength > 50) {
      summary += '背离强度中等，需要注意潜在的价格转向。';
    } else {
      summary += '背离强度较弱，可能需要更多确认信号。';
    }
  }

  // 添加成交量力量评估
  if (volumeForce > 30) {
    summary += ' 成交量力量强劲偏向买方，支持价格上涨。';
  } else if (volumeForce < -30) {
    summary += ' 成交量力量强劲偏向卖方，支持价格下跌。';
  } else if (volumeForce > 10) {
    summary += ' 成交量力量小幅偏向买方。';
  } else if (volumeForce < -10) {
    summary += ' 成交量力量小幅偏向卖方。';
  } else {
    summary += ' 成交量力量基本平衡。';
  }

  // 添加资金流指标评估
  if (mfi > 80) {
    summary += ' MFI指标显示超买状态，可能即将回调。';
  } else if (mfi < 20) {
    summary += ' MFI指标显示超卖状态，可能即将反弹。';
  } else if (mfi > 60) {
    summary += ' MFI指标处于上方，资金流入占优。';
  } else if (mfi < 40) {
    summary += ' MFI指标处于下方，资金流出占优。';
  }

  // 添加蔡金摆动指标评估
  if (chaikinOsc > 0 && obvSlope > 0) {
    summary += ' 蔡金摆动指标和OBV斜率均为正，确认买盘力量。';
  } else if (chaikinOsc < 0 && obvSlope < 0) {
    summary += ' 蔡金摆动指标和OBV斜率均为负，确认卖盘力量。';
  } else if (chaikinOsc > 0) {
    summary += ' 蔡金摆动指标为正，但缺乏OBV确认。';
  } else if (obvSlope > 0) {
    summary += ' OBV斜率为正，但缺乏蔡金摆动确认。';
  }

  // 添加价格与成交量确认信息
  if (volumePriceConfirmation) {
    summary += ' 价格与成交量变化方向一致，确认当前趋势。';
  } else {
    summary += ' 价格与成交量变化方向不一致，可能预示趋势减弱。';
  }

  return summary;
}

/**
 * 格式化积累分布线分析结果为易读的字符串
 */
export function formatAccumulationDistributionAnalysis(
  analysis: AccumulationDistributionResult
): string {
  let result = '=== 积累分布线分析 ===\n\n';

  result += `积累分布线趋势: ${translateTrend(analysis.adTrend)}\n`;
  result += `积累分布线斜率: ${analysis.adSlope.toFixed(4)}\n`;

  // 添加背离信息
  result += `背离类型: ${translateDivergenceType(analysis.divergence.type)}\n`;
  result += `背离强度: ${analysis.divergence.strength.toFixed(2)}/100\n`;
  result += `背离描述: ${analysis.divergence.description}\n\n`;

  // 添加其他量价指标
  result += `成交量力量: ${analysis.volumeForce.toFixed(2)} (范围: -100 至 100)\n`;
  result += `资金流指标(MFI): ${analysis.moneyFlowIndex.toFixed(2)}\n`;
  result += `蔡金摆动指标: ${analysis.chaikinOscillator.toFixed(4)}\n`;
  result += `OBV斜率: ${analysis.obvSlope.toFixed(4)}\n`;
  result += `价格成交量确认: ${analysis.volumePriceConfirmation ? '是' : '否'}\n\n`;

  // 添加总结
  result += `分析摘要: ${analysis.summary}\n`;

  return result;
}

/**
 * 将趋势类型翻译为中文
 */
function translateTrend(trend: 'bullish' | 'bearish' | 'neutral'): string {
  switch (trend) {
    case 'bullish':
      return '看涨';
    case 'bearish':
      return '看跌';
    case 'neutral':
      return '中性';
    default:
      return trend;
  }
}

/**
 * 将背离类型翻译为中文
 */
function translateDivergenceType(
  type: 'bullish' | 'bearish' | 'hidden_bullish' | 'hidden_bearish' | 'none'
): string {
  switch (type) {
    case 'bullish':
      return '看涨背离';
    case 'bearish':
      return '看跌背离';
    case 'hidden_bullish':
      return '隐藏看涨背离';
    case 'hidden_bearish':
      return '隐藏看跌背离';
    case 'none':
      return '无背离';
    default:
      return type;
  }
}
