import { Candle } from '../../types.js';
import {
  PatternAnalysisResult,
  PatternDirection,
  PatternStatus,
  PatternType,
  PeakValley,
} from './multiTimeFramePatternAnalysis.js';
import {getStatusDescription} from "../../util/util.js";

/**
 * 寻找杯柄形态 (Cup and Handle)
 */
export function findCupAndHandle(
  data: Candle[],
  peaksValleys: PeakValley[],
  lookbackPeriod: number = 60
): PatternAnalysisResult[] {
  const patterns: PatternAnalysisResult[] = [];

  // 确保有足够的数据
  if (data.length < lookbackPeriod) {
    return patterns;
  }

  // 过滤出最近的峰谷
  const recentPoints = peaksValleys.filter(
    p => p.index >= data.length - lookbackPeriod
  );

  // 排序，确保按时间顺序
  recentPoints.sort((a, b) => a.index - b.index);

  // 分别获取峰和谷
  const peaks = recentPoints.filter(p => p.type === 'peak');
  const valleys = recentPoints.filter(p => p.type === 'valley');

  // 杯柄形态需要一定的峰谷结构
  if (peaks.length < 2 || valleys.length < 1) {
    return patterns;
  }

  // 寻找潜在的杯部分
  for (let i = 0; i < peaks.length - 1; i++) {
    const leftPeak = peaks[i];

    // 寻找杯底
    const cupBottomCandidates = valleys.filter(
      v => v.index > leftPeak.index && v.index < peaks[i + 1].index
    );

    if (cupBottomCandidates.length > 0) {
      const cupBottom = cupBottomCandidates.reduce((deepest, current) =>
        current.price < deepest.price ? current : deepest
      );

      const rightPeak = peaks[i + 1];

      // 验证杯的形状：两侧的高点应该大致相等，且明显高于杯底
      const peaksDiff =
        Math.abs(rightPeak.price - leftPeak.price) / leftPeak.price;
      const cupDepth =
        ((leftPeak.price + rightPeak.price) / 2 - cupBottom.price) /
        ((leftPeak.price + rightPeak.price) / 2);

      if (peaksDiff < 0.05 && cupDepth > 0.1) {
        // 杯的时间跨度应该合理
        const cupDuration = rightPeak.index - leftPeak.index;

        if (cupDuration >= 15 && cupDuration <= lookbackPeriod) {
          // 寻找杯后的柄部分
          // 柄通常是一个较小的回调，形成小的旗形或三角旗
          const handleStartIndex = rightPeak.index;
          const handleEndIndex = Math.min(
            handleStartIndex + 15,
            data.length - 1
          );

          // 检查柄的形状：应该是一个小的回调，不超过杯深度的一半
          let hasValidHandle = false;
          let handleLow = rightPeak.price;
          let handleEndPrice = rightPeak.price;

          for (let j = handleStartIndex + 1; j <= handleEndIndex; j++) {
            if (data[j].low < handleLow) {
              handleLow = data[j].low;
            }

            handleEndPrice = data[j].close;
          }

          const handleDepth = (rightPeak.price - handleLow) / rightPeak.price;

          if (handleDepth <= cupDepth / 2 && handleDepth > 0.03) {
            hasValidHandle = true;
          }

          if (hasValidHandle) {
            // 计算颈线位置：通常是杯的顶部
            const necklinePrice = Math.max(leftPeak.price, rightPeak.price);

            // 当前价格相对于颈线的位置
            const currentPrice = data[data.length - 1].close;
            let status = PatternStatus.Forming;

            if (currentPrice > necklinePrice * 1.01) {
              status = PatternStatus.Confirmed; // 已突破颈线
            } else if (handleEndIndex < data.length - 1) {
              status = PatternStatus.Completed; // 形态完成但未突破
            }

            // 计算价格目标：通常是杯的深度加到颈线上
            const cupHeight = necklinePrice - cupBottom.price;
            const priceTarget = necklinePrice + cupHeight;

            // 计算可靠性分数
            const reliability = calculateCupAndHandleReliability(
              data,
              leftPeak.index,
              cupBottom.index,
              rightPeak.index,
              handleEndIndex,
              cupDepth,
              handleDepth,
              status === PatternStatus.Confirmed
            );

            patterns.push({
              patternType: PatternType.CupAndHandle,
              status,
              direction: PatternDirection.Bullish,
              reliability,
              significance: reliability * (cupHeight / currentPrice),
              component: {
                startIndex: leftPeak.index,
                endIndex: handleEndIndex,
                keyPoints: [leftPeak, cupBottom, rightPeak],
                patternHeight: cupHeight,
                breakoutLevel: necklinePrice,
                volumePattern: analyzeCupAndHandleVolume(
                  data,
                  leftPeak.index,
                  cupBottom.index,
                  rightPeak.index,
                  handleEndIndex
                ),
              },
              priceTarget,
              stopLoss: handleLow,
              breakoutExpected: status === PatternStatus.Completed,
              breakoutDirection: PatternDirection.Bullish,
              probableBreakoutZone: [
                necklinePrice * 0.99,
                necklinePrice * 1.02,
              ],
              description: `杯柄形态, ${getStatusDescription(status)}, 杯深度: ${(cupDepth * 100).toFixed(1)}%, 颈线位置在 ${necklinePrice.toFixed(2)}`,
              tradingImplication: `看涨信号, 目标价位: ${priceTarget.toFixed(2)}, 止损位: ${handleLow.toFixed(2)}`,
              keyDates: [leftPeak.date, rightPeak.date],
              keyPrices: [leftPeak.price, rightPeak.price],
            });
          }
        }
      }
    }
  }

  return patterns;
}

/**
 * 计算杯柄形态的可靠性
 */
function calculateCupAndHandleReliability(
  data: Candle[],
  leftPeakIndex: number,
  cupBottomIndex: number,
  rightPeakIndex: number,
  handleEndIndex: number,
  cupDepth: number,
  handleDepth: number,
  isBreakoutConfirmed: boolean
): number {
  let score = 50; // 初始可靠性分数

  // 1. 杯的对称性
  const leftSideLength = cupBottomIndex - leftPeakIndex;
  const rightSideLength = rightPeakIndex - cupBottomIndex;
  const symmetryRatio =
    Math.min(leftSideLength, rightSideLength) /
    Math.max(leftSideLength, rightSideLength);

  if (symmetryRatio > 0.8)
    score += 15; // 高度对称
  else if (symmetryRatio > 0.6)
    score += 10; // 中等对称
  else score += 5; // 较低对称

  // 2. 杯的深度
  if (cupDepth >= 0.15 && cupDepth <= 0.3)
    score += 15; // 理想的深度
  else if (cupDepth > 0.3)
    score += 10; // 深度较大
  else score += 5; // 深度较浅

  // 3. 杯的时间跨度
  const cupDuration = rightPeakIndex - leftPeakIndex;
  if (cupDuration >= 20 && cupDuration <= 50)
    score += 10; // 理想的时间跨度
  else if (cupDuration > 50) score += 5; // 时间跨度较长

  // 4. 柄的形状和深度
  if (handleDepth >= 0.05 && handleDepth <= 0.15)
    score += 10; // 理想的柄深度
  else score += 5; // 柄深度不理想

  // 5. 确认突破
  if (isBreakoutConfirmed) score += 15;

  // 最后确保分数在0-100范围内
  return Math.max(0, Math.min(100, score));
}

/**
 * 分析杯柄形态的成交量特征
 */
function analyzeCupAndHandleVolume(
  data: Candle[],
  leftPeakIndex: number,
  cupBottomIndex: number,
  rightPeakIndex: number,
  handleEndIndex: number
): string {
  // 计算杯左侧成交量
  const leftSideVolumes = data
    .slice(leftPeakIndex, cupBottomIndex + 1)
    .map(d => d.volume);
  const avgLeftSideVolume =
    leftSideVolumes.reduce((sum, v) => sum + v, 0) / leftSideVolumes.length;

  // 计算杯右侧成交量
  const rightSideVolumes = data
    .slice(cupBottomIndex, rightPeakIndex + 1)
    .map(d => d.volume);
  const avgRightSideVolume =
    rightSideVolumes.reduce((sum, v) => sum + v, 0) / rightSideVolumes.length;

  // 计算柄部分成交量
  const handleVolumes = data
    .slice(rightPeakIndex, handleEndIndex + 1)
    .map(d => d.volume);
  const avgHandleVolume =
    handleVolumes.reduce((sum, v) => sum + v, 0) / handleVolumes.length;

  // 检查突破时的成交量
  let breakoutVolume = 0;
  if (handleEndIndex + 1 < data.length) {
    breakoutVolume = data[handleEndIndex + 1].volume;
  }

  // 理想的成交量模式：右侧成交量大于左侧，柄部分成交量萎缩，突破时放量
  if (
    avgRightSideVolume > avgLeftSideVolume * 1.2 &&
    avgHandleVolume < avgRightSideVolume * 0.7
  ) {
    if (breakoutVolume > avgHandleVolume * 1.5) {
      return '理想的成交量模式：右侧成交量大于左侧，柄部成交量萎缩，突破时成交量明显放大';
    } else {
      return '良好的成交量模式：右侧成交量大于左侧，柄部成交量萎缩';
    }
  } else if (avgHandleVolume < avgRightSideVolume * 0.8) {
    return '可接受的成交量模式：柄部成交量萎缩';
  } else {
    return '非理想的成交量模式：成交量特征不符合典型杯柄形态要求，降低形态可靠性';
  }
}
