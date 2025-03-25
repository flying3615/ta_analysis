import { Candle } from '../types.js';

/**
 * 计算简化版技术指标 - 新增
 */
export function calculateTechnicalIndicators(data: Candle[]): {
  macdSignal: string;
  rsiLevel: number;
  bollingerStatus: string;
  technicalSignal: string;
  trendStatus?: string; // 新增趋势状态
} {
  // 确保有足够的数据
  if (data.length < 30) {
    return {
      macdSignal: '数据不足',
      rsiLevel: 50,
      bollingerStatus: '数据不足',
      technicalSignal: '中性',
      trendStatus: '数据不足',
    };
  }

  const closes = data.map(d => d.close);
  const highs = data.map(d => d.high);
  const lows = data.map(d => d.low);
  const currentPrice = closes[closes.length - 1];

  // 计算完整的MACD序列
  const macdData = calculateFullMACD(closes);
  const macdLine = macdData.macdLine[macdData.macdLine.length - 1];
  const signalLine = macdData.signalLine[macdData.signalLine.length - 1];
  const previousMacdLine = macdData.macdLine[macdData.macdLine.length - 2];
  const previousSignalLine =
    macdData.signalLine[macdData.signalLine.length - 2];

  // 计算RSI
  const rsi = calculateStandardRSI(closes, 14);

  // 计算布林带
  const sma20 = calculateSMA(closes, 20);
  const stdDev = calculateStdDev(closes, 20);
  const upperBand = sma20 + stdDev * 2;
  const lowerBand = sma20 - stdDev * 2;

  // 趋势识别
  const trendStatus = identifyTrend(closes);

  // 确定MACD信号
  let macdSignal = '';
  const isMacdCrossOver =
    macdLine > signalLine && previousMacdLine <= previousSignalLine;
  const isMacdCrossUnder =
    macdLine < signalLine && previousMacdLine >= previousSignalLine;

  if (isMacdCrossOver && macdLine > 0) {
    macdSignal = '新金叉向上';
  } else if (isMacdCrossOver && macdLine <= 0) {
    macdSignal = '新金叉但在0轴下';
  } else if (isMacdCrossUnder && macdLine > 0) {
    macdSignal = '新死叉但在0轴上';
  } else if (isMacdCrossUnder && macdLine <= 0) {
    macdSignal = '新死叉向下';
  } else if (macdLine > signalLine && macdLine > previousMacdLine) {
    macdSignal = '金叉并继续向上';
  } else if (macdLine > signalLine && macdLine <= previousMacdLine) {
    macdSignal = '金叉但有回落迹象';
  } else if (macdLine < signalLine && macdLine > previousMacdLine) {
    macdSignal = '死叉但有反弹迹象';
  } else {
    macdSignal = '死叉并继续向下';
  }

  // 确定布林带状态
  let bollingerStatus = '';
  if (currentPrice > upperBand) {
    bollingerStatus = '突破上轨';
  } else if (currentPrice < lowerBand) {
    bollingerStatus = '突破下轨';
  } else if (currentPrice > sma20) {
    bollingerStatus = '运行于上轨道';
  } else {
    bollingerStatus = '运行于下轨道';
  }

  // 计算布林带宽度 - 可用于判断波动性
  const bandWidth = ((upperBand - lowerBand) / sma20) * 100;
  const isBandSqueeze = bandWidth < 3.5; // 带宽较窄，可能即将爆发

  // 综合技术信号
  let buySignals = 0;
  let sellSignals = 0;

  // MACD信号计分
  if (macdSignal.includes('新金叉向上')) buySignals += 3;
  else if (macdSignal.includes('新金叉但在0轴下')) buySignals += 2;
  else if (macdSignal.includes('金叉并继续向上')) buySignals += 2;
  else if (macdSignal.includes('金叉但有回落迹象')) buySignals += 1;
  else if (macdSignal.includes('新死叉向下')) sellSignals += 3;
  else if (macdSignal.includes('新死叉但在0轴上')) sellSignals += 2;
  else if (macdSignal.includes('死叉并继续向下')) sellSignals += 2;
  else if (macdSignal.includes('死叉但有反弹迹象')) sellSignals += 1;

  // RSI信号计分
  if (rsi < 30) buySignals += 2;
  else if (rsi < 40) buySignals += 1;
  else if (rsi > 70) sellSignals += 2;
  else if (rsi > 60) sellSignals += 1;

  // 布林带信号计分
  if (bollingerStatus === '突破下轨') buySignals += 2;
  else if (bollingerStatus === '运行于下轨道') buySignals += 1;
  else if (bollingerStatus === '突破上轨') sellSignals += 2;
  else if (bollingerStatus === '运行于上轨道') sellSignals += 1;

  // 趋势因素计分
  if (trendStatus === '强势上涨趋势') buySignals += 2;
  else if (trendStatus === '中期反弹') buySignals += 1;
  else if (trendStatus === '强势下跌趋势') sellSignals += 2;
  else if (trendStatus === '中期回调') sellSignals += 1;

  // 布林带挤压可能代表即将爆发的行情
  if (isBandSqueeze && macdLine > signalLine) buySignals += 1;
  else if (isBandSqueeze && macdLine < signalLine) sellSignals += 1;

  // 确定综合信号
  let technicalSignal = '';
  if (buySignals >= 6) technicalSignal = '强买入';
  else if (buySignals > sellSignals + 2) technicalSignal = '买入';
  else if (sellSignals >= 6) technicalSignal = '强卖出';
  else if (sellSignals > buySignals + 2) technicalSignal = '卖出';
  else technicalSignal = '中性';

  return {
    macdSignal,
    rsiLevel: parseFloat(rsi.toFixed(2)),
    bollingerStatus,
    technicalSignal,
    trendStatus,
  };
}

// 辅助函数: 计算完整的MACD序列
export function calculateFullMACD(prices: number[]): {
  macdLine: number[];
  signalLine: number[];
} {
  const ema12Values = [];
  const ema26Values = [];
  const macdValues = [];

  // 计算所有EMA12和EMA26值
  let ema12 = prices[0];
  let ema26 = prices[0];

  for (let i = 0; i < prices.length; i++) {
    ema12 = prices[i] * (2 / 13) + ema12 * (1 - 2 / 13);
    ema26 = prices[i] * (2 / 27) + ema26 * (1 - 2 / 27);

    ema12Values.push(ema12);
    ema26Values.push(ema26);
    macdValues.push(ema12 - ema26);
  }

  // 计算信号线（MACD的9周期EMA）
  const signalValues = [];

  // 初始化信号线
  if (macdValues.length >= 9) {
    let signal = macdValues.slice(0, 9).reduce((sum, val) => sum + val, 0) / 9;

    for (let i = 0; i < 9; i++) {
      signalValues.push(signal); // 前9个值使用相同的初始值
    }

    // 计算剩余的信号线值
    for (let i = 9; i < macdValues.length; i++) {
      signal = macdValues[i] * (2 / 10) + signal * (1 - 2 / 10);
      signalValues.push(signal);
    }
  } else {
    // 数据不足时填充
    for (let i = 0; i < macdValues.length; i++) {
      signalValues.push(macdValues[i]);
    }
  }

  return {
    macdLine: macdValues,
    signalLine: signalValues,
  };
}

// 辅助函数: 计算标准的RSI
export function calculateStandardRSI(prices: number[], period: number): number {
  if (prices.length <= period) return 50;

  let avgGain = 0;
  let avgLoss = 0;

  // 计算首个RSI的平均涨跌幅
  for (let i = 1; i <= period; i++) {
    const change = prices[i] - prices[i - 1];
    if (change >= 0) {
      avgGain += change;
    } else {
      avgLoss -= change;
    }
  }

  avgGain /= period;
  avgLoss /= period;

  // 使用Wilder平滑技术计算后续RSI
  for (let i = period + 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    if (change >= 0) {
      avgGain = (avgGain * (period - 1) + change) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) - change) / period;
    }
  }

  if (avgLoss === 0) return 100;

  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

// 辅助函数: 趋势识别
export function identifyTrend(prices: number[]): string {
  if (prices.length < 60) return '数据不足';

  const sma5 = calculateSMA(prices, 5);
  const sma10 = calculateSMA(prices, 10);
  const sma20 = calculateSMA(prices, 20);
  const sma60 = calculateSMA(prices, 60);

  // 计算价格与各均线的关系
  const priceVsSma5 = prices[prices.length - 1] > sma5;
  const priceVsSma10 = prices[prices.length - 1] > sma10;
  const priceVsSma20 = prices[prices.length - 1] > sma20;
  const priceVsSma60 = prices[prices.length - 1] > sma60;

  // 计算均线间的关系
  const sma5VsSma10 = sma5 > sma10;
  const sma10VsSma20 = sma10 > sma20;
  const sma20VsSma60 = sma20 > sma60;

  // 判断多周期趋势
  if (
    priceVsSma5 &&
    priceVsSma10 &&
    priceVsSma20 &&
    priceVsSma60 &&
    sma5VsSma10 &&
    sma10VsSma20 &&
    sma20VsSma60
  ) {
    return '强势上涨趋势';
  } else if (
    !priceVsSma5 &&
    !priceVsSma10 &&
    !priceVsSma20 &&
    !priceVsSma60 &&
    !sma5VsSma10 &&
    !sma10VsSma20 &&
    !sma20VsSma60
  ) {
    return '强势下跌趋势';
  } else if (priceVsSma5 && priceVsSma10 && priceVsSma20 && !priceVsSma60) {
    return '中期反弹';
  } else if (!priceVsSma5 && !priceVsSma10 && !priceVsSma20 && priceVsSma60) {
    return '中期回调';
  } else if (priceVsSma5 && priceVsSma10 && !priceVsSma20 && !priceVsSma60) {
    return '短期反弹';
  } else if (!priceVsSma5 && !priceVsSma10 && priceVsSma20 && priceVsSma60) {
    return '短期回调';
  } else {
    return '震荡整理';
  }
}

// 辅助函数 - 计算SMA
export function calculateSMA(data: number[], period: number): number {
  const slice = data.slice(-period);
  return slice.reduce((sum, price) => sum + price, 0) / slice.length;
}

// 辅助函数 - 计算标准差
export function calculateStdDev(data: number[], period: number): number {
  const slice = data.slice(-period);
  const mean = slice.reduce((sum, val) => sum + val, 0) / slice.length;
  const squaredDiffs = slice.map(val => Math.pow(val - mean, 2));
  const variance =
    squaredDiffs.reduce((sum, val) => sum + val, 0) / slice.length;
  return Math.sqrt(variance);
}

/**
 * 计算成交量力量指标
 */
export function calculateVolumeForce(
  data: Candle[],
  lookbackPeriod: number
): number {
  if (data.length < lookbackPeriod) {
    return 0;
  }

  const recentData = data.slice(-lookbackPeriod);

  // 计算上涨日的平均成交量和下跌日的平均成交量
  let upVolume = 0;
  let upDays = 0;
  let downVolume = 0;
  let downDays = 0;

  for (let i = 1; i < recentData.length; i++) {
    const priceChange = recentData[i].close - recentData[i - 1].close;
    const volume = recentData[i].volume;

    if (priceChange > 0) {
      upVolume += volume;
      upDays++;
    } else if (priceChange < 0) {
      downVolume += volume;
      downDays++;
    }
  }

  const avgUpVolume = upDays > 0 ? upVolume / upDays : 0;
  const avgDownVolume = downDays > 0 ? downVolume / downDays : 0;

  // 防止除以零
  if (avgUpVolume + avgDownVolume === 0) return 0;

  // 计算成交量力量 (-100 到 100)
  const volumeForce =
    (100 * (avgUpVolume - avgDownVolume)) / (avgUpVolume + avgDownVolume);

  return volumeForce;
}

/**
 * 计算资金流指标 (Money Flow Index, MFI)
 */
export function calculateMoneyFlowIndex(
  data: Candle[],
  period: number
): number {
  if (data.length <= period) {
    return 50; // 默认返回中性值
  }

  const typicalPrices: number[] = [];
  const moneyFlow: number[] = [];

  // 计算典型价格和资金流
  for (let i = 0; i < data.length; i++) {
    const { high, low, close, volume } = data[i];
    const typicalPrice = (high + low + close) / 3;

    typicalPrices.push(typicalPrice);
    moneyFlow.push(typicalPrice * volume);
  }

  // 计算资金流比率
  let positiveFlow = 0;
  let negativeFlow = 0;

  for (let i = data.length - period; i < data.length; i++) {
    if (i > 0) {
      if (typicalPrices[i] > typicalPrices[i - 1]) {
        positiveFlow += moneyFlow[i];
      } else if (typicalPrices[i] < typicalPrices[i - 1]) {
        negativeFlow += moneyFlow[i];
      }
    }
  }

  // 防止除以零
  if (negativeFlow === 0) return 100;
  if (positiveFlow === 0) return 0;

  const moneyFlowRatio = positiveFlow / negativeFlow;
  const mfi = 100 - 100 / (1 + moneyFlowRatio);

  return mfi;
}

/**
 * 计算蔡金摆动指标 (Chaikin Oscillator)
 */
export function calculateChaikinOscillator(adLine: number[]): number {
  if (adLine.length < 10) {
    return 0;
  }

  // 计算3日和10日EMA
  const ema3 = calculateEMA(adLine, 3);
  const ema10 = calculateEMA(adLine, 10);

  // 蔡金摆动指标是两个EMA的差值
  return ema3 - ema10;
}

/**
 * 计算指数移动平均线 (EMA)
 */
function calculateEMA(data: number[], period: number): number {
  if (data.length < period) {
    return data[data.length - 1];
  }

  const alpha = 2 / (period + 1);
  const recentData = data.slice(-period * 2);

  // 初始EMA为第一个值
  let ema = recentData[0];

  // 计算EMA
  for (let i = 1; i < recentData.length; i++) {
    ema = alpha * recentData[i] + (1 - alpha) * ema;
  }

  return ema;
}

/**
 * 计算积累分布线 (A/D Line)
 */
export function calculateADLine(data: Candle[]): number[] {
  const adLine: number[] = [];
  let ad = 0;

  for (let i = 0; i < data.length; i++) {
    const { high, low, close, volume } = data[i];

    // 防止除以零
    if (high === low) {
      adLine.push(ad);
      continue;
    }

    // 计算货币流量乘数 (Money Flow Multiplier)
    const mfm = (close - low - (high - close)) / (high - low);

    // 计算货币流量量 (Money Flow Volume)
    const mfv = mfm * volume;

    // 更新积累分布线
    ad += mfv;
    adLine.push(ad);
  }

  return adLine;
}

/**
 * 计算能量潮指标 (OBV)
 */
export function calculateOBV(data: Candle[]): number[] {
  const obv: number[] = [0]; // 初始OBV值设为0

  for (let i = 1; i < data.length; i++) {
    const currentClose = data[i].close;
    const previousClose = data[i - 1].close;
    const currentVolume = data[i].volume;

    if (currentClose > previousClose) {
      // 收盘价上涨，加上当日成交量
      obv.push(obv[i - 1] + currentVolume);
    } else if (currentClose < previousClose) {
      // 收盘价下跌，减去当日成交量
      obv.push(obv[i - 1] - currentVolume);
    } else {
      // 收盘价不变，OBV保持不变
      obv.push(obv[i - 1]);
    }
  }

  return obv;
}

/**
 * 计算返回率序列
 */
export function calculateReturns(prices: number[]): number[] {
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push(prices[i] / prices[i - 1] - 1);
  }
  return returns;
}

/**
 * 计算标准差
 */
export function calculateStandardDeviation(data: number[]): number {
  const mean = data.reduce((sum, value) => sum + value, 0) / data.length;
  const squaredDiffs = data.map(value => Math.pow(value - mean, 2));
  const variance =
    squaredDiffs.reduce((sum, value) => sum + value, 0) / data.length;
  return Math.sqrt(variance);
}

/**
 * 计算最近的ATR值
 */
export function calculateATR(data: Candle[], period: number): number {
  const trValues: number[] = [];

  // 计算真实范围值
  for (let i = 1; i < data.length; i++) {
    const high = data[i].high;
    const low = data[i].low;
    const prevClose = data[i - 1].close;

    const tr1 = high - low;
    const tr2 = Math.abs(high - prevClose);
    const tr3 = Math.abs(low - prevClose);

    const tr = Math.max(tr1, tr2, tr3);
    trValues.push(tr);
  }

  // 计算ATR
  if (trValues.length < period) {
    return trValues.reduce((sum, tr) => sum + tr, 0) / trValues.length;
  }

  const recentTRs = trValues.slice(-period);
  return recentTRs.reduce((sum, tr) => sum + tr, 0) / period;
}

/**
 * 计算完整的ATR序列
 */
export function calculateATRSeries(data: Candle[], period: number): number[] {
  const trValues: number[] = [];
  const atrValues: number[] = [];

  // 计算真实范围值
  for (let i = 1; i < data.length; i++) {
    const high = data[i].high;
    const low = data[i].low;
    const prevClose = data[i - 1].close;

    const tr1 = high - low;
    const tr2 = Math.abs(high - prevClose);
    const tr3 = Math.abs(low - prevClose);

    const tr = Math.max(tr1, tr2, tr3);
    trValues.push(tr);
  }

  // 计算初始ATR
  if (trValues.length < period) {
    const initialATR =
      trValues.reduce((sum, tr) => sum + tr, 0) / trValues.length;
    atrValues.push(initialATR);
    return atrValues;
  }

  // 计算第一个ATR
  let atr = trValues.slice(0, period).reduce((sum, tr) => sum + tr, 0) / period;
  atrValues.push(atr);

  // 计算其余ATR (Wilder's smoothing)
  for (let i = period; i < trValues.length; i++) {
    atr = (atr * (period - 1) + trValues[i]) / period;
    atrValues.push(atr);
  }

  return atrValues;
}

export function rollingMin(prices: number[], window: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < prices.length; i++) {
    const start = Math.max(0, i - window + 1);
    const end = i + 1;
    const windowSlice = prices.slice(start, end);
    result.push(Math.min(...windowSlice));
  }
  return result;
}

export function rollingMax(prices: number[], window: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < prices.length; i++) {
    const start = Math.max(0, i - window + 1);
    const end = i + 1;
    const windowSlice = prices.slice(start, end);
    result.push(Math.max(...windowSlice));
  }
  return result;
}

export function percentChange(prices: number[]): number[] {
  const changes: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    const change = ((prices[i] - prices[i - 1]) / prices[i - 1]) * 100;
    changes.push(change);
  }
  return changes;
}

export function calculateSlope(prices: number[]): number {
  const n = prices.length;
  const x = Array.from({ length: n }, (_, i) => i + 1);
  const y = prices;

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

  return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
}

// 辅助函数 - 根据累积百分比找到对应价格
export function findPriceAtCumulativePercentage(
  cumulativeDistribution: { price: number; cumulativePercentage: number }[],
  targetPercentage: number
): number {
  // 查找最接近目标累积百分比的项
  for (let i = 0; i < cumulativeDistribution.length; i++) {
    if (cumulativeDistribution[i].cumulativePercentage >= targetPercentage) {
      return cumulativeDistribution[i].price;
    }
  }

  // 如果没有找到，返回最后一项的价格
  return cumulativeDistribution[cumulativeDistribution.length - 1].price;
}
