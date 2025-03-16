import { Candle } from '../../types.js';
import {
  PatternAnalysisResult,
  PatternDirection,
  PatternStatus,
  PatternType,
  PeakValley,
} from './analyzeMultiTimeframePatterns.js';
import { getStatusDescription } from '../../util/util.js';

/**
 * 寻找圆底/圆顶形态
 */
export function findRoundingPatterns(
  data: Candle[],
  peaksValleys: PeakValley[],
  lookbackPeriod: number = 60
): PatternAnalysisResult[] {
  const patterns: PatternAnalysisResult[] = [];

  // 确保有足够的数据
  if (data.length < lookbackPeriod) {
    return patterns;
  }

  // 检测圆底形态 (看涨)
  const recentData = data.slice(data.length - lookbackPeriod);
  const smoothedPrices = [];

  // 使用简单的移动平均来平滑价格
  const smoothingPeriod = 5;
  for (let i = smoothingPeriod - 1; i < recentData.length; i++) {
    const avgPrice =
      recentData
        .slice(i - (smoothingPeriod - 1), i + 1)
        .reduce((sum, d) => sum + d.close, 0) / smoothingPeriod;
    smoothedPrices.push(avgPrice);
  }

  // 寻找最低点
  let minPrice = Number.MAX_VALUE;
  let minIndex = -1;

  for (let i = 0; i < smoothedPrices.length; i++) {
    if (smoothedPrices[i] < minPrice) {
      minPrice = smoothedPrices[i];
      minIndex = i;
    }
  }

  // 如果最低点不在序列的开始或结束附近
  if (
    minIndex > smoothedPrices.length * 0.2 &&
    minIndex < smoothedPrices.length * 0.8
  ) {
    // 检查左侧是否下降（价格应该从高到低）
    let leftSideFalling = true;
    for (let i = 1; i <= Math.min(10, minIndex); i++) {
      // 如果前一个价格低于后一个价格，则不是下降趋势
      if (smoothedPrices[minIndex - i] < smoothedPrices[minIndex - i + 1]) {
        leftSideFalling = false;
        break;
      }
    }

    // 检查右侧是否上升（价格应该从低到高）
    let rightSideRising = true;
    for (
      let i = 1;
      i <= Math.min(10, smoothedPrices.length - minIndex - 1);
      i++
    ) {
      // 如果后一个价格低于前一个价格，则不是上升趋势
      if (smoothedPrices[minIndex + i] < smoothedPrices[minIndex + i - 1]) {
        rightSideRising = false;
        break;
      }
    }

    if (leftSideFalling && rightSideRising) {
      // 找到一个潜在的圆底形态
      const keyDates: Date[] = [];
      const keyPrices: number[] = [];

      // 确定形态的开始、低点和结束位置
      const roundBottomStart =
        data.length - lookbackPeriod + Math.max(0, minIndex - 10);
      const lowestPoint = data.length - lookbackPeriod + minIndex;
      const roundBottomEnd = Math.min(
        data.length - 1,
        data.length - lookbackPeriod + minIndex + 10
      );

      // 计算形态特性
      const roundingStartPrice = data[roundBottomStart].close;
      const roundingBottomPrice = data[lowestPoint].low;
      const roundingEndPrice = data[roundBottomEnd].close;
      const roundingHeight =
        Math.min(roundingStartPrice, roundingEndPrice) - roundingBottomPrice;

      // 收集关键点信息
      keyDates.push(data[roundBottomStart].timestamp);
      keyDates.push(data[lowestPoint].timestamp);
      keyDates.push(data[roundBottomEnd].timestamp);

      keyPrices.push(data[roundBottomStart].close);
      keyPrices.push(data[lowestPoint].low);
      keyPrices.push(data[roundBottomEnd].close);

      // 定义关键点对象数组
      const keyPoints: PeakValley[] = [
        {
          index: roundBottomStart,
          type: 'peak',
          price: roundingStartPrice,
          date: data[roundBottomStart].timestamp,
        },
        {
          index: lowestPoint,
          type: 'valley',
          price: roundingBottomPrice,
          date: data[lowestPoint].timestamp,
        },
        {
          index: roundBottomEnd,
          type: 'peak',
          price: roundingEndPrice,
          date: data[roundBottomEnd].timestamp,
        },
      ];

      // 计算颈线（取两侧高点中的较高者）
      const necklinePrice = Math.max(roundingStartPrice, roundingEndPrice);

      // 检查当前状态
      const currentPrice = data[data.length - 1].close;
      let status = PatternStatus.Forming;

      if (roundBottomEnd < data.length - 1) {
        if (currentPrice > necklinePrice) {
          status = PatternStatus.Confirmed; // 已突破颈线
        } else {
          status = PatternStatus.Completed; // 形态完成但未突破
        }
      }

      // 价格目标（向上突破的目标，通常是形态高度加到颈线上）
      const priceTarget = necklinePrice + roundingHeight;

      // 计算可靠性
      const reliability = calculateRoundingPatternReliability(
        data,
        roundBottomStart,
        lowestPoint,
        roundBottomEnd,
        roundingHeight,
        true, // 是圆底
        status === PatternStatus.Confirmed
      );

      patterns.push({
        patternType: PatternType.RoundingBottom,
        status,
        direction: PatternDirection.Bullish,
        reliability,
        significance: reliability * (roundingHeight / currentPrice),
        component: {
          startIndex: roundBottomStart,
          endIndex: roundBottomEnd,
          keyPoints, // 现在包含关键点信息
          patternHeight: roundingHeight,
          breakoutLevel: necklinePrice,
          volumePattern: analyzeRoundingPatternVolume(
            data,
            roundBottomStart,
            lowestPoint,
            roundBottomEnd,
            true // 是圆底
          ),
        },
        priceTarget,
        stopLoss: roundingBottomPrice * 0.98, // 止损设在低点下方2%
        breakoutExpected: status === PatternStatus.Completed,
        breakoutDirection: PatternDirection.Bullish,
        probableBreakoutZone: [necklinePrice * 0.99, necklinePrice * 1.02],
        description: `圆底形态, ${getStatusDescription(status)}, 形态高度: ${roundingHeight.toFixed(2)}, 颈线位置在 ${necklinePrice.toFixed(2)}`,
        tradingImplication: `看涨信号, 目标价位: ${priceTarget.toFixed(2)}, 止损位: ${(roundingBottomPrice * 0.98).toFixed(2)}`,
        keyDates,
        keyPrices,
      });
    }
  }

  // 检测圆顶形态 (看跌)
  // 重置平滑价格数组并重新计算
  const smoothedPricesTop = [];
  for (let i = smoothingPeriod - 1; i < recentData.length; i++) {
    const avgPrice =
      recentData
        .slice(i - (smoothingPeriod - 1), i + 1)
        .reduce((sum, d) => sum + d.close, 0) / smoothingPeriod;
    smoothedPricesTop.push(avgPrice);
  }

  // 寻找最高点
  let maxPrice = -Number.MAX_VALUE;
  let maxIndex = -1;

  for (let i = 0; i < smoothedPricesTop.length; i++) {
    if (smoothedPricesTop[i] > maxPrice) {
      maxPrice = smoothedPricesTop[i];
      maxIndex = i;
    }
  }

  // 如果最高点不在序列的开始或结束附近
  if (
    maxIndex > smoothedPricesTop.length * 0.2 &&
    maxIndex < smoothedPricesTop.length * 0.8
  ) {
    // 检查左侧是否上升（价格应该从低到高）
    let leftSideRising = true;
    for (let i = 1; i <= Math.min(10, maxIndex); i++) {
      // 如果前一个价格高于后一个价格，则不是上升趋势
      if (
        smoothedPricesTop[maxIndex - i] > smoothedPricesTop[maxIndex - i + 1]
      ) {
        leftSideRising = false;
        break;
      }
    }

    // 检查右侧是否下降（价格应该从高到低）
    let rightSideFalling = true;
    for (
      let i = 1;
      i <= Math.min(10, smoothedPricesTop.length - maxIndex - 1);
      i++
    ) {
      // 如果后一个价格高于前一个价格，则不是下降趋势
      if (
        smoothedPricesTop[maxIndex + i] > smoothedPricesTop[maxIndex + i - 1]
      ) {
        rightSideFalling = false;
        break;
      }
    }

    if (leftSideRising && rightSideFalling) {
      // 找到一个潜在的圆顶形态
      const keyDates: Date[] = [];
      const keyPrices: number[] = [];

      // 确定形态的开始、高点和结束位置
      const roundTopStart =
        data.length - lookbackPeriod + Math.max(0, maxIndex - 10);
      const highestPoint = data.length - lookbackPeriod + maxIndex;
      const roundTopEnd = Math.min(
        data.length - 1,
        data.length - lookbackPeriod + maxIndex + 10
      );

      // 计算形态特性
      const roundingStartPrice = data[roundTopStart].close;
      const roundingTopPrice = data[highestPoint].high;
      const roundingEndPrice = data[roundTopEnd].close;
      const roundingHeight =
        roundingTopPrice - Math.max(roundingStartPrice, roundingEndPrice);

      // 收集关键点信息
      keyDates.push(data[roundTopStart].timestamp);
      keyDates.push(data[highestPoint].timestamp);
      keyDates.push(data[roundTopEnd].timestamp);

      keyPrices.push(data[roundTopStart].close);
      keyPrices.push(data[highestPoint].high);
      keyPrices.push(data[roundTopEnd].close);

      // 定义关键点对象数组
      const keyPoints: PeakValley[] = [
        {
          index: roundTopStart,
          type: 'valley',
          price: roundingStartPrice,
          date: data[roundTopStart].timestamp,
        },
        {
          index: highestPoint,
          type: 'peak',
          price: roundingTopPrice,
          date: data[highestPoint].timestamp,
        },
        {
          index: roundTopEnd,
          type: 'valley',
          price: roundingEndPrice,
          date: data[roundTopEnd].timestamp,
        },
      ];

      // 计算颈线（取两侧低点中的较低者）
      const necklinePrice = Math.min(roundingStartPrice, roundingEndPrice);

      // 检查当前状态
      const currentPrice = data[data.length - 1].close;
      let status = PatternStatus.Forming;

      if (roundTopEnd < data.length - 1) {
        if (currentPrice < necklinePrice) {
          status = PatternStatus.Confirmed; // 已突破颈线
        } else {
          status = PatternStatus.Completed; // 形态完成但未突破
        }
      }

      // 价格目标（向下突破的目标，通常是形态高度从颈线减去）
      const priceTarget = necklinePrice - roundingHeight;

      // 计算可靠性
      const reliability = calculateRoundingPatternReliability(
        data,
        roundTopStart,
        highestPoint,
        roundTopEnd,
        roundingHeight,
        false, // 是圆顶
        status === PatternStatus.Confirmed
      );

      patterns.push({
        patternType: PatternType.RoundingTop,
        status,
        direction: PatternDirection.Bearish,
        reliability,
        significance: reliability * (roundingHeight / currentPrice),
        component: {
          startIndex: roundTopStart,
          endIndex: roundTopEnd,
          keyPoints, // 现在包含关键点信息
          patternHeight: roundingHeight,
          breakoutLevel: necklinePrice,
          volumePattern: analyzeRoundingPatternVolume(
            data,
            roundTopStart,
            highestPoint,
            roundTopEnd,
            false // 是圆顶
          ),
        },
        priceTarget,
        stopLoss: roundingTopPrice * 1.02, // 止损设在高点上方2%
        breakoutExpected: status === PatternStatus.Completed,
        breakoutDirection: PatternDirection.Bearish,
        probableBreakoutZone: [necklinePrice * 0.98, necklinePrice * 1.01],
        description: `圆顶形态, ${getStatusDescription(status)}, 形态高度: ${roundingHeight.toFixed(2)}, 颈线位置在 ${necklinePrice.toFixed(2)}`,
        tradingImplication: `看跌信号, 目标价位: ${priceTarget.toFixed(2)}, 止损位: ${(roundingTopPrice * 1.02).toFixed(2)}`,
        keyDates,
        keyPrices,
      });
    }
  }

  return patterns;
}

/**
 * 计算圆底/圆顶形态的可靠性
 */
function calculateRoundingPatternReliability(
  data: Candle[],
  startIndex: number,
  peakValleyIndex: number,
  endIndex: number,
  patternHeight: number,
  isRoundingBottom: boolean,
  isBreakoutConfirmed: boolean
): number {
  let score = 50; // 初始可靠性分数

  // 1. 形态持续时间
  const duration = endIndex - startIndex;
  if (duration > 30)
    score += 15; // 持续时间较长
  else if (duration > 15)
    score += 10; // 持续时间中等
  else score += 5; // 持续时间较短

  // 2. 形态高度（相对于价格的百分比）
  const avgPrice =
    data.slice(startIndex, endIndex + 1).reduce((sum, d) => sum + d.close, 0) /
    (endIndex - startIndex + 1);
  const heightRatio = patternHeight / avgPrice;

  if (heightRatio > 0.1)
    score += 10; // 形态高度明显
  else if (heightRatio > 0.05) score += 5; // 形态高度适中

  // 3. 形态对称性
  const leftSideDuration = peakValleyIndex - startIndex;
  const rightSideDuration = endIndex - peakValleyIndex;
  const symmetryRatio =
    Math.min(leftSideDuration, rightSideDuration) /
    Math.max(leftSideDuration, rightSideDuration);

  if (symmetryRatio > 0.8)
    score += 15; // 高度对称
  else if (symmetryRatio > 0.6)
    score += 10; // 中等对称
  else score += 5; // 较低对称

  // 4. 确认突破
  if (isBreakoutConfirmed) score += 15;

  // 最后确保分数在0-100范围内
  return Math.max(0, Math.min(100, score));
}

/**
 * 分析圆底/圆顶形态的成交量特征
 */
function analyzeRoundingPatternVolume(
  data: Candle[],
  startIndex: number,
  peakValleyIndex: number,
  endIndex: number,
  isRoundingBottom: boolean
): string {
  // 计算左侧成交量
  const leftSideVolumes = data
    .slice(startIndex, peakValleyIndex + 1)
    .map(d => d.volume);
  const avgLeftSideVolume =
    leftSideVolumes.reduce((sum, v) => sum + v, 0) / leftSideVolumes.length;

  // 计算右侧成交量
  const rightSideVolumes = data
    .slice(peakValleyIndex, endIndex + 1)
    .map(d => d.volume);
  const avgRightSideVolume =
    rightSideVolumes.reduce((sum, v) => sum + v, 0) / rightSideVolumes.length;

  // 检查突破时的成交量
  let breakoutVolume = 0;
  if (endIndex + 1 < data.length) {
    breakoutVolume = data[endIndex + 1].volume;
  }

  if (isRoundingBottom) {
    // 圆底理想的成交量模式：左侧成交量递减，底部成交量低，右侧成交量递增
    if (avgRightSideVolume > avgLeftSideVolume * 1.3) {
      if (breakoutVolume > avgRightSideVolume * 1.5) {
        return '理想的成交量模式：右侧成交量明显大于左侧，突破时成交量放大';
      } else {
        return '良好的成交量模式：右侧成交量大于左侧';
      }
    } else if (avgRightSideVolume > avgLeftSideVolume) {
      return '可接受的成交量模式：右侧成交量略大于左侧';
    } else {
      return '非理想的成交量模式：右侧成交量未能明显放大，降低形态可靠性';
    }
  } else {
    // 圆顶理想的成交量模式：左侧成交量递增，顶部成交量高，右侧成交量递减
    if (avgRightSideVolume < avgLeftSideVolume * 0.7) {
      if (breakoutVolume > avgRightSideVolume * 1.3) {
        return '理想的成交量模式：右侧成交量明显小于左侧，突破时成交量放大';
      } else {
        return '良好的成交量模式：右侧成交量小于左侧';
      }
    } else if (avgRightSideVolume < avgLeftSideVolume) {
      return '可接受的成交量模式：右侧成交量略小于左侧';
    } else {
      return '非理想的成交量模式：右侧成交量未能明显萎缩，降低形态可靠性';
    }
  }
}
