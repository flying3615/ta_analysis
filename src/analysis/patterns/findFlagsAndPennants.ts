import { Candle } from '../../types.js';
import {
  PatternAnalysisResult,
  PatternDirection,
  PatternStatus,
  PatternType,
  PeakValley,
} from './multiTimeFramePatternAnalysis.js';
import { getStatusDescription } from '../../util/util.js';

/**
 * 寻找旗形和三角旗形态
 */
export function findFlagsAndPennants(
  data: Candle[],
  peaksValleys: PeakValley[],
  lookbackPeriod: number = 30
): PatternAnalysisResult[] {
  const patterns: PatternAnalysisResult[] = [];
  /**
   * 检测数据中的趋势
   */
  function detectTrend(
    data: Candle[],
    lookbackPeriod: number
  ): { isBullishTrend: boolean; isBearishTrend: boolean } {
    const trendDetectionPeriod = Math.min(lookbackPeriod, 20);
    const startIdx = Math.max(0, data.length - lookbackPeriod);
    const endIdx = startIdx + trendDetectionPeriod;

    // 确保索引有效
    if (endIdx >= data.length) {
      return { isBullishTrend: false, isBearishTrend: false };
    }

    const priorCandles = data.slice(startIdx, endIdx);

    // 计算趋势强度
    let upMoves = 0;
    let downMoves = 0;

    for (let i = 1; i < priorCandles.length; i++) {
      if (priorCandles[i].close > priorCandles[i - 1].close) {
        upMoves++;
      } else if (priorCandles[i].close < priorCandles[i - 1].close) {
        downMoves++;
      }
    }

    return {
      isBullishTrend: upMoves > downMoves * 1.5,
      isBearishTrend: downMoves > upMoves * 1.5,
    };
  }

  /**
   * 按方向查找模式
   */
  function findPatternsByDirection(
    data: Candle[],
    lookbackPeriod: number,
    config: {
      minDuration: number;
      maxDuration: number;
      minFlagpoleMove: number;
    },
    direction: PatternDirection
  ): PatternAnalysisResult[] {
    const patterns: PatternAnalysisResult[] = [];
    const isBullish = direction === PatternDirection.Bullish;

    // 寻找潜在的旗杆
    const flagpoleInfo = findFlagpole(
      data,
      lookbackPeriod,
      config.minFlagpoleMove,
      direction
    );

    if (
      !flagpoleInfo ||
      flagpoleInfo.flagpoleEndIndex <= flagpoleInfo.flagpoleStartIndex
    ) {
      return patterns;
    }

    // 收集关键日期和价格
    const keyDates: Date[] = [data[flagpoleInfo.flagpoleEndIndex].timestamp];
    const keyPrices: number[] = [
      isBullish
        ? data[flagpoleInfo.flagpoleEndIndex].high
        : data[flagpoleInfo.flagpoleEndIndex].low,
    ];

    // 旗杆后寻找旗形或三角旗
    const consolidationStart = flagpoleInfo.flagpoleEndIndex;
    const consolidationEnd = Math.min(
      consolidationStart + config.maxDuration,
      data.length - 1
    );

    // 获取上下边界
    const { upper, lower } = getBoundaries(
      data,
      consolidationStart,
      consolidationEnd,
      keyDates,
      keyPrices
    );

    // 计算边界斜率
    const upperSlope = calculateSlope(upper);
    const lowerSlope = calculateSlope(lower);

    // 检查是否形成了旗形
    const isFlag = checkForFlag(upperSlope, lowerSlope, direction);

    if (isFlag && consolidationEnd - consolidationStart >= config.minDuration) {
      // 添加旗形模式
      const flagPattern = createFlagPattern(
        data,
        flagpoleInfo,
        consolidationStart,
        consolidationEnd,
        upper,
        lower,
        upperSlope,
        lowerSlope,
        direction,
        keyDates,
        keyPrices
      );
      patterns.push(flagPattern);
    } else {
      // 检查是否形成了三角旗
      const isPennant = checkForPennant(upperSlope, lowerSlope, direction);

      if (
        isPennant &&
        consolidationEnd - consolidationStart >= config.minDuration
      ) {
        // 添加三角旗模式
        const pennantPattern = createPennantPattern(
          data,
          flagpoleInfo,
          consolidationStart,
          consolidationEnd,
          upper,
          lower,
          upperSlope,
          lowerSlope,
          direction,
          keyDates,
          keyPrices
        );
        patterns.push(pennantPattern);
      }
    }

    return patterns;
  }

  /**
   * 查找旗杆
   */
  function findFlagpole(
    data: Candle[],
    lookbackPeriod: number,
    minFlagpoleMove: number,
    direction: PatternDirection
  ): {
    flagpoleStartIndex: number;
    flagpoleEndIndex: number;
    flagpolePrice: number;
  } | null {
    const isBullish = direction === PatternDirection.Bullish;

    for (let i = data.length - lookbackPeriod; i < data.length - 20; i++) {
      // 确保索引有效
      if (i < 0) continue;

      const moveEnd = Math.min(i + 10, data.length - 20);

      if (isBullish) {
        // 在看涨趋势中寻找向上的旗杆
        const lowPrice = data[i].low;
        const highPrices = data.slice(i, moveEnd).map(d => d.high);
        const highPrice = Math.max(...highPrices);

        if ((highPrice - lowPrice) / lowPrice > minFlagpoleMove) {
          // 找出旗杆结束的点
          for (let j = i + 1; j < moveEnd; j++) {
            if (data[j].high >= highPrice * 0.98) {
              return {
                flagpoleStartIndex: i,
                flagpoleEndIndex: j,
                flagpolePrice: highPrice,
              };
            }
          }
        }
      } else {
        // 在看跌趋势中寻找向下的旗杆
        const highPrice = data[i].high;
        const lowPrices = data.slice(i, moveEnd).map(d => d.low);
        const lowPrice = Math.min(...lowPrices);

        if ((highPrice - lowPrice) / highPrice > minFlagpoleMove) {
          // 找出旗杆结束的点
          for (let j = i + 1; j < moveEnd; j++) {
            if (data[j].low <= lowPrice * 1.02) {
              return {
                flagpoleStartIndex: i,
                flagpoleEndIndex: j,
                flagpolePrice: lowPrice,
              };
            }
          }
        }
      }
    }

    return null;
  }

  /**
   * 获取价格边界
   */
  function getBoundaries(
    data: Candle[],
    start: number,
    end: number,
    keyDates: Date[],
    keyPrices: number[]
  ): { upper: number[]; lower: number[] } {
    const upper: number[] = [];
    const lower: number[] = [];

    for (let i = start; i < end; i++) {
      if (i >= 0 && i < data.length) {
        upper.push(data[i].high);
        lower.push(data[i].low);

        keyDates.push(data[i].timestamp);
        keyPrices.push(data[i].high);
      }
    }

    return { upper, lower };
  }

  /**
   * 计算斜率
   */
  function calculateSlope(prices: number[]): number {
    if (prices.length <= 1) return 0;
    return (prices[prices.length - 1] - prices[0]) / prices.length;
  }

  /**
   * 检查是否形成旗形
   */
  function checkForFlag(
    upperSlope: number,
    lowerSlope: number,
    direction: PatternDirection
  ): boolean {
    const isBullish = direction === PatternDirection.Bullish;

    if (isBullish) {
      // 看涨旗形通常是平行通道，且在上升趋势后向下倾斜
      return (
        upperSlope < 0 &&
        lowerSlope < 0 &&
        Math.abs(upperSlope - lowerSlope) / Math.abs(upperSlope) < 0.3
      );
    } else {
      // 看跌旗形通常是平行通道，且在下降趋势后向上倾斜
      return (
        upperSlope > 0 &&
        lowerSlope > 0 &&
        Math.abs(upperSlope - lowerSlope) / Math.abs(upperSlope) < 0.3
      );
    }
  }

  /**
   * 检查是否形成三角旗
   */
  function checkForPennant(
    upperSlope: number,
    lowerSlope: number,
    direction: PatternDirection
  ): boolean {
    const isBullish = direction === PatternDirection.Bullish;

    if (isBullish) {
      // 看涨三角旗表现为上边界向下，下边界向上（收敛）
      return upperSlope < 0 && lowerSlope > 0;
    } else {
      // 看跌三角旗表现为上边界向上，下边界向下（收敛）
      return upperSlope > 0 && lowerSlope < 0;
    }
  }

  /**
   * 创建旗形模式结果
   */
  function createFlagPattern(
    data: Candle[],
    flagpoleInfo: {
      flagpoleStartIndex: number;
      flagpoleEndIndex: number;
      flagpolePrice: number;
    },
    consolidationStart: number,
    consolidationEnd: number,
    upper: number[],
    lower: number[],
    upperSlope: number,
    lowerSlope: number,
    direction: PatternDirection,
    keyDates: Date[],
    keyPrices: number[]
  ): PatternAnalysisResult {
    const isBullish = direction === PatternDirection.Bullish;
    const currentPrice = data[data.length - 1].close;

    // 计算旗形的特性
    const flagHeight = upper[0] - lower[0];
    const flagpoleMagnitude = isBullish
      ? flagpoleInfo.flagpolePrice - data[flagpoleInfo.flagpoleStartIndex].low
      : data[flagpoleInfo.flagpoleStartIndex].high - flagpoleInfo.flagpolePrice;

    // 计算价格目标和突破水平
    const breakoutPrice = isBullish
      ? upper[upper.length - 1]
      : lower[lower.length - 1];

    const priceTarget = isBullish
      ? breakoutPrice + flagpoleMagnitude
      : breakoutPrice - flagpoleMagnitude;

    // 确定模式状态
    const status = determinePatternStatus(
      data,
      breakoutPrice,
      consolidationStart,
      consolidationEnd,
      direction
    );

    // 计算可靠性
    const reliability = calculateFlagReliability(
      data,
      flagpoleInfo.flagpoleStartIndex,
      flagpoleInfo.flagpoleEndIndex,
      consolidationStart,
      consolidationEnd,
      flagpoleMagnitude,
      flagHeight,
      status === PatternStatus.Confirmed
    );

    // 构建模式结果
    return {
      patternType: PatternType.Flag,
      status,
      direction,
      reliability,
      significance: reliability * (flagpoleMagnitude / currentPrice),
      component: {
        startIndex: flagpoleInfo.flagpoleStartIndex,
        endIndex: consolidationEnd,
        keyPoints: [], // 简化，不详细指定关键点
        patternHeight: flagHeight,
        breakoutLevel: breakoutPrice,
        volumePattern: analyzeFlagVolume(
          data,
          flagpoleInfo.flagpoleStartIndex,
          flagpoleInfo.flagpoleEndIndex,
          consolidationStart,
          consolidationEnd
        ),
      },
      priceTarget,
      stopLoss: isBullish ? lower[lower.length - 1] : upper[upper.length - 1],
      breakoutExpected: status === PatternStatus.Completed,
      breakoutDirection: direction,
      probableBreakoutZone: [breakoutPrice * 0.99, breakoutPrice * 1.01],
      description: `${isBullish ? '看涨' : '看跌'}旗形, ${getStatusDescription(status)}, 旗杆高度: ${flagpoleMagnitude.toFixed(2)}, 突破位: ${breakoutPrice.toFixed(2)}`,
      tradingImplication: `${isBullish ? '看涨' : '看跌'}信号, 目标价位: ${priceTarget.toFixed(2)}, 止损位: ${(isBullish ? lower[lower.length - 1] : upper[upper.length - 1]).toFixed(2)}`,
      keyDates,
      keyPrices,
    };
  }

  /**
   * 创建三角旗模式结果
   */
  function createPennantPattern(
    data: Candle[],
    flagpoleInfo: {
      flagpoleStartIndex: number;
      flagpoleEndIndex: number;
      flagpolePrice: number;
    },
    consolidationStart: number,
    consolidationEnd: number,
    upper: number[],
    lower: number[],
    upperSlope: number,
    lowerSlope: number,
    direction: PatternDirection,
    keyDates: Date[],
    keyPrices: number[]
  ): PatternAnalysisResult {
    const isBullish = direction === PatternDirection.Bullish;
    const currentPrice = data[data.length - 1].close;
    const currentIndex = data.length - 1;

    // 计算三角旗的特性
    const pennantHeight = upper[0] - lower[0];
    const flagpoleMagnitude = isBullish
      ? flagpoleInfo.flagpolePrice - data[flagpoleInfo.flagpoleStartIndex].low
      : data[flagpoleInfo.flagpoleStartIndex].high - flagpoleInfo.flagpolePrice;

    // 计算收敛点
    const upperStartPrice = upper[0];
    const lowerStartPrice = lower[0];
    const convergenceIndex =
      consolidationStart +
      (upperStartPrice - lowerStartPrice) / (lowerSlope - upperSlope);

    // 计算当前的投影边界
    const projectedUpper =
      upperStartPrice + upperSlope * (currentIndex - consolidationStart);
    const projectedLower =
      lowerStartPrice + lowerSlope * (currentIndex - consolidationStart);

    // 确定突破价格和目标价格
    const breakoutPrice = isBullish ? projectedUpper : projectedLower;
    const priceTarget = isBullish
      ? breakoutPrice + flagpoleMagnitude
      : breakoutPrice - flagpoleMagnitude;

    // 确定模式状态
    let status = PatternStatus.Forming;
    if (
      (isBullish && currentPrice > projectedUpper) ||
      (!isBullish && currentPrice < projectedLower)
    ) {
      status = PatternStatus.Confirmed;
    } else if (consolidationEnd - consolidationStart > 20) {
      // 使用maxDuration
      status = PatternStatus.Failed;
    } else {
      status = PatternStatus.Completed;
    }

    // 计算可靠性
    const reliability = calculatePennantReliability(
      data,
      flagpoleInfo.flagpoleStartIndex,
      flagpoleInfo.flagpoleEndIndex,
      consolidationStart,
      consolidationEnd,
      flagpoleMagnitude,
      pennantHeight,
      convergenceIndex,
      currentIndex,
      status === PatternStatus.Confirmed
    );

    // 构建模式结果
    return {
      patternType: PatternType.Pennant,
      status,
      direction,
      reliability,
      significance: reliability * (flagpoleMagnitude / currentPrice),
      component: {
        startIndex: flagpoleInfo.flagpoleStartIndex,
        endIndex: consolidationEnd,
        keyPoints: [], // 简化，不详细指定关键点
        patternHeight: pennantHeight,
        breakoutLevel: breakoutPrice,
        volumePattern: analyzeFlagVolume(
          data,
          flagpoleInfo.flagpoleStartIndex,
          flagpoleInfo.flagpoleEndIndex,
          consolidationStart,
          consolidationEnd
        ),
      },
      priceTarget,
      stopLoss: isBullish ? projectedLower : projectedUpper,
      breakoutExpected: status === PatternStatus.Completed,
      breakoutDirection: direction,
      probableBreakoutZone: [breakoutPrice * 0.99, breakoutPrice * 1.01],
      description: `${isBullish ? '看涨' : '看跌'}三角旗, ${getStatusDescription(status)}, 旗杆高度: ${flagpoleMagnitude.toFixed(2)}, 突破位: ${breakoutPrice.toFixed(2)}`,
      tradingImplication: `${isBullish ? '看涨' : '看跌'}信号, 目标价位: ${priceTarget.toFixed(2)}, 止损位: ${(isBullish ? projectedLower : projectedUpper).toFixed(2)}`,
      keyDates,
      keyPrices,
    };
  }

  /**
   * 确定模式状态
   */
  function determinePatternStatus(
    data: Candle[],
    breakoutPrice: number,
    consolidationStart: number,
    consolidationEnd: number,
    direction: PatternDirection
  ): PatternStatus {
    const currentPrice = data[data.length - 1].close;
    const isBullish = direction === PatternDirection.Bullish;
    const flagDuration = consolidationEnd - consolidationStart;

    if (
      (isBullish && currentPrice > breakoutPrice) ||
      (!isBullish && currentPrice < breakoutPrice)
    ) {
      return PatternStatus.Confirmed;
    } else if (flagDuration > 20) {
      // 使用maxDuration
      return PatternStatus.Failed;
    } else {
      return PatternStatus.Completed;
    }
  }

  // 确保有足够的数据
  if (!data || data.length < lookbackPeriod) {
    return patterns;
  }

  // 检测之前的趋势
  const trendInfo = detectTrend(data, lookbackPeriod);

  // 如果没有明显趋势，直接返回
  if (!trendInfo.isBullishTrend && !trendInfo.isBearishTrend) {
    return patterns;
  }

  // 用于旗形的配置参数
  const config = {
    minDuration: 5,
    maxDuration: 20,
    minFlagpoleMove: 0.05, // 5%
  };

  // 处理看涨趋势
  if (trendInfo.isBullishTrend) {
    const bullishPatterns = findPatternsByDirection(
      data,
      lookbackPeriod,
      config,
      PatternDirection.Bullish
    );
    patterns.push(...bullishPatterns);
  }

  // 处理看跌趋势
  if (trendInfo.isBearishTrend) {
    const bearishPatterns = findPatternsByDirection(
      data,
      lookbackPeriod,
      config,
      PatternDirection.Bearish
    );
    patterns.push(...bearishPatterns);
  }

  return patterns;
}

/**
 * 计算旗形的可靠性
 */
function calculateFlagReliability(
  data: Candle[],
  flagpoleStartIndex: number,
  flagpoleEndIndex: number,
  consolidationStartIndex: number,
  consolidationEndIndex: number,
  flagpoleMagnitude: number,
  flagHeight: number,
  isBreakoutConfirmed: boolean
): number {
  let score = 50; // 初始可靠性分数

  // 1. 旗杆强度
  const avgPrice =
    data
      .slice(flagpoleStartIndex, flagpoleEndIndex + 1)
      .reduce((sum, d) => sum + d.close, 0) /
    (flagpoleEndIndex - flagpoleStartIndex + 1);
  const flagpoleStrength = flagpoleMagnitude / avgPrice;

  if (flagpoleStrength > 0.1)
    score += 15; // 旗杆移动超过10%
  else if (flagpoleStrength > 0.05)
    score += 10; // 旗杆移动超过5%
  else score += 5; // 旗杆移动较小

  // 2. 旗形持续时间（应该在合理范围内）
  const flagDuration = consolidationEndIndex - consolidationStartIndex;
  if (flagDuration >= 5 && flagDuration <= 15)
    score += 10; // 理想的持续时间
  else if (flagDuration > 15) score += 5; // 持续时间略长

  // 3. 旗形高度（相对于旗杆的高度）
  const heightRatio = flagHeight / flagpoleMagnitude;
  if (heightRatio <= 0.5)
    score += 15; // 旗形不超过旗杆一半高度，理想情况
  else if (heightRatio <= 0.7)
    score += 10; // 旗形高度适中
  else score += 5; // 旗形高度较大

  // 4. 旗杆成交量
  const flagpoleVolume =
    data
      .slice(flagpoleStartIndex, flagpoleEndIndex + 1)
      .reduce((sum, d) => sum + d.volume, 0) /
    (flagpoleEndIndex - flagpoleStartIndex + 1);
  const priorVolume =
    flagpoleStartIndex > 10
      ? data
          .slice(flagpoleStartIndex - 10, flagpoleStartIndex)
          .reduce((sum, d) => sum + d.volume, 0) / 10
      : flagpoleVolume;

  if (flagpoleVolume > priorVolume * 1.5)
    score += 10; // 旗杆期间成交量明显放大
  else if (flagpoleVolume > priorVolume * 1.2) score += 5; // 旗杆期间成交量稍微放大

  // 5. 确认突破
  if (isBreakoutConfirmed) score += 10;

  // 最后确保分数在0-100范围内
  return Math.max(0, Math.min(100, score));
}

/**
 * 计算三角旗的可靠性
 */
function calculatePennantReliability(
  data: Candle[],
  flagpoleStartIndex: number,
  flagpoleEndIndex: number,
  consolidationStartIndex: number,
  consolidationEndIndex: number,
  flagpoleMagnitude: number,
  pennantHeight: number,
  convergenceIndex: number,
  currentIndex: number,
  isBreakoutConfirmed: boolean
): number {
  let score = 50; // 初始可靠性分数

  // 1. 旗杆强度
  const avgPrice =
    data
      .slice(flagpoleStartIndex, flagpoleEndIndex + 1)
      .reduce((sum, d) => sum + d.close, 0) /
    (flagpoleEndIndex - flagpoleStartIndex + 1);
  const flagpoleStrength = flagpoleMagnitude / avgPrice;

  if (flagpoleStrength > 0.1)
    score += 15; // 旗杆移动超过10%
  else if (flagpoleStrength > 0.05)
    score += 10; // 旗杆移动超过5%
  else score += 5; // 旗杆移动较小

  // 2. 三角旗持续时间（应该在合理范围内）
  const pennantDuration = consolidationEndIndex - consolidationStartIndex;
  if (pennantDuration >= 5 && pennantDuration <= 15)
    score += 10; // 理想的持续时间
  else if (pennantDuration > 15) score += 5; // 持续时间略长

  // 3. 收敛点的接近程度
  const proximityToConvergence =
    1 - Math.min(1, Math.abs(currentIndex - convergenceIndex) / 20);
  score += proximityToConvergence * 10;

  // 4. 旗杆成交量
  const flagpoleVolume =
    data
      .slice(flagpoleStartIndex, flagpoleEndIndex + 1)
      .reduce((sum, d) => sum + d.volume, 0) /
    (flagpoleEndIndex - flagpoleStartIndex + 1);
  const priorVolume =
    flagpoleStartIndex > 10
      ? data
          .slice(flagpoleStartIndex - 10, flagpoleStartIndex)
          .reduce((sum, d) => sum + d.volume, 0) / 10
      : flagpoleVolume;

  if (flagpoleVolume > priorVolume * 1.5)
    score += 10; // 旗杆期间成交量明显放大
  else if (flagpoleVolume > priorVolume * 1.2) score += 5; // 旗杆期间成交量稍微放大

  // 5. 确认突破
  if (isBreakoutConfirmed) score += 10;

  // 最后确保分数在0-100范围内
  return Math.max(0, Math.min(100, score));
}

/**
 * 分析旗形和三角旗的成交量特征
 */
function analyzeFlagVolume(
  data: Candle[],
  flagpoleStartIndex: number,
  flagpoleEndIndex: number,
  consolidationStartIndex: number,
  consolidationEndIndex: number
): string {
  // 计算旗杆成交量
  const flagpoleVolumes = data
    .slice(flagpoleStartIndex, flagpoleEndIndex + 1)
    .map(d => d.volume);
  const avgFlagpoleVolume =
    flagpoleVolumes.reduce((sum, v) => sum + v, 0) / flagpoleVolumes.length;

  // 计算整理期成交量
  const consolidationVolumes = data
    .slice(consolidationStartIndex, consolidationEndIndex + 1)
    .map(d => d.volume);
  const avgConsolidationVolume =
    consolidationVolumes.reduce((sum, v) => sum + v, 0) /
    consolidationVolumes.length;

  // 计算整理期内的成交量趋势
  let volumeTrend = 0;
  for (let i = 1; i < consolidationVolumes.length; i++) {
    volumeTrend +=
      consolidationVolumes[i] > consolidationVolumes[i - 1] ? 1 : -1;
  }

  // 检查突破时的成交量
  let breakoutVolume = 0;
  if (consolidationEndIndex + 1 < data.length) {
    breakoutVolume = data[consolidationEndIndex + 1].volume;
  }

  if (avgConsolidationVolume < avgFlagpoleVolume * 0.7) {
    // 理想情况：整理期间成交量萎缩
    if (breakoutVolume > avgConsolidationVolume * 1.5) {
      return '理想的成交量模式：旗杆成交量大，整理期成交量萎缩，突破时成交量放大';
    } else {
      return '良好的成交量模式：旗杆成交量大，整理期成交量萎缩';
    }
  } else if (volumeTrend < 0) {
    return '可接受的成交量模式：整理期内成交量逐渐减少';
  } else {
    return '非理想的成交量模式：整理期内成交量没有明显萎缩，降低形态可靠性';
  }
}
