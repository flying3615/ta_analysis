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
 * 寻找三角形形态
 */
export function findTriangles(
  data: Candle[],
  peaksValleys: PeakValley[],
  lookbackPeriod: number = 30
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

  // 需要至少2个峰和2个谷来形成三角形
  if (peaks.length < 2 || valleys.length < 2) {
    return patterns;
  }

  // 检测上升三角形（水平阻力线，上升支撑线）
  // 上升三角形需要至少两个相似的高点和两个上升的低点
  if (peaks.length >= 2 && valleys.length >= 2) {
    // 检查是否存在水平的高点
    const laterPeaks = peaks.slice(-2);
    const isHorizontalHighs =
      Math.abs(laterPeaks[1].price - laterPeaks[0].price) /
        laterPeaks[0].price <
      0.03;

    // 检查是否存在上升的低点
    const isAscendingLows =
      valleys[valleys.length - 1].price > valleys[valleys.length - 2].price;

    if (isHorizontalHighs && isAscendingLows) {
      // 计算上升三角形的阻力线（水平线）
      const resistanceLevel = (laterPeaks[0].price + laterPeaks[1].price) / 2;

      // 计算上升三角形的支撑线（上升线）
      const support1 = valleys[valleys.length - 2];
      const support2 = valleys[valleys.length - 1];
      const supportSlope =
        (support2.price - support1.price) / (support2.index - support1.index);

      // 确定形态开始和结束的索引
      const startIndex = Math.min(laterPeaks[0].index, support1.index);
      const endIndex = Math.max(laterPeaks[1].index, support2.index);

      // 计算当前的预期支撑位置
      const currentIndex = data.length - 1;
      const projectedSupport =
        support1.price + supportSlope * (currentIndex - support1.index);

      // 计算三角形收敛点
      let convergenceIndex = support1.index;
      if (supportSlope !== 0) {
        convergenceIndex =
          support1.index + (resistanceLevel - support1.price) / supportSlope;
      }

      // 计算当前是否接近收敛点
      const proximityToConvergence =
        1 - Math.min(1, Math.abs(currentIndex - convergenceIndex) / 20);

      // 确定当前价格相对于三角形的位置
      const currentPrice = data[data.length - 1].close;
      let status = PatternStatus.Forming;

      if (currentIndex > endIndex) {
        if (currentPrice > resistanceLevel) {
          status = PatternStatus.Confirmed; // 已突破上方
        } else if (currentPrice < projectedSupport) {
          status = PatternStatus.Failed; // 向下突破（失败）
        } else {
          status = PatternStatus.Completed; // 形成但未突破
        }
      }

      // 计算形态高度
      const patternHeight = resistanceLevel - support1.price;

      // 计算价格目标（向上突破的目标）
      const priceTarget = resistanceLevel + patternHeight;

      // 计算可靠性分数
      const reliability = calculateTriangleReliability(
        data,
        startIndex,
        endIndex,
        patternHeight,
        proximityToConvergence,
        status === PatternStatus.Confirmed,
        PatternType.AscendingTriangle
      );

      patterns.push({
        patternType: PatternType.AscendingTriangle,
        status,
        direction: PatternDirection.Bullish,
        reliability,
        significance: reliability * (patternHeight / currentPrice),
        component: {
          startIndex,
          endIndex,
          keyPoints: [laterPeaks[0], laterPeaks[1], support1, support2],
          patternHeight,
          breakoutLevel: resistanceLevel,
          volumePattern: analyzeTriangleVolume(
            data,
            startIndex,
            endIndex,
            status
          ),
        },
        priceTarget,
        stopLoss: projectedSupport * 0.98, // 支撑线下方2%
        breakoutExpected:
          status === PatternStatus.Completed && proximityToConvergence > 0.7,
        breakoutDirection: PatternDirection.Bullish,
        probableBreakoutZone: [resistanceLevel * 0.98, resistanceLevel * 1.02],
        description: `上升三角形, ${getStatusDescription(status)}, 阻力位在 ${resistanceLevel.toFixed(2)}, 支撑趋势线当前在 ${projectedSupport.toFixed(2)}`,
        tradingImplication: `看涨信号, 突破目标价位: ${priceTarget.toFixed(2)}, 止损位: ${(projectedSupport * 0.98).toFixed(2)}`,
        keyDates: [...peaks.map(p => p.date), ...valleys.map(v => v.date)],
        keyPrices: [...peaks.map(p => p.price), ...valleys.map(v => v.price)],
      });
    }
  }

  // 检测下降三角形（下降阻力线，水平支撑线）
  if (peaks.length >= 2 && valleys.length >= 2) {
    // 检查是否存在下降的高点
    const isDescendingHighs =
      peaks[peaks.length - 1].price < peaks[peaks.length - 2].price;

    // 检查是否存在水平的低点
    const laterValleys = valleys.slice(-2);
    const isHorizontalLows =
      Math.abs(laterValleys[1].price - laterValleys[0].price) /
        laterValleys[0].price <
      0.03;

    if (isDescendingHighs && isHorizontalLows) {
      // 计算下降三角形的支撑线（水平线）
      const supportLevel = (laterValleys[0].price + laterValleys[1].price) / 2;

      // 计算下降三角形的阻力线（下降线）
      const resistance1 = peaks[peaks.length - 2];
      const resistance2 = peaks[peaks.length - 1];
      const resistanceSlope =
        (resistance2.price - resistance1.price) /
        (resistance2.index - resistance1.index);

      // 确定形态开始和结束的索引
      const startIndex = Math.min(resistance1.index, laterValleys[0].index);
      const endIndex = Math.max(resistance2.index, laterValleys[1].index);

      // 计算当前的预期阻力位置
      const currentIndex = data.length - 1;
      const projectedResistance =
        resistance1.price +
        resistanceSlope * (currentIndex - resistance1.index);

      // 计算三角形收敛点
      let convergenceIndex = resistance1.index;
      if (resistanceSlope !== 0) {
        convergenceIndex =
          resistance1.index +
          (supportLevel - resistance1.price) / resistanceSlope;
      }

      // 计算当前是否接近收敛点
      const proximityToConvergence =
        1 - Math.min(1, Math.abs(currentIndex - convergenceIndex) / 20);

      // 确定当前价格相对于三角形的位置
      const currentPrice = data[data.length - 1].close;
      let status = PatternStatus.Forming;

      if (currentIndex > endIndex) {
        if (currentPrice < supportLevel) {
          status = PatternStatus.Confirmed; // 已突破下方
        } else if (currentPrice > projectedResistance) {
          status = PatternStatus.Failed; // 向上突破（失败）
        } else {
          status = PatternStatus.Completed; // 形成但未突破
        }
      }

      // 计算形态高度
      const patternHeight = resistance1.price - supportLevel;

      // 计算价格目标（向下突破的目标）
      const priceTarget = supportLevel - patternHeight;

      // 计算可靠性分数
      const reliability = calculateTriangleReliability(
        data,
        startIndex,
        endIndex,
        patternHeight,
        proximityToConvergence,
        status === PatternStatus.Confirmed,
        PatternType.DescendingTriangle
      );

      patterns.push({
        patternType: PatternType.DescendingTriangle,
        status,
        direction: PatternDirection.Bearish,
        reliability,
        significance: reliability * (patternHeight / currentPrice),
        component: {
          startIndex,
          endIndex,
          keyPoints: [
            resistance1,
            resistance2,
            laterValleys[0],
            laterValleys[1],
          ],
          patternHeight,
          breakoutLevel: supportLevel,
          volumePattern: analyzeTriangleVolume(
            data,
            startIndex,
            endIndex,
            status
          ),
        },
        priceTarget,
        stopLoss: projectedResistance * 1.02, // 阻力线上方2%
        breakoutExpected:
          status === PatternStatus.Completed && proximityToConvergence > 0.7,
        breakoutDirection: PatternDirection.Bearish,
        probableBreakoutZone: [supportLevel * 0.98, supportLevel * 1.02],
        description: `下降三角形, ${getStatusDescription(status)}, 支撑位在 ${supportLevel.toFixed(2)}, 阻力趋势线当前在 ${projectedResistance.toFixed(2)}`,
        tradingImplication: `看跌信号, 突破目标价位: ${priceTarget.toFixed(2)}, 止损位: ${(projectedResistance * 1.02).toFixed(2)}`,
        keyDates: [...peaks.map(p => p.date), ...valleys.map(v => v.date)],
        keyPrices: [...peaks.map(p => p.price), ...valleys.map(v => v.price)],
      });
    }
  }

  // 检测对称三角形（同时有下降阻力线和上升支撑线）
  if (peaks.length >= 2 && valleys.length >= 2) {
    // 检查是否存在下降的高点
    const isDescendingHighs =
      peaks[peaks.length - 1].price < peaks[peaks.length - 2].price;

    // 检查是否存在上升的低点
    const isAscendingLows =
      valleys[valleys.length - 1].price > valleys[valleys.length - 2].price;

    if (isDescendingHighs && isAscendingLows) {
      // 计算对称三角形的阻力线（下降线）
      const resistance1 = peaks[peaks.length - 2];
      const resistance2 = peaks[peaks.length - 1];
      const resistanceSlope =
        (resistance2.price - resistance1.price) /
        (resistance2.index - resistance1.index);

      // 计算对称三角形的支撑线（上升线）
      const support1 = valleys[valleys.length - 2];
      const support2 = valleys[valleys.length - 1];
      const supportSlope =
        (support2.price - support1.price) / (support2.index - support1.index);

      // 确定形态开始和结束的索引
      const startIndex = Math.min(resistance1.index, support1.index);
      const endIndex = Math.max(resistance2.index, support2.index);

      // 计算当前的预期阻力和支撑位置
      const currentIndex = data.length - 1;
      const projectedResistance =
        resistance1.price +
        resistanceSlope * (currentIndex - resistance1.index);
      const projectedSupport =
        support1.price + supportSlope * (currentIndex - support1.index);

      // 计算三角形收敛点
      let convergenceIndex = startIndex;
      if (resistanceSlope !== supportSlope) {
        convergenceIndex =
          startIndex +
          (support1.price - resistance1.price) /
            (resistanceSlope - supportSlope);
      }

      // 计算当前是否接近收敛点
      const proximityToConvergence =
        1 - Math.min(1, Math.abs(currentIndex - convergenceIndex) / 20);

      // 确定当前价格相对于三角形的位置
      const currentPrice = data[data.length - 1].close;
      let status = PatternStatus.Forming;
      let breakoutDirection = PatternDirection.Neutral;

      if (currentIndex > endIndex) {
        if (currentPrice > projectedResistance) {
          status = PatternStatus.Confirmed;
          breakoutDirection = PatternDirection.Bullish;
        } else if (currentPrice < projectedSupport) {
          status = PatternStatus.Confirmed;
          breakoutDirection = PatternDirection.Bearish;
        } else {
          status = PatternStatus.Completed;
        }
      }

      // 计算形态高度
      const patternHeight = resistance1.price - support1.price;

      // 计算价格目标
      let priceTarget = currentPrice;
      if (breakoutDirection === PatternDirection.Bullish) {
        priceTarget = projectedResistance + patternHeight;
      } else if (breakoutDirection === PatternDirection.Bearish) {
        priceTarget = projectedSupport - patternHeight;
      }

      // 计算可靠性分数
      const reliability = calculateTriangleReliability(
        data,
        startIndex,
        endIndex,
        patternHeight,
        proximityToConvergence,
        status === PatternStatus.Confirmed,
        PatternType.SymmetricalTriangle
      );

      patterns.push({
        patternType: PatternType.SymmetricalTriangle,
        status,
        direction: breakoutDirection,
        reliability,
        significance: reliability * (patternHeight / currentPrice),
        component: {
          startIndex,
          endIndex,
          keyPoints: [resistance1, resistance2, support1, support2],
          patternHeight,
          breakoutLevel:
            breakoutDirection === PatternDirection.Bullish
              ? projectedResistance
              : projectedSupport,
          volumePattern: analyzeTriangleVolume(
            data,
            startIndex,
            endIndex,
            status
          ),
        },
        priceTarget,
        stopLoss:
          breakoutDirection === PatternDirection.Bullish
            ? projectedSupport
            : projectedResistance,
        breakoutExpected:
          status === PatternStatus.Completed && proximityToConvergence > 0.7,
        breakoutDirection,
        probableBreakoutZone: [projectedSupport, projectedResistance],
        description: `对称三角形, ${getStatusDescription(status)}${breakoutDirection !== PatternDirection.Neutral ? ', ' + (breakoutDirection === PatternDirection.Bullish ? '向上' : '向下') + '突破' : ''}, 阻力趋势线当前在 ${projectedResistance.toFixed(2)}, 支撑趋势线当前在 ${projectedSupport.toFixed(2)}`,
        tradingImplication:
          status === PatternStatus.Confirmed
            ? `${breakoutDirection === PatternDirection.Bullish ? '看涨' : '看跌'}信号, 目标价位: ${priceTarget.toFixed(2)}, 止损位: ${(breakoutDirection === PatternDirection.Bullish ? projectedSupport : projectedResistance).toFixed(2)}`
            : '等待突破确认，突破方向将决定交易信号',
        keyDates: [...peaks.map(p => p.date), ...valleys.map(v => v.date)],
        keyPrices: [...peaks.map(p => p.price), ...valleys.map(v => v.price)],
      });
    }
  }

  return patterns;
}

/**
 * 加权计算形态可靠性，考虑时间因素
 * 这里以三角形形态为例
 */
function calculateTriangleReliability(
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

  // 2. 形态高度（相对于价格的百分比）
  const avgPrice =
    data.slice(startIndex, endIndex + 1).reduce((sum, d) => sum + d.close, 0) /
    (endIndex - startIndex + 1);
  const heightRatio = patternHeight / avgPrice;

  if (heightRatio > 0.05)
    score += 10; // 形态高度超过5%
  else if (heightRatio > 0.02) score += 5; // 形态高度超过2%

  // 3. 收敛点的接近程度
  score += proximityToConvergence * 15;

  // 4. 确认突破
  if (isBreakoutConfirmed) score += 15;

  // 5. 形态中的触摸点数量
  // 简化处理，假设至少有4个触点
  score += 5;

  // 6. 根据形态类型的不同特性评分
  if (patternType === PatternType.AscendingTriangle) {
    // 检查上升三角形的方向是否符合大趋势
    score += 5;
  } else if (patternType === PatternType.DescendingTriangle) {
    // 检查下降三角形的方向是否符合大趋势
    score += 5;
  }

  // 7. 新增：形态的最近程度评分
  // 计算形态结束点与数据末尾的距离
  const recencyDistance = data.length - 1 - endIndex;

  // 根据形态的近期性加分，距离越近分数越高
  // 最近的形态额外加分，使用衰减函数
  // 远期形态，根据距离衰减
  const decayFactor = Math.exp(-0.03 * (recencyDistance - 30));
  score += 5 * decayFactor;

  // 最后确保分数在0-100范围内
  return Math.max(0, Math.min(100, score));
}

/**
 * 分析三角形形态的成交量特征
 */
function analyzeTriangleVolume(
  data: Candle[],
  startIndex: number,
  endIndex: number,
  status: PatternStatus
): string {
  const volumes = data.slice(startIndex, endIndex + 1).map(d => d.volume);
  const avgVolume = volumes.reduce((sum, v) => sum + v, 0) / volumes.length;

  // 检查成交量趋势
  let volumeTrend = 0;
  for (let i = 1; i < volumes.length; i++) {
    volumeTrend += volumes[i] > volumes[i - 1] ? 1 : -1;
  }

  // 检查突破时的成交量
  let breakoutVolume = 0;
  if (status === PatternStatus.Confirmed && endIndex + 1 < data.length) {
    breakoutVolume = data[endIndex + 1].volume;
  }

  if (volumeTrend < 0) {
    // 成交量收缩是三角形形态的理想情况
    if (
      status === PatternStatus.Confirmed &&
      breakoutVolume > avgVolume * 1.5
    ) {
      return '理想的成交量模式：形态期间成交量收缩，突破时成交量明显放大';
    } else if (status === PatternStatus.Confirmed) {
      return '良好的成交量模式：形态期间成交量收缩，但突破时成交量增幅不明显';
    } else {
      return '形态期间成交量收缩，等待突破时的成交量确认';
    }
  } else if (volumeTrend > 0) {
    // 成交量扩大不是三角形的理想情况
    return '非理想的成交量模式：形态期间成交量未收缩，降低形态可靠性';
  } else {
    return '成交量模式中性，无明显趋势';
  }
}
