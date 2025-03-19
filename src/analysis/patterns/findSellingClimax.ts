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
 * 寻找卖出高潮信号
 * 卖出高潮通常具有以下特征：
 * 1. 成交量突然放大（通常是近期平均成交量的2倍以上）
 * 2. 价格跌至近期新低
 * 3. 当日振幅较大（通常大于平均振幅的1.5倍）
 * 4. K线通常是大阴线或下影线明显的十字星（锤子线）
 * 5. 之后通常伴随价格反弹
 *
 * @param data K线数据
 * @param peaksValleys 峰谷点
 * @param lookbackPeriod 回溯周期
 * @returns 检测到的卖出高潮形态
 */
export function findSellingClimax(
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

    // 找出之前的低点
    const previousLows = data
      .slice(Math.max(0, i - lookbackPeriod), i)
      .map(c => c.low);
    const recentLow = Math.min(...previousLows);

    // 条件1: 成交量是近期平均的2倍以上
    const volumeCondition = currentCandle.volume > avgVolume * 2;

    // 条件2: 价格创出近期新低或接近新低(102%以内)
    const lowPriceCondition = currentCandle.low <= recentLow * 1.02;

    // 条件3: 当日振幅较大
    const range = (currentCandle.high - currentCandle.low) / currentCandle.low;
    const rangeCondition = range > avgRange * 1.5;

    // 条件4: K线形态
    // 4.1 大阴线: 收盘价明显低于开盘价(至少3%的跌幅)
    const bigBearishCandle =
      (currentCandle.open - currentCandle.close) / currentCandle.open > 0.03;

    // 4.2 下影线明显的十字星（锤子线）：实体小，下影线长
    const lowerShadow =
      Math.min(currentCandle.open, currentCandle.close) - currentCandle.low;
    const body = Math.abs(currentCandle.close - currentCandle.open);
    const hammerWithLowerShadow =
      body / currentCandle.open < 0.01 && lowerShadow > body * 2;

    const candlePatternCondition = bigBearishCandle || hammerWithLowerShadow;

    // 条件5: 之后的反转检查（至少1根K线的数据）
    let reversalCondition = false;
    if (i < data.length - 1) {
      const nextCandle = data[i + 1];

      // 如果下一根K线是阳线且涨幅明显，或者上涨幅度超过当前K线下跌幅度的一半
      reversalCondition =
        nextCandle.close > nextCandle.open &&
        ((nextCandle.close - nextCandle.open) / nextCandle.open > 0.01 ||
          (currentCandle.open > currentCandle.close &&
            nextCandle.close - nextCandle.open >
              (currentCandle.open - currentCandle.close) * 0.5));
    }

    // 综合所有条件，确定是否存在卖出高潮
    if (
      volumeCondition &&
      lowPriceCondition &&
      rangeCondition &&
      candlePatternCondition
    ) {
      // 确定形态状态
      let status = PatternStatus.Forming;
      if (reversalCondition && i < data.length - 2) {
        // 如果后续确实出现了上涨，则确认
        const furtherReversal = data
          .slice(i + 1, Math.min(i + 6, data.length))
          .some(c => c.close > data[i].high);

        if (furtherReversal) {
          status = PatternStatus.Confirmed;
        } else {
          status = PatternStatus.Completed;
        }
      }

      // 如果形态已经被确认，但后来价格又回落到低点以下，则形态失败
      if (status === PatternStatus.Confirmed && i < data.length - 5) {
        const laterPrices = data.slice(i + 1, Math.min(i + 10, data.length));
        if (laterPrices.some(c => c.low < currentCandle.low)) {
          status = PatternStatus.Failed;
        }
      }

      // 计算形态的可靠性得分
      const reliability = calculateSellingClimaxReliability(
        data,
        i,
        volumeCondition,
        lowPriceCondition,
        rangeCondition,
        candlePatternCondition,
        reversalCondition,
        status
      );

      // 计算形态的重要性（结合可靠性和价格波动幅度）
      const significance = reliability * (range / avgRange) * 0.8;

      // 分析成交量特征
      const volumePattern = analyzeSellingClimaxVolume(
        data.slice(Math.max(0, i - 10), Math.min(i + 5, data.length)),
        i - Math.max(0, i - 10)
      );

      // 计算价格目标（通常是反弹到形态前的阻力位或前期高点）
      const previousHighs = data
        .slice(Math.max(0, i - lookbackPeriod), i)
        .map(c => c.high);
      const resistanceLevel = Math.max(...previousHighs);

      // 价格目标：以当前K线为基准，反弹幅度通常是下跌幅度的61.8%（斐波那契回调）
      const priceMoveDown = resistanceLevel - currentCandle.low;
      const priceTarget = currentCandle.low + priceMoveDown * 0.618;

      // 止损位：低点再下方一点，通常3-5%
      const stopLoss = currentCandle.low * 0.97;

      // 可能的突破区域：阻力位上下5%
      const probableBreakoutZone: [number, number] = [
        resistanceLevel * 0.95,
        resistanceLevel * 1.05,
      ];

      // 添加到检测到的形态列表
      patterns.push({
        patternType: PatternType.SellingClimax,
        status,
        direction: PatternDirection.Bullish, // 卖出高潮通常是看涨信号
        reliability,
        significance,
        component: {
          startIndex: Math.max(0, i - 5), // 形态前几根K线
          endIndex: i, // 当前K线是形态的结束点
          keyPoints: [
            {
              index: i,
              price: currentCandle.low,
              date: currentCandle.timestamp,
              type: 'valley',
            },
            {
              index: Math.max(0, i - lookbackPeriod),
              price: resistanceLevel,
              date: data[Math.max(0, i - lookbackPeriod)].timestamp,
              type: 'peak',
            },
          ],
          patternHeight: resistanceLevel - currentCandle.low,
          breakoutLevel: resistanceLevel, // 突破阻力位确认看涨
          volumePattern,
        },
        priceTarget,
        stopLoss,
        breakoutExpected: status === PatternStatus.Completed,
        breakoutDirection: PatternDirection.Bullish,
        probableBreakoutZone,
        description: `卖出高潮, ${getStatusDescription(status)}, 低点在 ${currentCandle.low.toFixed(2)}, 阻力位在 ${resistanceLevel.toFixed(2)}`,
        tradingImplication: `看涨信号, 预计反弹目标: ${priceTarget.toFixed(2)}, 止损位: ${stopLoss.toFixed(2)}`,
        keyDates: [
          data[Math.max(0, i - lookbackPeriod)].timestamp,
          currentCandle.timestamp,
        ],
        keyPrices: [currentCandle.low, resistanceLevel],
      });
    }
  }

  return patterns;
}

/**
 * 计算卖出高潮形态的可靠性
 */
function calculateSellingClimaxReliability(
  data: Candle[],
  climaxIndex: number,
  volumeCondition: boolean,
  lowPriceCondition: boolean,
  rangeCondition: boolean,
  candlePatternCondition: boolean,
  reversalCondition: boolean,
  status: PatternStatus
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

  // 2. 价格创新低条件
  if (lowPriceCondition) {
    score += 10;

    // 如果是明显突破前低，额外加分
    const currentCandle = data[climaxIndex];
    const previousLows = data
      .slice(Math.max(0, climaxIndex - 30), climaxIndex)
      .map(c => c.low);
    const recentLow = Math.min(...previousLows);

    if (currentCandle.low < recentLow * 0.97) {
      score += 5; // 明显突破前低
    }
  }

  // 3. 振幅条件
  if (rangeCondition) {
    score += 10;
  }

  // 4. K线形态条件
  if (candlePatternCondition) {
    score += 10;

    // 检查是否是大阴线
    const currentCandle = data[climaxIndex];
    if (
      (currentCandle.open - currentCandle.close) / currentCandle.open >
      0.05
    ) {
      score += 5; // 大阴线加分
    }

    // 检查是否是锤子线
    const lowerShadow =
      Math.min(currentCandle.open, currentCandle.close) - currentCandle.low;
    const body = Math.abs(currentCandle.close - currentCandle.open);
    if (body / currentCandle.open < 0.01 && lowerShadow > body * 2) {
      score += 10; // 锤子线加分更多，因为它是强烈的反转信号
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

  // 7. 额外检查：之前的跌势持续性
  if (climaxIndex > 10) {
    let downTrendCount = 0;
    for (let i = climaxIndex - 10; i < climaxIndex; i++) {
      if (data[i].close < data[i].open) {
        downTrendCount++;
      }
    }

    // 如果之前有强势下跌趋势，卖出高潮更可靠
    if (downTrendCount >= 7) {
      score += 10;
    } else if (downTrendCount >= 5) {
      score += 5;
    }
  }

  // 8. 检查恐慌因素：连续大阴线
  if (climaxIndex > 3) {
    let consecutiveBearish = 0;
    for (let i = climaxIndex - 3; i < climaxIndex; i++) {
      if (
        data[i].close < data[i].open &&
        (data[i].open - data[i].close) / data[i].open > 0.02
      ) {
        consecutiveBearish++;
      } else {
        consecutiveBearish = 0;
      }
    }

    if (consecutiveBearish >= 2) {
      score += 10; // 连续大阴线表明恐慌情绪，卖出高潮更可能出现
    }
  }

  // 9. RSI超卖检查（简化版，实际中应使用正式的RSI计算）
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

    // RSI低于30表示超卖，增加可靠性
    if (rsi < 30) {
      score += 10;
    } else if (rsi < 40) {
      score += 5;
    }
  }

  // 确保分数在0-100范围内
  return Math.max(0, Math.min(100, score));
}

/**
 * 分析卖出高潮的成交量特征
 */
function analyzeSellingClimaxVolume(
  data: Candle[],
  climaxIndex: number
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
      '倍，表明恐慌性抛售';
  } else if (climaxVolumeRatio > 3) {
    volumeDescription =
      '显著成交量放大，成交量是之前平均水平的' +
      climaxVolumeRatio.toFixed(1) +
      '倍，表明卖盘压力集中释放';
  } else if (climaxVolumeRatio > 2) {
    volumeDescription =
      '明显成交量增加，成交量是之前平均水平的' +
      climaxVolumeRatio.toFixed(1) +
      '倍，表明抛售加剧';
  } else {
    volumeDescription =
      '成交量略有增加，成交量是之前平均水平的' +
      climaxVolumeRatio.toFixed(1) +
      '倍';
  }

  // 添加高潮后的成交量变化描述
  if (afterClimax.length > 0) {
    if (afterVolumeRatio < 0.5) {
      volumeDescription +=
        '，之后成交量显著萎缩，暗示卖盘力量耗尽，适合逢低买入';
    } else if (afterVolumeRatio < 0.8) {
      volumeDescription += '，之后成交量明显减少，卖盘力量减弱';
    } else if (afterVolumeRatio < 1.2) {
      volumeDescription += '，之后成交量保持在相似水平，市场仍有分歧';
    } else {
      volumeDescription +=
        '，之后成交量继续放大，可能表明下跌趋势尚未结束，需谨慎判断';
    }
  }

  return volumeDescription;
}
