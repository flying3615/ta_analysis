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
 * 买入高潮形态枚举，添加到PatternType枚举中
 */
// 在实际使用时，请在PatternType枚举中添加这个类型
// enum PatternType {
//   ...
//   BuyingClimax = 'buying_climax',
// }

/**
 * 寻找买入高潮信号
 * 买入高潮可以出现在顶部或底部，具有不同的交易含义：
 *
 * 顶部买入高潮（看跌）特征：
 * 1. 成交量突然放大（通常是近期平均成交量的2倍以上）
 * 2. 价格创出近期新高
 * 3. 当日振幅较大（通常大于平均振幅的1.5倍）
 * 4. K线通常是大阳线或上影线明显的十字星
 * 5. 之后通常伴随价格回落
 *
 * 底部买入高潮（看涨）特征：
 * 1. 成交量突然放大（通常是近期平均成交量的2倍以上）
 * 2. 价格在下跌趋势中出现大幅反弹
 * 3. 当日振幅较大（通常大于平均振幅的1.5倍）
 * 4. K线通常是大阳线，表明强力买入
 * 5. 之前有明显的下跌趋势
 * 6. 之后通常伴随价格继续上涨
 *
 * @param data K线数据
 * @param peaksValleys 峰谷点
 * @param lookbackPeriod 回溯周期
 * @returns 检测到的买入高潮形态
 */
export function findBuyingClimax(
  data: Candle[],
  peaksValleys: PeakValley[],
  lookbackPeriod: number = 30
): PatternAnalysisResult[] {
  const patterns: PatternAnalysisResult[] = [];

  // 确保有足够的数据
  if (data.length < lookbackPeriod + 5) {
    return patterns;
  }

  // 计算近期的平均成交量
  const recentData = data.slice(-lookbackPeriod);
  const avgVolume =
    recentData.reduce((sum, candle) => sum + candle.volume, 0) /
    recentData.length;

  // 计算近期的平均振幅
  const avgRange =
    recentData.reduce(
      (sum, candle) => sum + (candle.high - candle.low) / candle.low,
      0
    ) / recentData.length;

  // 从最近的数据开始分析，但排除最后一根K线（可能未完成）
  for (let i = data.length - 2; i >= data.length - lookbackPeriod; i--) {
    const currentCandle = data[i];

    // 判断之前的趋势方向（用于区分顶部和底部买入高潮）
    const previousCandles = data.slice(Math.max(0, i - 20), i);
    const downTrendCount = previousCandles.filter(c => c.close < c.open).length;
    const upTrendCount = previousCandles.filter(c => c.close > c.open).length;

    // 如果下跌K线数量明显多于上涨K线，则认为是在下跌趋势中
    const isInDowntrend = downTrendCount > upTrendCount * 1.5;

    // 找出之前的高点和低点
    const previousHighs = data
      .slice(Math.max(0, i - lookbackPeriod), i)
      .map(c => c.high);
    const recentHigh = Math.max(...previousHighs);

    const previousLows = data
      .slice(Math.max(0, i - lookbackPeriod), i)
      .map(c => c.low);
    const recentLow = Math.min(...previousLows);

    // 条件1: 成交量是近期平均的2倍以上（两种情况都需要）
    const volumeCondition = currentCandle.volume > avgVolume * 2;

    // 条件2: 价格条件（顶部和底部买入高潮的条件不同）
    // 顶部买入高潮：价格创出近期新高或接近新高
    const topHighPriceCondition = currentCandle.high >= recentHigh * 0.98;

    // 底部买入高潮：价格从近期低点反弹明显（至少5%以上）
    const priceReboundPercent = (currentCandle.high - recentLow) / recentLow;
    const bottomReboundCondition = priceReboundPercent > 0.05 && isInDowntrend;

    // 条件3: 当日振幅较大（两种情况都需要）
    const range = (currentCandle.high - currentCandle.low) / currentCandle.low;
    const rangeCondition = range > avgRange * 1.5;

    // 条件4: K线形态
    // 4.1 大阳线: 收盘价明显高于开盘价(至少3%的涨幅)
    const bigBullishCandle =
      (currentCandle.close - currentCandle.open) / currentCandle.open > 0.03;

    // 4.2 上影线明显的十字星：实体小，上影线长（主要用于顶部买入高潮）
    const upperShadow =
      currentCandle.high - Math.max(currentCandle.open, currentCandle.close);
    const body = Math.abs(currentCandle.close - currentCandle.open);
    const dojiWithUpperShadow =
      body / currentCandle.open < 0.01 && upperShadow > body * 2;

    // 顶部买入高潮的K线形态条件
    const topCandlePatternCondition = bigBullishCandle || dojiWithUpperShadow;

    // 底部买入高潮的K线形态条件（主要是大阳线，表示强力买入）
    const bottomCandlePatternCondition = bigBullishCandle;

    // 条件5: 后续价格走势检查
    let topReversalCondition = false;
    let bottomContinuationCondition = false;

    if (i < data.length - 1) {
      const nextCandle = data[i + 1];

      // 顶部买入高潮：之后价格回落
      topReversalCondition =
        nextCandle.close < nextCandle.open &&
        ((nextCandle.open - nextCandle.close) / nextCandle.open > 0.01 ||
          (currentCandle.close > currentCandle.open &&
            nextCandle.open - nextCandle.close >
              (currentCandle.close - currentCandle.open) * 0.5));

      // 底部买入高潮：之后价格继续上涨
      bottomContinuationCondition =
        nextCandle.close > nextCandle.open &&
        (nextCandle.close - nextCandle.open) / nextCandle.open > 0.01;
    }

    // 综合所有条件，确定是否存在顶部买入高潮
    const isTopBuyingClimax =
      volumeCondition &&
      topHighPriceCondition &&
      rangeCondition &&
      topCandlePatternCondition &&
      !isInDowntrend;

    // 综合所有条件，确定是否存在底部买入高潮
    const isBottomBuyingClimax =
      volumeCondition &&
      bottomReboundCondition &&
      rangeCondition &&
      bottomCandlePatternCondition &&
      isInDowntrend;

    // 如果检测到任一类型的买入高潮
    if (isTopBuyingClimax || isBottomBuyingClimax) {
      // 确定形态状态
      let status = PatternStatus.Forming;

      // 根据买入高潮类型选择相应的条件
      const isTopPattern = isTopBuyingClimax;
      const isBottomPattern = isBottomBuyingClimax;

      if (isTopPattern && topReversalCondition && i < data.length - 2) {
        // 顶部买入高潮：如果后续确实出现了下跌，则确认
        const furtherReversal = data
          .slice(i + 1, Math.min(i + 6, data.length))
          .some(c => c.close < data[i].low);

        if (furtherReversal) {
          status = PatternStatus.Confirmed;
        } else {
          status = PatternStatus.Completed;
        }
      } else if (
        isBottomPattern &&
        bottomContinuationCondition &&
        i < data.length - 2
      ) {
        // 底部买入高潮：如果后续确实出现了上涨，则确认
        const furtherContinuation = data
          .slice(i + 1, Math.min(i + 6, data.length))
          .some(c => c.close > data[i].high);

        if (furtherContinuation) {
          status = PatternStatus.Confirmed;
        } else {
          status = PatternStatus.Completed;
        }
      }

      // 检查形态是否失败
      if (status === PatternStatus.Confirmed && i < data.length - 5) {
        const laterPrices = data.slice(i + 1, Math.min(i + 10, data.length));
        if (
          isTopPattern &&
          laterPrices.some(c => c.high > currentCandle.high)
        ) {
          // 顶部买入高潮：价格回升到高点以上，则形态失败
          status = PatternStatus.Failed;
        } else if (
          isBottomPattern &&
          laterPrices.some(c => c.low < currentCandle.low)
        ) {
          // 底部买入高潮：价格跌破低点，则形态失败
          status = PatternStatus.Failed;
        }
      }

      // 计算形态的可靠性得分
      const reliability = calculateBuyingClimaxReliability(
        data,
        i,
        volumeCondition,
        isTopPattern ? topHighPriceCondition : bottomReboundCondition,
        rangeCondition,
        isTopPattern ? topCandlePatternCondition : bottomCandlePatternCondition,
        isTopPattern ? topReversalCondition : bottomContinuationCondition,
        status,
        isInDowntrend
      );

      // 计算形态的重要性（结合可靠性和价格波动幅度）
      const significance = reliability * (range / avgRange) * 0.8;

      // 分析成交量特征
      const volumePattern = analyzeBuyingClimaxVolume(
        data.slice(Math.max(0, i - 10), Math.min(i + 5, data.length)),
        i - Math.max(0, i - 10),
        isBottomPattern
      );

      // 根据形态类型计算不同的价格目标和关键点
      let priceTarget, stopLoss, probableBreakoutZone;
      let keyPoint1, keyPoint2;
      let patternHeight, breakoutLevel;
      let description, tradingImplication;

      if (isTopPattern) {
        // 顶部买入高潮：计算下跌目标
        const supportLevel = Math.min(...previousLows);
        const priceMoveUp = currentCandle.high - supportLevel;
        priceTarget = currentCandle.high - priceMoveUp * 0.618;
        stopLoss = currentCandle.high * 1.03; // 止损位：高点再上方一点
        probableBreakoutZone = [supportLevel * 0.95, supportLevel * 1.05];

        keyPoint1 = {
          index: i,
          price: currentCandle.high,
          date: currentCandle.timestamp,
          type: 'peak',
        };
        keyPoint2 = {
          index: Math.max(0, i - lookbackPeriod),
          price: supportLevel,
          date: data[Math.max(0, i - lookbackPeriod)].timestamp,
          type: 'valley',
        };

        patternHeight = currentCandle.high - supportLevel;
        breakoutLevel = supportLevel; // 突破支撑位确认看跌

        description = `顶部买入高潮, ${getStatusDescription(status)}, 高点在 ${currentCandle.high.toFixed(2)}, 支撑位在 ${supportLevel.toFixed(2)}`;
        tradingImplication = `看跌信号, 预计回撤目标: ${priceTarget.toFixed(2)}, 止损位: ${stopLoss.toFixed(2)}`;
      } else {
        // 底部买入高潮：计算上涨目标
        const resistanceLevel = Math.max(...previousHighs);
        const priceMoveDown = resistanceLevel - currentCandle.low;
        priceTarget = currentCandle.low + priceMoveDown * 0.618;
        stopLoss = currentCandle.low * 0.97; // 止损位：低点再下方一点
        probableBreakoutZone = [resistanceLevel * 0.95, resistanceLevel * 1.05];

        keyPoint1 = {
          index: i,
          price: currentCandle.low,
          date: currentCandle.timestamp,
          type: 'valley',
        };
        keyPoint2 = {
          index: Math.max(0, i - lookbackPeriod),
          price: resistanceLevel,
          date: data[Math.max(0, i - lookbackPeriod)].timestamp,
          type: 'peak',
        };

        patternHeight = resistanceLevel - currentCandle.low;
        breakoutLevel = resistanceLevel; // 突破阻力位确认看涨

        description = `底部买入高潮, ${getStatusDescription(status)}, 低点在 ${currentCandle.low.toFixed(2)}, 阻力位在 ${resistanceLevel.toFixed(2)}`;
        tradingImplication = `看涨信号, 预计上涨目标: ${priceTarget.toFixed(2)}, 止损位: ${stopLoss.toFixed(2)}`;
      }

      // 添加到检测到的形态列表
      patterns.push({
        patternType: PatternType.BuyingClimax,
        status,
        direction: isTopPattern
          ? PatternDirection.Bearish
          : PatternDirection.Bullish,
        reliability,
        significance,
        component: {
          startIndex: Math.max(0, i - 5), // 形态前几根K线
          endIndex: i, // 当前K线是形态的结束点
          keyPoints: [keyPoint1, keyPoint2],
          patternHeight,
          breakoutLevel,
          volumePattern,
        },
        priceTarget,
        stopLoss,
        breakoutExpected: status === PatternStatus.Completed,
        breakoutDirection: isTopPattern
          ? PatternDirection.Bearish
          : PatternDirection.Bullish,
        probableBreakoutZone,
        description,
        tradingImplication,
        keyDates: [
          data[Math.max(0, i - lookbackPeriod)].timestamp,
          currentCandle.timestamp,
        ],
        keyPrices: isTopPattern
          ? [keyPoint2.price, keyPoint1.price]
          : [keyPoint1.price, keyPoint2.price],
      });
    }
  }

  return patterns;
}

/**
 * 计算买入高潮形态的可靠性
 * @param data
 * @param climaxIndex
 * @param volumeCondition
 * @param highPriceCondition
 * @param rangeCondition
 * @param candlePatternCondition
 * @param reversalCondition
 * @param status
 * @param isInDowntrend 是否在下跌趋势中（用于区分顶部和底部买入高潮）
 */
function calculateBuyingClimaxReliability(
  data: Candle[],
  climaxIndex: number,
  volumeCondition: boolean,
  highPriceCondition: boolean,
  rangeCondition: boolean,
  candlePatternCondition: boolean,
  reversalCondition: boolean,
  status: PatternStatus,
  isInDowntrend: boolean
): number {
  let score = 50; // 初始可靠性分数

  // 1. 成交量条件
  if (volumeCondition) {
    const currentCandle = data[climaxIndex];
    const avgVolume =
      data
        .slice(Math.max(0, climaxIndex - 20), climaxIndex)
        .reduce((sum, c) => sum + c.volume, 0) / Math.min(20, climaxIndex);

    // 成交量越大，可靠性越高
    const volumeRatio = currentCandle.volume / avgVolume;
    if (volumeRatio > 5) score += 15;
    else if (volumeRatio > 3) score += 10;
    else if (volumeRatio > 2) score += 5;
  }

  // 2. 价格创新高条件
  if (highPriceCondition) {
    score += 10;

    // 如果是明显突破前高，额外加分
    const currentCandle = data[climaxIndex];
    const previousHighs = data
      .slice(Math.max(0, climaxIndex - 30), climaxIndex)
      .map(c => c.high);
    const recentHigh = Math.max(...previousHighs);

    if (currentCandle.high > recentHigh * 1.03) {
      score += 5; // 明显突破前高
    }
  }

  // 3. 振幅条件
  if (rangeCondition) {
    score += 10;
  }

  // 4. K线形态条件
  if (candlePatternCondition) {
    score += 10;

    // 检查是否是大阳线
    const currentCandle = data[climaxIndex];
    if (
      (currentCandle.close - currentCandle.open) / currentCandle.open >
      0.05
    ) {
      score += 5; // 大阳线加分
    }
  }

  // 5. 反转确认条件
  if (reversalCondition) {
    score += 15;
  }

  // 6. 形态状态
  if (status === PatternStatus.Confirmed) {
    score += 15;
  } else if (status === PatternStatus.Completed) {
    score += 5;
  } else if (status === PatternStatus.Failed) {
    score -= 25;
  }

  // 7. 根据趋势环境调整评分
  if (isInDowntrend) {
    // 底部买入高潮：检查之前的跌势持续性
    if (climaxIndex > 10) {
      let downTrendCount = 0;
      for (let i = climaxIndex - 10; i < climaxIndex; i++) {
        if (data[i].close < data[i].open) {
          downTrendCount++;
        }
      }

      // 如果之前有强势下跌趋势，底部买入高潮更可靠
      if (downTrendCount >= 7) {
        score += 15; // 底部买入高潮在强势下跌后更可靠
      } else if (downTrendCount >= 5) {
        score += 10;
      }
    }

    // 检查超卖因素（简化版，实际中应使用正式的RSI计算）
    if (climaxIndex > 14) {
      let upMove = 0;
      let downMove = 0;
      for (let i = climaxIndex - 14; i < climaxIndex; i++) {
        const change = data[i].close - data[i - 1].close;
        if (change > 0) {
          upMove += change;
        } else {
          downMove -= change;
        }
      }

      // 简化的RSI计算
      const rs = upMove / (downMove === 0 ? 1 : downMove);
      const rsi = 100 - 100 / (1 + rs);

      // RSI低于30表示超卖，增加底部买入高潮可靠性
      if (rsi < 30) {
        score += 15;
      } else if (rsi < 40) {
        score += 10;
      }
    }
  } else {
    // 顶部买入高潮：检查之前的涨势持续性
    if (climaxIndex > 10) {
      let upTrendCount = 0;
      for (let i = climaxIndex - 10; i < climaxIndex; i++) {
        if (data[i].close > data[i].open) {
          upTrendCount++;
        }
      }

      // 如果之前有强势上涨趋势，顶部买入高潮更可靠
      if (upTrendCount >= 7) {
        score += 10;
      } else if (upTrendCount >= 5) {
        score += 5;
      }
    }

    // 检查FOMO因素：连续大阳线
    if (climaxIndex > 3) {
      let consecutiveBullish = 0;
      for (let i = climaxIndex - 3; i < climaxIndex; i++) {
        if (
          data[i].close > data[i].open &&
          (data[i].close - data[i].open) / data[i].open > 0.02
        ) {
          consecutiveBullish++;
        } else {
          consecutiveBullish = 0;
        }
      }

      if (consecutiveBullish >= 2) {
        score += 10; // 连续大阳线表明FOMO情绪，顶部买入高潮更可能出现
      }
    }
  }

  // 确保分数在0-100范围内
  return Math.max(0, Math.min(100, score));
}

/**
 * 分析买入高潮的成交量特征
 * @param isBottomPattern 是否是底部买入高潮
 */
function analyzeBuyingClimaxVolume(
  data: Candle[],
  climaxIndex: number,
  isBottomPattern: boolean = false
): string {
  const beforeClimax = data.slice(0, climaxIndex);
  const climaxCandle = data[climaxIndex];
  const afterClimax = data.slice(climaxIndex + 1);

  // 计算高潮前的平均成交量
  const avgVolumeBefore =
    beforeClimax.length > 0
      ? beforeClimax.reduce((sum, c) => sum + c.volume, 0) / beforeClimax.length
      : 0;

  // 计算高潮后的平均成交量
  const avgVolumeAfter =
    afterClimax.length > 0
      ? afterClimax.reduce((sum, c) => sum + c.volume, 0) / afterClimax.length
      : 0;

  // 高潮K线的成交量比例
  const climaxVolumeRatio =
    avgVolumeBefore > 0 ? climaxCandle.volume / avgVolumeBefore : 0;

  // 高潮后的成交量变化比例
  const afterVolumeRatio =
    avgVolumeBefore > 0 ? avgVolumeAfter / avgVolumeBefore : 0;

  // 生成成交量特征描述
  let volumeDescription = '';

  if (climaxVolumeRatio > 5) {
    volumeDescription =
      '极端成交量爆发，成交量是之前平均水平的' +
      climaxVolumeRatio.toFixed(1) +
      '倍';
  } else if (climaxVolumeRatio > 3) {
    volumeDescription =
      '显著成交量放大，成交量是之前平均水平的' +
      climaxVolumeRatio.toFixed(1) +
      '倍';
  } else if (climaxVolumeRatio > 2) {
    volumeDescription =
      '明显成交量增加，成交量是之前平均水平的' +
      climaxVolumeRatio.toFixed(1) +
      '倍';
  } else {
    volumeDescription =
      '成交量略有增加，成交量是之前平均水平的' +
      climaxVolumeRatio.toFixed(1) +
      '倍';
  }

  // 根据是否是底部买入高潮添加不同的描述
  if (isBottomPattern) {
    // 底部买入高潮的成交量特征描述
    volumeDescription += '，表明强力买盘进场';
  } else {
    // 顶部买入高潮的成交量特征描述
    volumeDescription += '，可能表明买盘力量即将耗尽';
  }

  // 添加高潮后的成交量变化描述
  if (afterClimax.length > 0) {
    if (isBottomPattern) {
      // 底部买入高潮后的成交量变化描述
      if (afterVolumeRatio < 0.5) {
        volumeDescription += '，之后成交量减少但价格上涨，表明卖盘力量减弱';
      } else if (afterVolumeRatio < 0.8) {
        volumeDescription += '，之后成交量略有减少，市场情绪逐渐稳定';
      } else if (afterVolumeRatio < 1.2) {
        volumeDescription += '，之后成交量保持稳定，支撑上涨趋势';
      } else {
        volumeDescription += '，之后成交量继续放大，表明上涨趋势可能加速';
      }
    } else {
      // 顶部买入高潮后的成交量变化描述
      if (afterVolumeRatio < 0.5) {
        volumeDescription += '，之后成交量显著萎缩，暗示买盘力量耗尽';
      } else if (afterVolumeRatio < 0.8) {
        volumeDescription += '，之后成交量明显减少，买盘力量减弱';
      } else if (afterVolumeRatio < 1.2) {
        volumeDescription += '，之后成交量保持在相似水平，市场仍有分歧';
      } else {
        volumeDescription +=
          '，之后成交量继续放大，可能表明趋势尚未结束，需谨慎判断';
      }
    }
  }

  return volumeDescription;
}
