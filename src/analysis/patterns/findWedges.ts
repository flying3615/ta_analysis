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
 * 寻找楔形形态
 */
export function findWedges(
  data: Candle[],
  peaksValleys: PeakValley[],
  lookbackPeriod: number = 30
): PatternAnalysisResult[] {
  const patterns: PatternAnalysisResult[] = [];

  // 过滤出最近的峰谷
  const recentPoints = peaksValleys.filter(
    p => p.index >= data.length - lookbackPeriod
  );

  // 排序，确保按时间顺序
  recentPoints.sort((a, b) => a.index - b.index);

  // 分别获取峰和谷
  const peaks = recentPoints.filter(p => p.type === 'peak');
  const valleys = recentPoints.filter(p => p.type === 'valley');

  // 需要至少2个峰和2个谷来形成楔形
  if (peaks.length < 2 || valleys.length < 2) {
    return patterns;
  }

  // 寻找上升楔形（看跌）
  // 上升楔形：上部边界和下部边界都向上倾斜，但下部边界倾斜更陡
  if (peaks.length >= 2 && valleys.length >= 2) {
    const peakSlope =
      (peaks[peaks.length - 1].price - peaks[peaks.length - 2].price) /
      (peaks[peaks.length - 1].index - peaks[peaks.length - 2].index);

    const valleySlope =
      (valleys[valleys.length - 1].price - valleys[valleys.length - 2].price) /
      (valleys[valleys.length - 1].index - valleys[valleys.length - 2].index);

    // 检查两条边界线是否都向上倾斜，且下部边界倾斜更陡
    if (peakSlope > 0 && valleySlope > 0 && valleySlope > peakSlope) {
      // 计算上升楔形的上部边界
      const upperBoundary1 = peaks[peaks.length - 2];
      const upperBoundary2 = peaks[peaks.length - 1];

      // 计算上升楔形的下部边界
      const lowerBoundary1 = valleys[valleys.length - 2];
      const lowerBoundary2 = valleys[valleys.length - 1];

      // 确定形态开始和结束的索引
      const startIndex = Math.min(upperBoundary1.index, lowerBoundary1.index);
      const endIndex = Math.max(upperBoundary2.index, lowerBoundary2.index);

      // 计算当前的预期边界位置
      const currentIndex = data.length - 1;
      const projectedUpperBoundary =
        upperBoundary1.price +
        peakSlope * (currentIndex - upperBoundary1.index);
      const projectedLowerBoundary =
        lowerBoundary1.price +
        valleySlope * (currentIndex - lowerBoundary1.index);

      // 计算收敛点
      let convergenceIndex = upperBoundary1.index;

      if (peakSlope !== valleySlope) {
        const interceptDiff =
          lowerBoundary1.price -
          upperBoundary1.price -
          (lowerBoundary1.index - upperBoundary1.index) *
            (valleySlope - peakSlope);
        convergenceIndex =
          upperBoundary1.index + interceptDiff / (valleySlope - peakSlope);
      }

      // 计算当前是否接近收敛点
      const proximityToConvergence =
        1 - Math.min(1, Math.abs(currentIndex - convergenceIndex) / 20);

      // 确定当前价格相对于楔形的位置
      const currentPrice = data[data.length - 1].close;
      let status = PatternStatus.Forming;

      if (currentIndex > endIndex) {
        if (currentPrice < projectedLowerBoundary) {
          status = PatternStatus.Confirmed; // 已突破下方
        } else if (currentPrice > projectedUpperBoundary) {
          status = PatternStatus.Failed; // 意外向上突破
        } else {
          status = PatternStatus.Completed; // 形成但未突破
        }
      }

      // 检查形态是否无效 - 上升楔形（看跌）形态
      let isInvalid = false;

      // 检查1：如果之前确认了下方突破，后续K线又回到楔形内部或突破上边界，形态无效
      if (status === PatternStatus.Confirmed && endIndex < data.length - 1) {
        let foundBreakout = false;
        let invalidAfterBreakout = false;

        for (let i = endIndex + 1; i < data.length; i++) {
          // 对于当前K线，计算预期的上下边界
          const upperBound =
            upperBoundary1.price + peakSlope * (i - upperBoundary1.index);
          const lowerBound =
            lowerBoundary1.price + valleySlope * (i - lowerBoundary1.index);

          // 首先检测是否出现下方突破（形态确认）
          if (!foundBreakout && data[i].close < lowerBound) {
            foundBreakout = true;
            continue;
          }

          // 如果已经确认下方突破，但后续K线回到楔形内部或突破上边界，形态无效
          if (
            foundBreakout &&
            (data[i].close > lowerBound || data[i].high > upperBound)
          ) {
            invalidAfterBreakout = true;
            break;
          }
        }

        isInvalid = invalidAfterBreakout;
      }

      // 检查2：如果价格长时间在楔形内部盘整而没有突破，可能形态无效
      if (
        !isInvalid &&
        currentIndex - endIndex > 15 &&
        status === PatternStatus.Completed
      ) {
        isInvalid = true; // 形态完成后15个K线仍未突破，考虑无效
      }

      // 如果形态无效，跳过此形态
      if (isInvalid) {
        // 跳过此形态，不添加到结果中
        // continue 在这里没有效果，因为我们不在循环内，所以直接使用 if-else 结构
      } else {
        // 计算形态高度（在结束点的高度）
        const patternHeight = projectedUpperBoundary - projectedLowerBoundary;

        // 计算价格目标（向下突破的目标，通常是形态起始点的价格）
        const startHeight = upperBoundary1.price - lowerBoundary1.price;
        const priceTarget = lowerBoundary1.price - startHeight;

        // 计算可靠性分数
        const reliability = calculateWedgeReliability(
          data,
          startIndex,
          endIndex,
          patternHeight,
          proximityToConvergence,
          status === PatternStatus.Confirmed,
          PatternType.RisingWedge
        );

        patterns.push({
          patternType: PatternType.RisingWedge,
          status,
          direction: PatternDirection.Bearish,
          reliability,
          significance: reliability * (patternHeight / currentPrice),
          component: {
            startIndex,
            endIndex,
            keyPoints: [
              upperBoundary1,
              upperBoundary2,
              lowerBoundary1,
              lowerBoundary2,
            ],
            patternHeight,
            breakoutLevel: projectedLowerBoundary,
            volumePattern: analyzeWedgeVolume(
              data,
              startIndex,
              endIndex,
              status
            ),
          },
          priceTarget,
          stopLoss: projectedUpperBoundary * 1.02, // 上边界上方2%
          breakoutExpected:
            status === PatternStatus.Completed && proximityToConvergence > 0.7,
          breakoutDirection: PatternDirection.Bearish,
          probableBreakoutZone: [
            projectedLowerBoundary * 0.98,
            projectedLowerBoundary * 1.02,
          ],
          description: `上升楔形, ${getStatusDescription(status)}, 上边界当前在 ${projectedUpperBoundary.toFixed(2)}, 下边界当前在 ${projectedLowerBoundary.toFixed(2)}`,
          tradingImplication: `看跌信号, 目标价位: ${priceTarget.toFixed(2)}, 止损位: ${(projectedUpperBoundary * 1.02).toFixed(2)}`,
          keyDates: [...peaks.map(p => p.date), ...valleys.map(v => v.date)],
          keyPrices: [...peaks.map(p => p.price), ...valleys.map(v => v.price)],
        });
      }
    }
  }

  // 寻找下降楔形（看涨）
  // 下降楔形：上部边界和下部边界都向下倾斜，但下部边界倾斜更缓
  if (peaks.length >= 2 && valleys.length >= 2) {
    const peakSlope =
      (peaks[peaks.length - 1].price - peaks[peaks.length - 2].price) /
      (peaks[peaks.length - 1].index - peaks[peaks.length - 2].index);

    const valleySlope =
      (valleys[valleys.length - 1].price - valleys[valleys.length - 2].price) /
      (valleys[valleys.length - 1].index - valleys[valleys.length - 2].index);

    // 检查两条边界线是否都向下倾斜，且下部边界倾斜更缓
    if (peakSlope < 0 && valleySlope < 0 && valleySlope > peakSlope) {
      // 计算下降楔形的上部边界
      const upperBoundary1 = peaks[peaks.length - 2];
      const upperBoundary2 = peaks[peaks.length - 1];

      // 计算下降楔形的下部边界
      const lowerBoundary1 = valleys[valleys.length - 2];
      const lowerBoundary2 = valleys[valleys.length - 1];

      // 确定形态开始和结束的索引
      const startIndex = Math.min(upperBoundary1.index, lowerBoundary1.index);
      const endIndex = Math.max(upperBoundary2.index, lowerBoundary2.index);

      // 计算当前的预期边界位置
      const currentIndex = data.length - 1;
      const projectedUpperBoundary =
        upperBoundary1.price +
        peakSlope * (currentIndex - upperBoundary1.index);
      const projectedLowerBoundary =
        lowerBoundary1.price +
        valleySlope * (currentIndex - lowerBoundary1.index);

      // 计算收敛点
      let convergenceIndex = upperBoundary1.index;

      if (peakSlope !== valleySlope) {
        const interceptDiff =
          lowerBoundary1.price -
          upperBoundary1.price -
          (lowerBoundary1.index - upperBoundary1.index) *
            (valleySlope - peakSlope);
        convergenceIndex =
          upperBoundary1.index + interceptDiff / (valleySlope - peakSlope);
      }

      // 计算当前是否接近收敛点
      const proximityToConvergence =
        1 - Math.min(1, Math.abs(currentIndex - convergenceIndex) / 20);

      // 确定当前价格相对于楔形的位置
      const currentPrice = data[data.length - 1].close;
      let status = PatternStatus.Forming;

      if (currentIndex > endIndex) {
        if (currentPrice > projectedUpperBoundary) {
          status = PatternStatus.Confirmed; // 已突破上方
        } else if (currentPrice < projectedLowerBoundary) {
          status = PatternStatus.Failed; // 意外向下突破
        } else {
          status = PatternStatus.Completed; // 形成但未突破
        }
      }

      // 检查形态是否无效 - 下降楔形（看涨）形态
      let isInvalid = false;

      // 检查1：如果之前确认了上方突破，后续K线又回到楔形内部或突破下边界，形态无效
      if (status === PatternStatus.Confirmed && endIndex < data.length - 1) {
        let foundBreakout = false;
        let invalidAfterBreakout = false;

        for (let i = endIndex + 1; i < data.length; i++) {
          // 对于当前K线，计算预期的上下边界
          const upperBound =
            upperBoundary1.price + peakSlope * (i - upperBoundary1.index);
          const lowerBound =
            lowerBoundary1.price + valleySlope * (i - lowerBoundary1.index);

          // 首先检测是否出现上方突破（形态确认）
          if (!foundBreakout && data[i].close > upperBound) {
            foundBreakout = true;
            continue;
          }

          // 如果已经确认上方突破，但后续K线回到楔形内部或突破下边界，形态无效
          if (
            foundBreakout &&
            (data[i].close < upperBound || data[i].low < lowerBound)
          ) {
            invalidAfterBreakout = true;
            break;
          }
        }

        isInvalid = invalidAfterBreakout;
      }

      // 检查2：如果价格长时间在楔形内部盘整而没有突破，可能形态无效
      if (
        !isInvalid &&
        currentIndex - endIndex > 15 &&
        status === PatternStatus.Completed
      ) {
        isInvalid = true; // 形态完成后15个K线仍未突破，考虑无效
      }

      // 如果形态无效，跳过此形态
      if (isInvalid) {
        // 跳过此形态，不添加到结果中
        // continue 在这里没有效果，因为我们不在循环内，所以直接使用 if-else 结构
      } else {
        // 计算形态高度（在结束点的高度）
        const patternHeight = projectedUpperBoundary - projectedLowerBoundary;

        // 计算价格目标（向上突破的目标，通常是形态起始点的价格）
        const startHeight = upperBoundary1.price - lowerBoundary1.price;
        const priceTarget = upperBoundary1.price + startHeight;

        // 计算可靠性分数
        const reliability = calculateWedgeReliability(
          data,
          startIndex,
          endIndex,
          patternHeight,
          proximityToConvergence,
          status === PatternStatus.Confirmed,
          PatternType.FallingWedge
        );

        patterns.push({
          patternType: PatternType.FallingWedge,
          status,
          direction: PatternDirection.Bullish,
          reliability,
          significance: reliability * (patternHeight / currentPrice),
          component: {
            startIndex,
            endIndex,
            keyPoints: [
              upperBoundary1,
              upperBoundary2,
              lowerBoundary1,
              lowerBoundary2,
            ],
            patternHeight,
            breakoutLevel: projectedUpperBoundary,
            volumePattern: analyzeWedgeVolume(
              data,
              startIndex,
              endIndex,
              status
            ),
          },
          priceTarget,
          stopLoss: projectedLowerBoundary * 0.98, // 下边界下方2%
          breakoutExpected:
            status === PatternStatus.Completed && proximityToConvergence > 0.7,
          breakoutDirection: PatternDirection.Bullish,
          probableBreakoutZone: [
            projectedUpperBoundary * 0.98,
            projectedUpperBoundary * 1.02,
          ],
          description: `下降楔形, ${getStatusDescription(status)}, 上边界当前在 ${projectedUpperBoundary.toFixed(2)}, 下边界当前在 ${projectedLowerBoundary.toFixed(2)}`,
          tradingImplication: `看涨信号, 目标价位: ${priceTarget.toFixed(2)}, 止损位: ${(projectedLowerBoundary * 0.98).toFixed(2)}`,
          keyDates: [...peaks.map(p => p.date), ...valleys.map(v => v.date)],
          keyPrices: [...peaks.map(p => p.price), ...valleys.map(v => v.price)],
        });
      }
    }
  }

  return patterns;
}

/**
 * 计算楔形形态的可靠性
 */
function calculateWedgeReliability(
  data: Candle[],
  startIndex: number,
  endIndex: number,
  patternHeight: number,
  proximityToConvergence: number,
  isBreakoutConfirmed: boolean,
  patternType: PatternType
): number {
  let score = 50; // 初始可靠性分数

  // 1. 形态持续时间（通常越长越好）
  const duration = endIndex - startIndex;
  if (duration > 20) score += 15;
  else if (duration > 10) score += 10;
  else score += 5;

  // 2. 形态收敛程度
  score += proximityToConvergence * 15;

  // 3. 确认突破
  if (isBreakoutConfirmed) score += 15;

  // 4. 形态与趋势的关系
  if (patternType === PatternType.RisingWedge) {
    // 上升楔形在上升趋势末期更可靠
    // 这里简化处理，实际应考虑趋势
    score += 5;
  } else if (patternType === PatternType.FallingWedge) {
    // 下降楔形在下降趋势末期更可靠
    score += 5;
  }

  // 5. 楔形角度（越窄越好）
  // 简化处理，假设已经是合理的楔形
  score += 5;

  // 最后确保分数在0-100范围内
  return Math.max(0, Math.min(100, score));
}

/**
 * 分析楔形形态的成交量特征
 */
function analyzeWedgeVolume(
  data: Candle[],
  startIndex: number,
  endIndex: number,
  status: PatternStatus
): string {
  const volumes = data.slice(startIndex, endIndex + 1).map(d => d.volume);
  const avgVolume = volumes.reduce((sum, v) => sum + v, 0) / volumes.length;

  // 检查突破时的成交量
  let breakoutVolume = 0;
  if (status === PatternStatus.Confirmed && endIndex + 1 < data.length) {
    breakoutVolume = data[endIndex + 1].volume;
  }

  // 检查形态过程中的成交量趋势
  const firstHalfAvg =
    volumes
      .slice(0, Math.ceil(volumes.length / 2))
      .reduce((sum, v) => sum + v, 0) / Math.ceil(volumes.length / 2);

  const secondHalfAvg =
    volumes
      .slice(Math.ceil(volumes.length / 2))
      .reduce((sum, v) => sum + v, 0) /
    (volumes.length - Math.ceil(volumes.length / 2));

  const volumeTrendRatio = secondHalfAvg / firstHalfAvg;

  if (volumeTrendRatio < 0.8) {
    // 成交量减少是楔形形态的理想情况
    if (
      status === PatternStatus.Confirmed &&
      breakoutVolume > avgVolume * 1.5
    ) {
      return '理想的成交量模式：形态期间成交量逐渐减少，突破时成交量明显放大';
    } else {
      return '良好的成交量模式：形态期间成交量逐渐减少';
    }
  } else if (volumeTrendRatio > 1.2) {
    return '非典型的成交量模式：形态期间成交量增加而非减少，降低形态可靠性';
  } else {
    return '成交量模式中性，无明显趋势';
  }
}
