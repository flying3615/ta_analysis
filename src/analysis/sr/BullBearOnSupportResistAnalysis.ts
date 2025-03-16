import { Candle, SRSignal, SupportResistanceResult } from '../../types.js';
import { getStockDataForTimeframe } from '../../util/util.js';
import { checkBullOrBearRecently } from '../candle/BullOrBearDetector.js';

/**
 * 查找枢轴点
 * @param data
 * @param leftBars
 * @param rightBars
 */
function findPivotPoints(
  data: Candle[],
  leftBars: number,
  rightBars: number
): {
  highPivots: (number | null)[];
  lowPivots: (number | null)[];
} {
  const highPivots: (number | null)[] = Array(data.length).fill(null);
  const lowPivots: (number | null)[] = Array(data.length).fill(null);

  // 首先计算实际的枢轴点
  for (let i = leftBars; i < data.length - rightBars; i++) {
    // 检查高点
    let isHighPivot = true;
    for (let j = i - leftBars; j < i; j++) {
      if (data[j].high >= data[i].high) {
        isHighPivot = false;
        break;
      }
    }

    if (isHighPivot) {
      for (let j = i + 1; j <= i + rightBars; j++) {
        if (data[j].high >= data[i].high) {
          isHighPivot = false;
          break;
        }
      }
    }

    if (isHighPivot) {
      highPivots[i] = data[i].high;
    }

    // 检查低点
    let isLowPivot = true;
    for (let j = i - leftBars; j < i; j++) {
      if (data[j].low <= data[i].low) {
        isLowPivot = false;
        break;
      }
    }

    if (isLowPivot) {
      for (let j = i + 1; j <= i + rightBars; j++) {
        if (data[j].low <= data[i].low) {
          isLowPivot = false;
          break;
        }
      }
    }

    if (isLowPivot) {
      lowPivots[i] = data[i].low;
    }
  }

  // 然后实现类似 fixnan 的逻辑，填充值
  let lastValidHigh = null;
  let lastValidLow = null;

  for (let i = 0; i < data.length; i++) {
    if (highPivots[i] !== null) {
      lastValidHigh = highPivots[i];
    } else if (lastValidHigh !== null) {
      highPivots[i] = lastValidHigh;
    }

    if (lowPivots[i] !== null) {
      lastValidLow = lowPivots[i];
    } else if (lastValidLow !== null) {
      lowPivots[i] = lastValidLow;
    }
  }

  return { highPivots, lowPivots };
}

/**
 * 检查价格是否在某个水平附近
 * @param price 当前价格
 * @param level 价格水平
 * @param threshold 阈值（百分比）
 * @returns 是否在水平附近
 */
function isNearLevel(price: number, level: number, threshold: number): boolean {
  const diff = Math.abs(price - level) / level;
  return diff <= threshold;
}

// 检测支撑和阻力
function detectSupportResistance(
  symbol: string,
  candles: Candle[],
  config: {
    leftBars: number;
    rightBars: number;
  }
): SupportResistanceResult {
  if (candles.length < config.leftBars + config.rightBars + 1) {
    console.warn('数据不足以计算支撑阻力位');
    return {
      symbol,
      dynamicSupport: null,
      dynamicResistance: null,
    };
  }

  const { leftBars, rightBars } = config;

  // 1. 使用修复后的函数计算枢轴点
  const { highPivots, lowPivots } = findPivotPoints(
    candles,
    leftBars,
    rightBars
  );

  // 2. 过滤出唯一的支撑和阻力水平
  const highSet = new Set<number>();
  const lowSet = new Set<number>();

  highPivots.forEach(p => {
    if (p !== null) highSet.add(p);
  });

  lowPivots.forEach(p => {
    if (p !== null) lowSet.add(p);
  });

  const resistanceLevels = Array.from(highSet).sort((a, b) => a - b);
  const supportLevels = Array.from(lowSet).sort((a, b) => a - b);

  // 3. 获取当前价格附近的支撑和阻力
  const currentPrice = candles[candles.length - 1].close;

  let dynamicSupport = null;
  let dynamicResistance = null;

  // 找到低于当前价格的最高支撑位
  for (let i = supportLevels.length - 1; i >= 0; i--) {
    if (supportLevels[i] < currentPrice) {
      dynamicSupport = supportLevels[i];
      break;
    }
  }

  // 找到高于当前价格的最低阻力位
  for (let i = 0; i < resistanceLevels.length; i++) {
    if (resistanceLevels[i] > currentPrice) {
      dynamicResistance = resistanceLevels[i];
      break;
    }
  }

  return {
    symbol,
    dynamicSupport,
    dynamicResistance,
  };
}

/**
 * 检查是否在支撑位或阻力位附近
 * @param symbol
 * @param candles
 */
function checkBullBearNearSupportResistance(
  symbol: string,
  candles: Candle[]
): SRSignal {
  const srResult = detectSupportResistance(symbol, candles, {
    leftBars: 10,
    rightBars: 10,
  });

  const { bullishPatternsDetails, bearishPatternsDetails } =
    checkBullOrBearRecently(candles);

  // 获取当前价格
  const currentPrice = candles[candles.length - 1].close;

  // 4. 判断最新的信号类型 (看涨或看跌)
  const lastBullishPattern =
    bullishPatternsDetails.length > 0
      ? bullishPatternsDetails[bullishPatternsDetails.length - 1]
      : null;

  const lastBearishPattern =
    bearishPatternsDetails.length > 0
      ? bearishPatternsDetails[bearishPatternsDetails.length - 1]
      : null;

  // 确定最近的信号类型
  let recentSignalType = '';
  let recentSignalDate: Date | null = null;
  let signalStrength = 0;

  if (!lastBullishPattern && lastBearishPattern) {
    recentSignalType = 'bearish';
    recentSignalDate = lastBearishPattern.date;
    signalStrength = lastBearishPattern.strength;
  } else if (lastBullishPattern && !lastBearishPattern) {
    recentSignalType = 'bullish';
    recentSignalDate = lastBullishPattern.date;
    signalStrength = lastBullishPattern.strength;
  } else if (lastBullishPattern && lastBearishPattern) {
    // 如果两种信号都有，选择最近的
    recentSignalType =
      lastBullishPattern.date > lastBearishPattern.date ? 'bullish' : 'bearish';
    recentSignalDate =
      recentSignalType === 'bullish'
        ? lastBullishPattern.date
        : lastBearishPattern.date;
    signalStrength =
      recentSignalType === 'bullish'
        ? lastBullishPattern.strength
        : lastBearishPattern.strength;
  } else {
    // 没有信号
    return;
  }

  // 5. 判断是否在支撑位或阻力位附近
  if (recentSignalType === 'bullish' && recentSignalDate) {
    // 检查是否在支撑位附近 (当前价格在支撑位 ±10% 范围内)
    const dynamicSupport = srResult.dynamicSupport;
    if (dynamicSupport && isNearLevel(currentPrice, dynamicSupport, 0.1)) {
      return {
        symbol,
        SRLevel: dynamicSupport,
        signalDate: recentSignalDate,
        currentPrice: currentPrice,
        strength: signalStrength,
        signal: lastBullishPattern,
      };
    }
  }

  if (recentSignalType === 'bearish' && recentSignalDate) {
    // 检查是否在阻力位附近 (当前价格在阻力位 ±10% 范围内)
    const dynamicResistance = srResult.dynamicResistance;
    if (
      dynamicResistance &&
      isNearLevel(currentPrice, dynamicResistance, 0.1)
    ) {
      return {
        symbol: symbol,
        SRLevel: dynamicResistance,
        signalDate: recentSignalDate,
        currentPrice: currentPrice,
        strength: signalStrength,
        signal: lastBearishPattern,
      };
    }
  }
}

export { detectSupportResistance, checkBullBearNearSupportResistance };
