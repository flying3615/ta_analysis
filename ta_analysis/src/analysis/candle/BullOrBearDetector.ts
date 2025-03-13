import { Candle } from '../../types.js';
import EnhancedBullishPatterns from '../../util/EnhancedBullishPatterns.js';
import EnhancedBearishPatterns from '../../util/EnhancedBearishPatterns.js';
import { getStockData } from '../../util/util.js';

interface PatternResult {
  date: Date;
  patternType: 'bullish' | 'bearish';
  priceLevel: number;
  strength: number; // 0-100 的强度值
  patternNames: string[]; // 形态名称
}

/**
 * 检测K线形态
 * @param candles K线数据
 * @param patternCheckingWindow 形态检测窗口大小
 * @returns 看涨和看跌形态的结果
 */
export const detectBullOrBear = (
  candles: Candle[],
  patternCheckingWindow: number = 5
): {
  bullishPatterns: PatternResult[];
  bearishPatterns: PatternResult[];
} => {
  const bullishPatterns: PatternResult[] = [];
  const bearishPatterns: PatternResult[] = [];

  for (let i = patternCheckingWindow; i < candles.length; i++) {
    const currentWindowSize = Math.min(
      patternCheckingWindow,
      candles.length - i
    );

    // i+1 为了包含当前K线
    const windowCandles = candles.slice(i - currentWindowSize, i + 1);

    // 获取最新K线的信息
    const currentCandle = windowCandles[windowCandles.length - 1];
    const currentDate = currentCandle.timestamp;
    const currentClose = currentCandle.close;

    // 检查看涨形态
    const bullishPatternNames = new EnhancedBullishPatterns().hasPattern(
      windowCandles
    );
    if (bullishPatternNames.length > 0) {
      // 计算形态强度
      const patternStrength = calculatePatternStrength(
        windowCandles,
        'bullish'
      );

      bullishPatterns.push({
        date: currentDate,
        patternType: 'bullish',
        priceLevel: currentClose,
        strength: patternStrength,
        patternNames: bullishPatternNames,
      });
    }

    // 检查看跌形态
    const bearishPatternNames = new EnhancedBearishPatterns().hasPattern(
      windowCandles
    );
    if (bearishPatternNames.length > 0) {
      // 计算形态强度
      const patternStrength = calculatePatternStrength(
        windowCandles,
        'bearish'
      );

      bearishPatterns.push({
        date: currentDate,
        patternType: 'bearish',
        priceLevel: currentClose,
        strength: patternStrength,
        patternNames: bearishPatternNames,
      });
    }
  }

  return {
    bullishPatterns,
    bearishPatterns,
  };
};

/**
 * 计算K线形态的强度
 * @param candles K线数组
 * @param patternType 形态类型
 * @returns 强度值 (0-100)
 */
function calculatePatternStrength(
  candles: Candle[],
  patternType: 'bullish' | 'bearish'
): number {
  const lastCandle = candles[candles.length - 1];
  const lastBody = Math.abs(lastCandle.close - lastCandle.open);
  const lastRange = lastCandle.high - lastCandle.low;

  // 基础强度
  let strength = 50;

  // 考虑实体大小相对于波动范围 (实体越大，信号越强)
  const bodyToRangeRatio = lastBody / lastRange;
  if (bodyToRangeRatio > 0.7) {
    strength += 20;
  } else if (bodyToRangeRatio > 0.5) {
    strength += 10;
  }

  // 考虑成交量因素 (成交量越大，信号越强)
  const volumes = candles.map(c => c.volume);
  const avgVolume =
    volumes.slice(0, volumes.length - 1).reduce((a, b) => a + b, 0) /
    (volumes.length - 1);
  const lastVolume = lastCandle.volume;

  if (lastVolume > avgVolume * 2) {
    strength += 30;
  } else if (lastVolume > avgVolume * 1.5) {
    strength += 20;
  } else if (lastVolume > avgVolume) {
    strength += 10;
  }

  // 看涨形态:价格收于上方，看跌形态:价格收于下方
  if (patternType === 'bullish' && lastCandle.close > lastCandle.open) {
    strength += 10;
  } else if (patternType === 'bearish' && lastCandle.close < lastCandle.open) {
    strength += 10;
  }

  // 确保强度在 0-100 范围内
  return Math.min(100, Math.max(0, strength));
}

/**
 * 检查最近几天是否出现看涨或看跌形态
 * @param candles K线数据
 * @param daysBefore 检查多少天以内
 * @param minStrength 最小强度要求 (0-100)
 * @returns 过滤后的结果
 */
export const checkBullOrBearRecently = (
  candles: Candle[],
  daysBefore: number = 5,
  minStrength: number = 60
) => {
  if (candles.length === 0) {
    return {
      bullishDatesWithinLast5Days: [],
      bearishDatesWithinLast5Days: [],
      bullishPatternsDetails: [],
      bearishPatternsDetails: [],
    };
  }

  const { bullishPatterns, bearishPatterns } = detectBullOrBear(candles);

  // 计算日期范围
  const today = new Date();
  const cutoffDate = new Date();
  cutoffDate.setDate(today.getDate() - daysBefore);

  // 筛选出符合条件的模式
  const recentBullishPatterns = bullishPatterns.filter(
    pattern =>
      pattern.date >= cutoffDate &&
      pattern.date <= today &&
      pattern.strength >= minStrength
  );

  const recentBearishPatterns = bearishPatterns.filter(
    pattern =>
      pattern.date >= cutoffDate &&
      pattern.date <= today &&
      pattern.strength >= minStrength
  );

  // 为了与原有接口兼容
  return {
    bullishDatesWithinLast5Days: recentBullishPatterns.map(p => p.date),
    bearishDatesWithinLast5Days: recentBearishPatterns.map(p => p.date),
    // 添加详细信息供策略分析使用
    bullishPatternsDetails: recentBullishPatterns,
    bearishPatternsDetails: recentBearishPatterns,
  };
};

/**
 * 多时间周期确认(日，周)
 * @param symbol 股票代码
 * @param startDate 开始日期
 * @param endDate 结束日期
 * @returns 多周期确认结果
 */
export const multiTimeframeConfirmation = async (
  symbol: string,
  startDate: Date,
  endDate: Date
) => {
  // 获取日K线数据
  const dailyCandles = await getStockData(symbol, startDate, endDate, '1d');

  // 检测形态
  const dailyResult = checkBullOrBearRecently(dailyCandles, 5, 60);

  // 使用周K线减少噪音
  // 需要扩展开始日期以获取足够的周K线数据用于分析
  const extendedStartDate = new Date(startDate);
  extendedStartDate.setDate(startDate.getDate() - 90); // 额外获取约90天数据，确保有足够的周K线
  const weeklyCandles = await getStockData(
    symbol,
    extendedStartDate,
    endDate,
    '1wk'
  );

  // 周K线应该检查更长的周期，比如8-12周，而小时K线可以检查2天
  const weeklyResult = checkBullOrBearRecently(
    weeklyCandles,
    5 * 5, // 5周
    60
  );

  // 检查两个时间周期是否有相同方向的信号
  const hasBullishConfirmation =
    dailyResult.bullishDatesWithinLast5Days.length > 0 &&
    weeklyResult.bullishDatesWithinLast5Days.length > 0;

  const hasBearishConfirmation =
    dailyResult.bearishDatesWithinLast5Days.length > 0 &&
    weeklyResult.bearishDatesWithinLast5Days.length > 0;

  return {
    hasBullishConfirmation,
    hasBearishConfirmation,
    dailyBullishSignals: dailyResult.bullishDatesWithinLast5Days,
    dailyBearishSignals: dailyResult.bearishDatesWithinLast5Days,
    weeklyBullishSignals: weeklyResult.bullishDatesWithinLast5Days,
    weeklyBearishSignals: weeklyResult.bearishDatesWithinLast5Days,
    dailyResult,
    weeklyResult,
  };
};

/**
 * 根据多时间周期信号生成交易建议
 * @param symbol 股票代码
 * @param startDate 开始日期
 * @param endDate 结束日期
 * @returns 交易建议，包括方向、入场价和止损价
 */
export const generateTradeRecommendation = async (
  symbol: string,
  startDate: Date,
  endDate: Date
) => {
  // 使用周线和日线进行多时间周期确认
  const mtfResult = await multiTimeframeConfirmation(
    symbol,
    startDate,
    endDate
  );

  // 获取最新的价格数据用于计算入场价和止损价
  const dailyCandles = await getStockData(symbol, startDate, endDate, '1d');
  const latestCandle = dailyCandles[dailyCandles.length - 1];
  const currentPrice = latestCandle.close;

  // 默认没有信号
  const result = {
    symbol,
    hasSignal: false,
    direction: 'neutral' as 'bullish' | 'bearish' | 'neutral',
    signalStrength: 0,
    currentPrice,
    entryPrice: null as number | null,
    stopLossPrice: null as number | null,
    takeProfitPrice: null as number | null,
    signalDate: new Date(),
    reasoning: '',
    dailySignals: {
      bullish: mtfResult.dailyBullishSignals,
      bearish: mtfResult.dailyBearishSignals,
      bullishDetails: mtfResult.dailyResult.bullishPatternsDetails,
      bearishDetails: mtfResult.dailyResult.bearishPatternsDetails,
    },
    weeklySignals: {
      bullish: mtfResult.weeklyBullishSignals,
      bearish: mtfResult.weeklyBearishSignals,
      bullishDetails: mtfResult.weeklyResult.bullishPatternsDetails,
      bearishDetails: mtfResult.weeklyResult.bearishPatternsDetails,
    },
  };

  // 计算平均信号强度
  let avgBullishStrength = 0;
  let avgBearishStrength = 0;
  let bullishSignalsCount = 0;
  let bearishSignalsCount = 0;

  // 计算日线信号的平均强度
  if (
    mtfResult.dailyResult.bullishPatternsDetails &&
    mtfResult.dailyResult.bullishPatternsDetails.length > 0
  ) {
    avgBullishStrength += mtfResult.dailyResult.bullishPatternsDetails.reduce(
      (acc, pattern) => acc + pattern.strength,
      0
    );
    bullishSignalsCount += mtfResult.dailyResult.bullishPatternsDetails.length;
  }

  if (
    mtfResult.dailyResult.bearishPatternsDetails &&
    mtfResult.dailyResult.bearishPatternsDetails.length > 0
  ) {
    avgBearishStrength += mtfResult.dailyResult.bearishPatternsDetails.reduce(
      (acc, pattern) => acc + pattern.strength,
      0
    );
    bearishSignalsCount += mtfResult.dailyResult.bearishPatternsDetails.length;
  }

  // 计算周线信号的平均强度 (周线信号权重更高)
  if (
    mtfResult.weeklyResult.bullishPatternsDetails &&
    mtfResult.weeklyResult.bullishPatternsDetails.length > 0
  ) {
    avgBullishStrength += mtfResult.weeklyResult.bullishPatternsDetails.reduce(
      (acc, pattern) => acc + pattern.strength * 1.5,
      0
    ); // 周线权重1.5倍
    bullishSignalsCount += mtfResult.weeklyResult.bullishPatternsDetails.length;
  }

  if (
    mtfResult.weeklyResult.bearishPatternsDetails &&
    mtfResult.weeklyResult.bearishPatternsDetails.length > 0
  ) {
    avgBearishStrength += mtfResult.weeklyResult.bearishPatternsDetails.reduce(
      (acc, pattern) => acc + pattern.strength * 1.5,
      0
    ); // 周线权重1.5倍
    bearishSignalsCount += mtfResult.weeklyResult.bearishPatternsDetails.length;
  }

  // 计算最终的平均强度
  if (bullishSignalsCount > 0) {
    avgBullishStrength = avgBullishStrength / bullishSignalsCount;
  }

  if (bearishSignalsCount > 0) {
    avgBearishStrength = avgBearishStrength / bearishSignalsCount;
  }

  // 根据多时间周期确认结果生成建议
  if (mtfResult.hasBullishConfirmation && !mtfResult.hasBearishConfirmation) {
    // 看涨信号
    result.hasSignal = true;
    result.direction = 'bullish';
    result.signalStrength = avgBullishStrength;

    // 计算建议的入场价、止损价和目标价
    // 入场价: 建议在当前价格上方0.5%设置买入限价单，或在当前价格直接市价买入
    result.entryPrice = Math.round(currentPrice * 100) / 100; // 四舍五入到小数点后两位

    // 止损价: 根据信号强度和最近的支撑位确定
    // 从最近5根K线中找出最低点作为支撑位参考
    const recentLows = dailyCandles.slice(-5).map(c => c.low);
    const supportLevel = Math.min(...recentLows);

    // 根据信号强度调整止损幅度(强度越高止损越宽松)
    const stopLossPercentage = 0.02 + (1 - avgBullishStrength / 100) * 0.03; // 2%-5%的止损
    result.stopLossPrice =
      Math.round(currentPrice * (1 - stopLossPercentage) * 100) / 100;

    // 如果计算的止损价低于支撑位，则使用支撑位作为止损
    if (result.stopLossPrice < supportLevel) {
      result.stopLossPrice = Math.round(supportLevel * 100) / 100;
    }

    // 目标价: 风险回报比至少为1:2
    const riskAmount = currentPrice - result.stopLossPrice;
    result.takeProfitPrice =
      Math.round((currentPrice + riskAmount * 2) * 100) / 100;

    result.reasoning = `多时间周期信号确认：日线和周线同时出现看涨信号，平均信号强度为${avgBullishStrength.toFixed(2)}。建议买入${symbol}，入场价${result.entryPrice}，止损价${result.stopLossPrice}，目标价${result.takeProfitPrice}。风险回报比为1:2。`;
  } else if (
    mtfResult.hasBearishConfirmation &&
    !mtfResult.hasBullishConfirmation
  ) {
    // 看跌信号
    result.hasSignal = true;
    result.direction = 'bearish';
    result.signalStrength = avgBearishStrength;

    // 计算建议的入场价、止损价和目标价
    // 入场价: 建议在当前价格下方0.5%设置卖出限价单，或在当前价格直接市价卖出
    result.entryPrice = Math.round(currentPrice * 100) / 100; // 四舍五入到小数点后两位

    // 止损价: 根据信号强度和最近的阻力位确定
    // 从最近5根K线中找出最高点作为阻力位参考
    const recentHighs = dailyCandles.slice(-5).map(c => c.high);
    const resistanceLevel = Math.max(...recentHighs);

    // 根据信号强度调整止损幅度(强度越高止损越宽松)
    const stopLossPercentage = 0.02 + (1 - avgBearishStrength / 100) * 0.03; // 2%-5%的止损
    result.stopLossPrice =
      Math.round(currentPrice * (1 + stopLossPercentage) * 100) / 100;

    // 如果计算的止损价高于阻力位，则使用阻力位作为止损
    if (result.stopLossPrice > resistanceLevel) {
      result.stopLossPrice = Math.round(resistanceLevel * 100) / 100;
    }

    // 目标价: 风险回报比至少为1:2
    const riskAmount = result.stopLossPrice - currentPrice;
    result.takeProfitPrice =
      Math.round((currentPrice - riskAmount * 2) * 100) / 100;

    result.reasoning = `多时间周期信号确认：日线和周线同时出现看跌信号，平均信号强度为${avgBearishStrength.toFixed(2)}。建议卖出${symbol}，入场价${result.entryPrice}，止损价${result.stopLossPrice}，目标价${result.takeProfitPrice}。风险回报比为1:2。`;
  } else if (
    mtfResult.hasBullishConfirmation &&
    mtfResult.hasBearishConfirmation
  ) {
    // 出现混合信号，比较信号强度决定方向
    result.hasSignal = true;

    if (avgBullishStrength > avgBearishStrength) {
      // 看涨信号更强
      result.direction = 'bullish';
      result.signalStrength = avgBullishStrength - avgBearishStrength; // 信号强度为两者差值

      // 入场价、止损价计算(相对保守)
      result.entryPrice = Math.round(currentPrice * 100) / 100;

      // 更保守的止损(由于存在混合信号)
      const recentLows = dailyCandles.slice(-7).map(c => c.low);
      const supportLevel = Math.min(...recentLows);
      result.stopLossPrice = Math.round(supportLevel * 100) / 100;

      // 保守的目标价设置
      const riskAmount = currentPrice - result.stopLossPrice;
      result.takeProfitPrice =
        Math.round((currentPrice + riskAmount * 1.5) * 100) / 100;

      result.reasoning = `出现混合信号，但看涨信号强度(${avgBullishStrength.toFixed(2)})高于看跌信号强度(${avgBearishStrength.toFixed(2)})。建议谨慎买入${symbol}，入场价${result.entryPrice}，止损价${result.stopLossPrice}，目标价${result.takeProfitPrice}。`;
    } else {
      // 看跌信号更强
      result.direction = 'bearish';
      result.signalStrength = avgBearishStrength - avgBullishStrength; // 信号强度为两者差值

      // 入场价、止损价计算(相对保守)
      result.entryPrice = Math.round(currentPrice * 100) / 100;

      // 更保守的止损(由于存在混合信号)
      const recentHighs = dailyCandles.slice(-7).map(c => c.high);
      const resistanceLevel = Math.max(...recentHighs);
      result.stopLossPrice = Math.round(resistanceLevel * 100) / 100;

      // 保守的目标价设置
      const riskAmount = result.stopLossPrice - currentPrice;
      result.takeProfitPrice =
        Math.round((currentPrice - riskAmount * 1.5) * 100) / 100;

      result.reasoning = `出现混合信号，但看跌信号强度(${avgBearishStrength.toFixed(2)})高于看涨信号强度(${avgBullishStrength.toFixed(2)})。建议谨慎卖出${symbol}，入场价${result.entryPrice}，止损价${result.stopLossPrice}，目标价${result.takeProfitPrice}。`;
    }
  } else {
    // 无明确信号
    result.reasoning = `没有明确的交易信号。周线和日线没有同时出现看涨或看跌信号。建议观望，等待明确的多时间周期确认信号出现。`;
  }

  return result;
};
