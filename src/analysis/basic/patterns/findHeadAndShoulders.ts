import { Candle } from '../../../types.js';
import {
  PatternAnalysisResult,
  PatternDirection,
  PatternStatus,
  PatternType,
  PeakValley,
} from './analyzeMultiTimeframePatterns.js';
import {
  arePricesSimilar,
  isPatternHeightSignificant,
  isPatternDurationValid,
  isValidBreakout,
  isPatternFailed,
  calculateStandardReliability,
  analyzeVolumePatternQuality,
  calculateBreakoutStrength,
  ReliabilityFactors,
} from './patternConfig.js';

/**
 * 寻找头肩顶/头肩底形态
 * @param data K线数据
 * @param peaksValleys 已检测到的峰谷
 * @param lookbackPeriod 回看周期
 */
export function findHeadAndShoulders(
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

  // 检测头肩顶形态
  for (let i = 0; i < peaks.length - 2; i++) {
    const leftShoulder = peaks[i];
    const head = peaks[i + 1];
    const rightShoulder = peaks[i + 2];

    // 验证头肩顶基本形态（头部高于两肩）
    if (
      head.price > leftShoulder.price &&
      head.price > rightShoulder.price &&
      arePricesSimilar(leftShoulder.price, rightShoulder.price) // 使用统一的价格相似度检查
    ) {
      // 寻找颈线的两个谷
      const necklineValleys = valleys.filter(
        v => v.index > leftShoulder.index && v.index < rightShoulder.index
      );

      if (necklineValleys.length >= 2) {
        const leftNeck = necklineValleys[0];
        const rightNeck = necklineValleys[necklineValleys.length - 1];

        // 计算颈线
        const necklineSlope =
          (rightNeck.price - leftNeck.price) /
          (rightNeck.index - leftNeck.index);
        const necklineAtEnd =
          leftNeck.price +
          necklineSlope * (rightShoulder.index - leftNeck.index);

        // 计算当前价格是否已突破颈线
        const currentPrice = data[data.length - 1].close;
        const currentIndex = data.length - 1;
        const projectedNeckline =
          leftNeck.price + necklineSlope * (currentIndex - leftNeck.index);

        // 确定形态状态
        let status = PatternStatus.Forming;
        if (rightShoulder.index < data.length - 1) {
          // 检查是否为有效突破
          if (currentPrice < projectedNeckline) {
            // 向下突破颈线，检查是否为有效突破
            const breakoutIndex = data.length - 1;
            if (
              isValidBreakout(data, breakoutIndex, projectedNeckline, false)
            ) {
              status = PatternStatus.Confirmed;
            } else {
              status = PatternStatus.Completed;
            }
          } else {
            status = PatternStatus.Completed;
          }

          // 检查形态是否失败
          if (
            status === PatternStatus.Confirmed &&
            isPatternFailed(data, rightShoulder.index, projectedNeckline, false)
          ) {
            status = PatternStatus.Failed;
          }
        }

        // 形态高度 (头部到颈线的距离)
        const patternHeight =
          head.price - (leftNeck.price + rightNeck.price) / 2;

        // 检查形态高度是否足够显著
        const avgPrice =
          data.reduce((sum, d) => sum + d.close, 0) / data.length;
        if (!isPatternHeightSignificant(patternHeight, avgPrice)) {
          // 形态高度不够显著，跳过此形态
          continue;
        }

        // 检查形态持续时间是否合理
        const duration = rightShoulder.index - leftShoulder.index;
        if (!isPatternDurationValid(duration)) {
          // 形态持续时间不合理，跳过此形态
          continue;
        }

        // 计算标准化可靠性分数
        // 计算对称性
        const leftToHeadDuration = head.index - leftShoulder.index;
        const headToRightDuration = rightShoulder.index - head.index;
        const symmetryRatio =
          Math.min(leftToHeadDuration, headToRightDuration) /
          Math.max(leftToHeadDuration, headToRightDuration);

        // 计算头部突出程度
        const shoulderAvgHeight =
          (leftShoulder.price + rightShoulder.price) / 2;
        const headProminence =
          (head.price - shoulderAvgHeight) / shoulderAvgHeight;

        // 计算颈线斜率（理想情况下应该接近水平）
        const necklineSlopeAbs = Math.abs(
          (rightNeck.price - leftNeck.price) /
            (rightNeck.index - leftNeck.index)
        );
        const normalizedSlope = necklineSlopeAbs / avgPrice;
        const necklineScore = Math.max(0, 1 - normalizedSlope * 100); // 转换为0-1评分

        // 分析成交量模式
        const volumePatternQuality = analyzeVolumePatternQuality(
          data,
          leftShoulder.index,
          rightShoulder.index,
          'reversal'
        );

        // 计算突破强度
        let breakoutStrength = 0;
        if (status === PatternStatus.Confirmed) {
          breakoutStrength = calculateBreakoutStrength(
            data,
            data.length - 1,
            projectedNeckline,
            false
          );
        }

        // 计算新近度
        const recencyDistance = data.length - 1 - rightShoulder.index;
        const recency = Math.exp(-0.03 * recencyDistance);

        // 构建可靠性因素
        const reliabilityFactors: ReliabilityFactors = {
          patternHeight,
          avgPrice,
          duration,
          symmetry: symmetryRatio,
          volumeConfirmation: status === PatternStatus.Confirmed,
          volumePattern: volumePatternQuality,
          breakoutConfirmed: status === PatternStatus.Confirmed,
          breakoutStrength,
          recency,
          specificFactors: {
            headProminence: Math.min(headProminence * 10, 1), // 标准化到0-1
            necklineSlope: necklineScore,
          },
        };

        const reliability = calculateStandardReliability(reliabilityFactors);

        // 价格目标 (颈线下方的头部高度)
        const priceTarget = necklineAtEnd - patternHeight;

        // 建议止损
        const stopLoss = head.price;

        patterns.push({
          patternType: PatternType.HeadAndShoulders,
          status,
          direction: PatternDirection.Bearish,
          reliability,
          significance:
            reliability * (patternHeight / data[data.length - 1].close),
          component: {
            startIndex: leftShoulder.index,
            endIndex: rightShoulder.index,
            keyPoints: [leftShoulder, head, rightShoulder, leftNeck, rightNeck],
            patternHeight,
            breakoutLevel: necklineAtEnd,
            volumePattern: analyzeHSVolumePattern(
              data,
              leftShoulder.index,
              rightShoulder.index,
              false
            ),
          },
          priceTarget,
          stopLoss,
          breakoutExpected: status === PatternStatus.Completed,
          breakoutDirection: PatternDirection.Bearish,
          probableBreakoutZone: [necklineAtEnd * 0.98, necklineAtEnd * 1.02],
          description: `头肩顶形态, ${status === PatternStatus.Confirmed ? '已确认突破颈线' : '正在形成中'}, 颈线位置在 ${necklineAtEnd.toFixed(2)}`,
          tradingImplication: `看跌信号, 目标价位: ${priceTarget.toFixed(2)}, 止损位: ${stopLoss.toFixed(2)}`,
          keyDates: [leftShoulder.date, head.date, rightShoulder.date],
          keyPrices: [leftShoulder.price, head.price, rightShoulder.price],
        });
      }
    }
  }

  // 检测头肩底形态
  for (let i = 0; i < valleys.length - 2; i++) {
    const leftShoulder = valleys[i];
    const head = valleys[i + 1];
    const rightShoulder = valleys[i + 2];

    // 验证头肩底基本形态（头部低于两肩）
    if (
      head.price < leftShoulder.price &&
      head.price < rightShoulder.price &&
      arePricesSimilar(leftShoulder.price, rightShoulder.price) // 使用统一的价格相似度检查
    ) {
      // 寻找颈线的两个峰
      const necklinePeaks = peaks.filter(
        p => p.index > leftShoulder.index && p.index < rightShoulder.index
      );

      if (necklinePeaks.length >= 2) {
        const leftNeck = necklinePeaks[0];
        const rightNeck = necklinePeaks[necklinePeaks.length - 1];

        // 计算颈线
        const necklineSlope =
          (rightNeck.price - leftNeck.price) /
          (rightNeck.index - leftNeck.index);
        const necklineAtEnd =
          leftNeck.price +
          necklineSlope * (rightShoulder.index - leftNeck.index);

        // 计算当前价格是否已突破颈线
        const currentPrice = data[data.length - 1].close;
        const currentIndex = data.length - 1;
        const projectedNeckline =
          leftNeck.price + necklineSlope * (currentIndex - leftNeck.index);

        // 确定形态状态
        let status = PatternStatus.Forming;
        if (rightShoulder.index < data.length - 1) {
          // 检查是否为有效突破
          if (currentPrice > projectedNeckline) {
            // 向上突破颈线，检查是否为有效突破
            const breakoutIndex = data.length - 1;
            if (isValidBreakout(data, breakoutIndex, projectedNeckline, true)) {
              status = PatternStatus.Confirmed;
            } else {
              status = PatternStatus.Completed;
            }
          } else {
            status = PatternStatus.Completed;
          }

          // 检查形态是否失败
          if (
            status === PatternStatus.Confirmed &&
            isPatternFailed(data, rightShoulder.index, projectedNeckline, true)
          ) {
            status = PatternStatus.Failed;
          }
        }

        // 形态高度 (颈线到头部的距离)
        const patternHeight =
          (leftNeck.price + rightNeck.price) / 2 - head.price;

        // 检查形态高度是否足够显著
        const avgPrice =
          data.reduce((sum, d) => sum + d.close, 0) / data.length;
        if (!isPatternHeightSignificant(patternHeight, avgPrice)) {
          // 形态高度不够显著，跳过此形态
          continue;
        }

        // 检查形态持续时间是否合理
        const duration = rightShoulder.index - leftShoulder.index;
        if (!isPatternDurationValid(duration)) {
          // 形态持续时间不合理，跳过此形态
          continue;
        }

        // 计算标准化可靠性分数
        // 计算对称性
        const leftToHeadDuration = head.index - leftShoulder.index;
        const headToRightDuration = rightShoulder.index - head.index;
        const symmetryRatio =
          Math.min(leftToHeadDuration, headToRightDuration) /
          Math.max(leftToHeadDuration, headToRightDuration);

        // 计算头部突出程度
        const shoulderAvgHeight =
          (leftShoulder.price + rightShoulder.price) / 2;
        const headProminence =
          (shoulderAvgHeight - head.price) / shoulderAvgHeight;

        // 计算颈线斜率（理想情况下应该接近水平）
        const necklineSlopeAbs = Math.abs(
          (rightNeck.price - leftNeck.price) /
            (rightNeck.index - leftNeck.index)
        );
        const normalizedSlope = necklineSlopeAbs / avgPrice;
        const necklineScore = Math.max(0, 1 - normalizedSlope * 100); // 转换为0-1评分

        // 分析成交量模式
        const volumePatternQuality = analyzeVolumePatternQuality(
          data,
          leftShoulder.index,
          rightShoulder.index,
          'reversal'
        );

        // 计算突破强度
        let breakoutStrength = 0;
        if (status === PatternStatus.Confirmed) {
          breakoutStrength = calculateBreakoutStrength(
            data,
            data.length - 1,
            projectedNeckline,
            true
          );
        }

        // 计算新近度
        const recencyDistance = data.length - 1 - rightShoulder.index;
        const recency = Math.exp(-0.03 * recencyDistance);

        // 构建可靠性因素
        const reliabilityFactors: ReliabilityFactors = {
          patternHeight,
          avgPrice,
          duration,
          symmetry: symmetryRatio,
          volumeConfirmation: status === PatternStatus.Confirmed,
          volumePattern: volumePatternQuality,
          breakoutConfirmed: status === PatternStatus.Confirmed,
          breakoutStrength,
          recency,
          specificFactors: {
            headProminence: Math.min(headProminence * 10, 1), // 标准化到0-1
            necklineSlope: necklineScore,
          },
        };

        const reliability = calculateStandardReliability(reliabilityFactors);

        // 价格目标 (颈线上方的头部高度)
        const priceTarget = necklineAtEnd + patternHeight;

        // 建议止损
        const stopLoss = head.price;

        patterns.push({
          patternType: PatternType.InverseHeadAndShoulders,
          status,
          direction: PatternDirection.Bullish,
          reliability,
          significance:
            reliability * (patternHeight / data[data.length - 1].close),
          component: {
            startIndex: leftShoulder.index,
            endIndex: rightShoulder.index,
            keyPoints: [leftShoulder, head, rightShoulder, leftNeck, rightNeck],
            patternHeight,
            breakoutLevel: necklineAtEnd,
            volumePattern: analyzeHSVolumePattern(
              data,
              leftShoulder.index,
              rightShoulder.index,
              true
            ),
          },
          priceTarget,
          stopLoss,
          breakoutExpected: status === PatternStatus.Completed,
          breakoutDirection: PatternDirection.Bullish,
          probableBreakoutZone: [necklineAtEnd * 0.98, necklineAtEnd * 1.02],
          description: `头肩底形态, ${status === PatternStatus.Confirmed ? '已确认突破颈线' : '正在形成中'}, 颈线位置在 ${necklineAtEnd.toFixed(2)}`,
          tradingImplication: `看涨信号, 目标价位: ${priceTarget.toFixed(2)}, 止损位: ${stopLoss.toFixed(2)}`,
          keyDates: [leftShoulder.date, head.date, rightShoulder.date],
          keyPrices: [leftShoulder.price, head.price, rightShoulder.price],
        });
      }
    }
  }

  return patterns;
}

/**
 * 分析头肩形态的成交量特征
 */
function analyzeHSVolumePattern(
  data: Candle[],
  startIndex: number,
  endIndex: number,
  isInverse: boolean
): string {
  // 简化的成交量分析
  const volumes = data.slice(startIndex, endIndex + 1).map(d => d.volume);
  const avgVolume = volumes.reduce((sum, v) => sum + v, 0) / volumes.length;

  // 头部附近的成交量
  const middleIndex = Math.floor((startIndex + endIndex) / 2);
  const headVolumeRegion = data
    .slice(middleIndex - 2, middleIndex + 3)
    .map(d => d.volume);
  const headAvgVolume =
    headVolumeRegion.reduce((sum, v) => sum + v, 0) / headVolumeRegion.length;

  // 右肩的成交量
  const rightShoulderVolumes = data
    .slice(middleIndex + 3, endIndex + 1)
    .map(d => d.volume);
  const rightShoulderAvgVolume =
    rightShoulderVolumes.length > 0
      ? rightShoulderVolumes.reduce((sum, v) => sum + v, 0) /
        rightShoulderVolumes.length
      : 0;

  if (isInverse) {
    // 头肩底
    if (
      headAvgVolume > avgVolume * 1.2 &&
      rightShoulderAvgVolume > headAvgVolume
    ) {
      return '理想的成交量模式：头部成交量放大，右肩成交量更大，支持看涨形态';
    } else if (
      headAvgVolume > avgVolume &&
      rightShoulderAvgVolume > avgVolume
    ) {
      return '良好的成交量模式：头部和右肩成交量均高于平均，支持形态';
    } else {
      return '非理想的成交量模式：未能在关键点位看到成交量放大，减弱形态可靠性';
    }
  } else {
    // 头肩顶
    if (
      headAvgVolume > avgVolume * 1.2 &&
      rightShoulderAvgVolume < headAvgVolume
    ) {
      return '理想的成交量模式：头部成交量放大，右肩成交量减小，支持看跌形态';
    } else if (rightShoulderAvgVolume < avgVolume * 0.8) {
      return '良好的成交量模式：右肩成交量明显减小，支持形态';
    } else {
      return '非理想的成交量模式：右肩成交量未能明显减小，减弱形态可靠性';
    }
  }
}
