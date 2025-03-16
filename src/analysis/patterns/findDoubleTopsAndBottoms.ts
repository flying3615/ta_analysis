import { Candle } from '../../types.js';
import {
  PatternAnalysisResult,
  PatternDirection,
  PatternStatus,
  PatternType,
  PeakValley,
} from './analyzeMultiTimeframePatterns.js';

/**
 * 这里以双顶/双底形态为例，其他形态检测函数类似修改
 */
export function findDoubleTopsAndBottoms(
  data: Candle[],
  peaksValleys: PeakValley[],
  lookbackPeriod: number = 40
): PatternAnalysisResult[] {
  const patterns: PatternAnalysisResult[] = [];

  // 过滤出最近的峰谷
  const recentPoints = peaksValleys.filter(
    p => p.index >= data.length - lookbackPeriod
  );

  // 排序，确保按时间顺序
  recentPoints.sort((a, b) => a.index - b.index);

  // 分别检测峰和谷
  const peaks = recentPoints.filter(p => p.type === 'peak');
  const valleys = recentPoints.filter(p => p.type === 'valley');

  // 寻找双顶形态 - 从最近的峰开始检查
  for (let i = peaks.length - 2; i >= 0; i--) {
    const secondPeak = peaks[i + 1];
    const firstPeak = peaks[i];

    // 检查两个峰是否接近同一高度
    const heightDiff =
      Math.abs(firstPeak.price - secondPeak.price) / firstPeak.price;

    if (heightDiff < 0.05 && secondPeak.index - firstPeak.index > 5) {
      // 寻找中间的谷
      const middleValleys = valleys.filter(
        v => v.index > firstPeak.index && v.index < secondPeak.index
      );

      if (middleValleys.length > 0) {
        const neckline = middleValleys[0].price;

        // 获取双顶形态中的最高价格
        const highestPrice = Math.max(firstPeak.price, secondPeak.price);

        // 检查形态后的K线是否突破最高点（使形态无效）
        let isInvalid = false;
        if (secondPeak.index < data.length - 1) {
          for (let j = secondPeak.index + 1; j < data.length; j++) {
            if (data[j].high > highestPrice) {
              isInvalid = true;
              break;
            }
          }
        }

        // 如果形态无效，跳过此形态
        if (isInvalid) {
          continue;
        }

        // 检查当前是否已突破颈线
        const currentPrice = data[data.length - 1].close;
        let status = PatternStatus.Forming;

        if (secondPeak.index < data.length - 1) {
          status =
            currentPrice < neckline
              ? PatternStatus.Confirmed
              : PatternStatus.Completed;
        }

        // 计算形态高度
        const patternHeight =
          (firstPeak.price + secondPeak.price) / 2 - neckline;

        // 价格目标
        const priceTarget = neckline - patternHeight;

        // 可靠性评分
        const reliability = calculateDoubleTopBottomReliability(
          firstPeak,
          secondPeak,
          middleValleys[0],
          data,
          false
        );

        // 计算形态与当前位置的距离因子
        const recencyFactor = Math.exp(
          -0.03 * (data.length - 1 - secondPeak.index)
        );

        // 根据距离调整重要性
        const adjustedSignificance =
          reliability *
          (patternHeight / data[data.length - 1].close) *
          recencyFactor;

        patterns.push({
          patternType: PatternType.DoubleTop,
          status,
          direction: PatternDirection.Bearish,
          reliability,
          significance: adjustedSignificance,
          component: {
            startIndex: firstPeak.index,
            endIndex: secondPeak.index,
            keyPoints: [firstPeak, secondPeak, middleValleys[0]],
            patternHeight,
            breakoutLevel: neckline,
            volumePattern: analyzeDoubleTopBottomVolume(
              data,
              firstPeak.index,
              secondPeak.index,
              false
            ),
          },
          priceTarget,
          stopLoss: highestPrice,
          breakoutExpected: status === PatternStatus.Completed,
          breakoutDirection: PatternDirection.Bearish,
          probableBreakoutZone: [neckline * 0.98, neckline * 1.02],
          description: `双顶形态, ${status === PatternStatus.Confirmed ? '已确认突破颈线' : '正在形成中'}, 颈线位置在 ${neckline.toFixed(2)}`,
          tradingImplication: `看跌信号, 目标价位: ${priceTarget.toFixed(2)}, 止损位: ${highestPrice.toFixed(2)}`,
          keyDates: [firstPeak.date, middleValleys[0].date, secondPeak.date],
          keyPrices: [
            firstPeak.price,
            middleValleys[0].price,
            secondPeak.price,
          ],
        });

        // 找到第一个有效的双顶后就退出循环，优先考虑最近的形态
        break;
      }
    }
  }

  // 寻找双底形态 - 同样从最近的谷开始检查
  for (let i = valleys.length - 2; i >= 0; i--) {
    const secondValley = valleys[i + 1];
    const firstValley = valleys[i];

    // 检查两个谷是否接近同一低点
    const depthDiff =
      Math.abs(firstValley.price - secondValley.price) / firstValley.price;

    if (depthDiff < 0.05 && secondValley.index - firstValley.index > 5) {
      // 寻找中间的峰
      const middlePeaks = peaks.filter(
        p => p.index > firstValley.index && p.index < secondValley.index
      );

      if (middlePeaks.length > 0) {
        const neckline = middlePeaks[0].price;

        // 获取双底形态中的最低价格
        const lowestPrice = Math.min(firstValley.price, secondValley.price);

        // 检查形态后的K线是否突破最低点（使形态无效）
        let isInvalid = false;
        if (secondValley.index < data.length - 1) {
          for (let j = secondValley.index + 1; j < data.length; j++) {
            if (data[j].low < lowestPrice) {
              isInvalid = true;
              break;
            }
          }
        }

        // 如果形态无效，跳过此形态
        if (isInvalid) {
          continue;
        }

        // 检查当前是否已突破颈线
        const currentPrice = data[data.length - 1].close;
        let status = PatternStatus.Forming;

        if (secondValley.index < data.length - 1) {
          status =
            currentPrice > neckline
              ? PatternStatus.Confirmed
              : PatternStatus.Completed;
        }

        // 计算形态高度
        const patternHeight =
          neckline - (firstValley.price + secondValley.price) / 2;

        // 价格目标
        const priceTarget = neckline + patternHeight;

        // 可靠性评分
        const reliability = calculateDoubleTopBottomReliability(
          firstValley,
          secondValley,
          middlePeaks[0],
          data,
          true
        );

        // 计算形态与当前位置的距离因子
        const recencyFactor = Math.exp(
          -0.03 * (data.length - 1 - secondValley.index)
        );

        // 根据距离调整重要性
        const adjustedSignificance =
          reliability *
          (patternHeight / data[data.length - 1].close) *
          recencyFactor;

        patterns.push({
          patternType: PatternType.DoubleBottom,
          status,
          direction: PatternDirection.Bullish,
          reliability,
          significance: adjustedSignificance,
          component: {
            startIndex: firstValley.index,
            endIndex: secondValley.index,
            keyPoints: [firstValley, secondValley, middlePeaks[0]],
            patternHeight,
            breakoutLevel: neckline,
            volumePattern: analyzeDoubleTopBottomVolume(
              data,
              firstValley.index,
              secondValley.index,
              true
            ),
          },
          priceTarget,
          stopLoss: lowestPrice,
          breakoutExpected: status === PatternStatus.Completed,
          breakoutDirection: PatternDirection.Bullish,
          probableBreakoutZone: [neckline * 0.98, neckline * 1.02],
          description: `双底形态, ${status === PatternStatus.Confirmed ? '已确认突破颈线' : '正在形成中'}, 颈线位置在 ${neckline.toFixed(2)}`,
          tradingImplication: `看涨信号, 目标价位: ${priceTarget.toFixed(2)}, 止损位: ${lowestPrice.toFixed(2)}`,
          keyDates: [firstValley.date, middlePeaks[0].date, secondValley.date],
          keyPrices: [
            firstValley.price,
            middlePeaks[0].price,
            secondValley.price,
          ],
        });

        // 找到第一个有效的双底后就退出循环，优先考虑最近的形态
        break;
      }
    }
  }

  return patterns;
}

/**
 * 计算双顶/双底形态的可靠性
 */
function calculateDoubleTopBottomReliability(
  firstPoint: PeakValley,
  secondPoint: PeakValley,
  middlePoint: PeakValley,
  data: Candle[],
  isDoubleBottom: boolean
): number {
  let score = 50; // 初始可靠性分数

  // 1. 两个顶/底的相似度
  const peaksDiff = Math.abs(firstPoint.price - secondPoint.price);
  const similarity =
    1 - peaksDiff / ((firstPoint.price + secondPoint.price) / 2);
  score += similarity * 20; // 最多加20分

  // 2. 时间间隔
  const timeInterval = secondPoint.index - firstPoint.index;
  if (timeInterval > 15)
    score += 10; // 时间间隔明显
  else if (timeInterval > 8) score += 5; // 时间间隔适中

  // 3. 中间点的回调幅度
  let retracementRatio;
  if (isDoubleBottom) {
    retracementRatio =
      (middlePoint.price - firstPoint.price) /
      (secondPoint.price - firstPoint.price);
  } else {
    retracementRatio =
      (firstPoint.price - middlePoint.price) /
      (firstPoint.price - secondPoint.price);
  }

  if (retracementRatio > 0.5)
    score += 15; // 回调超过50%
  else if (retracementRatio > 0.3)
    score += 10; // 回调超过30%
  else score += 5; // 回调幅度较小

  // 4. 成交量确认
  const firstPointVolume = data[firstPoint.index].volume;
  const secondPointVolume = data[secondPoint.index].volume;

  if (isDoubleBottom) {
    // 双底理想情况：第二个底的成交量大于第一个底
    if (secondPointVolume > firstPointVolume * 1.2) score += 15;
    else if (secondPointVolume > firstPointVolume) score += 10;
  } else {
    // 双顶理想情况：第二个顶的成交量小于第一个顶
    if (secondPointVolume < firstPointVolume * 0.8) score += 15;
    else if (secondPointVolume < firstPointVolume) score += 10;
  }

  // 最后确保分数在0-100范围内
  return Math.max(0, Math.min(100, score));
}

/**
 * 分析双顶/双底形态的成交量特征
 */
function analyzeDoubleTopBottomVolume(
  data: Candle[],
  firstPointIndex: number,
  secondPointIndex: number,
  isDoubleBottom: boolean
): string {
  const volumes = data
    .slice(firstPointIndex, secondPointIndex + 1)
    .map(d => d.volume);
  const avgVolume = volumes.reduce((sum, v) => sum + v, 0) / volumes.length;

  const firstPointVolume = data[firstPointIndex].volume;
  const secondPointVolume = data[secondPointIndex].volume;

  if (isDoubleBottom) {
    if (secondPointVolume > firstPointVolume * 1.2) {
      return '理想的成交量模式：第二个底的成交量大于第一个底，强烈支持看涨';
    } else if (secondPointVolume > avgVolume) {
      return '良好的成交量模式：第二个底的成交量高于平均，支持看涨';
    } else {
      return '非理想的成交量模式：第二个底的成交量不够大，减弱形态可靠性';
    }
  } else {
    if (secondPointVolume < firstPointVolume * 0.8) {
      return '理想的成交量模式：第二个顶的成交量小于第一个顶，支持看跌';
    } else if (secondPointVolume < avgVolume) {
      return '良好的成交量模式：第二个顶的成交量低于平均，支持看跌';
    } else {
      return '非理想的成交量模式：第二个顶的成交量偏高，减弱形态可靠性';
    }
  }
}
