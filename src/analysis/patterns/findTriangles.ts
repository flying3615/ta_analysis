import { Candle } from '../../types.js';
import {
  PatternAnalysisResult,
  PatternDirection,
  PatternStatus,
  PatternType,
  PeakValley,
} from './analyzeMultiTimeframePatterns.js';
import { getStatusDescription } from '../../util/util.js';

// 新增：三角形形态无效的原因枚举
export enum InvalidPatternReason {
  None = 'none',
  PriceCrossesTrendlines = 'price_crosses_trendlines',
  TooFlat = 'too_flat',
  NearConvergenceNoBreakout = 'near_convergence_no_breakout',
  AbnormalVolume = 'abnormal_volume',
  IrregularStructure = 'irregular_structure',
  InsufficientTouches = 'insufficient_touches',
  ExcessivePriceVolatility = 'excessive_price_volatility',
}

/**
 * 获取无效原因的描述文本
 */
function getInvalidReasonDescription(reason: InvalidPatternReason): string {
  switch (reason) {
    case InvalidPatternReason.PriceCrossesTrendlines:
      return '价格多次穿越趋势线';
    case InvalidPatternReason.TooFlat:
      return '形态过于扁平';
    case InvalidPatternReason.NearConvergenceNoBreakout:
      return '接近收敛点但未突破';
    case InvalidPatternReason.AbnormalVolume:
      return '成交量出现异常峰值';
    case InvalidPatternReason.IrregularStructure:
      return '形态结构不规则';
    case InvalidPatternReason.InsufficientTouches:
      return '趋势线触碰次数不足';
    case InvalidPatternReason.ExcessivePriceVolatility:
      return '价格波动过大';
    default:
      return '';
  }
}

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

      // 新增：检测形态是否无效
      const isInvalid = checkTriangleInvalid(
        data,
        startIndex,
        endIndex,
        laterPeaks,
        [support1, support2],
        resistanceLevel,
        support1.price,
        supportSlope,
        0, // 水平阻力线斜率为0
        convergenceIndex,
        patternHeight,
        currentPrice,
        PatternType.AscendingTriangle
      );

      // 如果形态无效，则调整状态
      if (isInvalid.invalid && status !== PatternStatus.Confirmed) {
        status = PatternStatus.Failed;
      }

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
        reliability: isInvalid.invalid ? reliability * 0.5 : reliability, // 如果无效，降低可靠性
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
        description: `上升三角形, ${getStatusDescription(status)}${isInvalid.invalid ? `, 警告: ${getInvalidReasonDescription(isInvalid.reason)}` : ''}, 阻力位在 ${resistanceLevel.toFixed(2)}, 支撑趋势线当前在 ${projectedSupport.toFixed(2)}`,
        tradingImplication: `看涨信号${isInvalid.invalid ? ' (可信度降低)' : ''}, 突破目标价位: ${priceTarget.toFixed(2)}, 止损位: ${(projectedSupport * 0.98).toFixed(2)}`,
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

      // 新增：检测形态是否无效
      const isInvalid = checkTriangleInvalid(
        data,
        startIndex,
        endIndex,
        [resistance1, resistance2],
        laterValleys,
        resistance1.price,
        supportLevel,
        resistanceSlope,
        0, // 水平支撑线斜率为0
        convergenceIndex,
        patternHeight,
        currentPrice,
        PatternType.DescendingTriangle
      );

      // 如果形态无效，则调整状态
      if (isInvalid.invalid && status !== PatternStatus.Confirmed) {
        status = PatternStatus.Failed;
      }

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
        reliability: isInvalid.invalid ? reliability * 0.5 : reliability, // 如果无效，降低可靠性
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
        description: `下降三角形, ${getStatusDescription(status)}${isInvalid.invalid ? `, 警告: ${getInvalidReasonDescription(isInvalid.reason)}` : ''}, 支撑位在 ${supportLevel.toFixed(2)}, 阻力趋势线当前在 ${projectedResistance.toFixed(2)}`,
        tradingImplication: `看跌信号${isInvalid.invalid ? ' (可信度降低)' : ''}, 突破目标价位: ${priceTarget.toFixed(2)}, 止损位: ${(projectedResistance * 1.02).toFixed(2)}`,
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

      // 新增：检测形态是否无效
      const isInvalid = checkTriangleInvalid(
        data,
        startIndex,
        endIndex,
        [resistance1, resistance2],
        [support1, support2],
        resistance1.price,
        support1.price,
        resistanceSlope,
        supportSlope,
        convergenceIndex,
        patternHeight,
        currentPrice,
        PatternType.SymmetricalTriangle
      );

      // 如果形态无效，则调整状态
      if (isInvalid.invalid && status !== PatternStatus.Confirmed) {
        status = PatternStatus.Failed;
      }

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
        reliability: isInvalid.invalid ? reliability * 0.5 : reliability, // 如果无效，降低可靠性
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
        description: `对称三角形, ${getStatusDescription(status)}${isInvalid.invalid ? `, 警告: ${getInvalidReasonDescription(isInvalid.reason)}` : ''}${breakoutDirection !== PatternDirection.Neutral ? ', ' + (breakoutDirection === PatternDirection.Bullish ? '向上' : '向下') + '突破' : ''}, 阻力趋势线当前在 ${projectedResistance.toFixed(2)}, 支撑趋势线当前在 ${projectedSupport.toFixed(2)}`,
        tradingImplication:
          status === PatternStatus.Confirmed
            ? `${breakoutDirection === PatternDirection.Bullish ? '看涨' : '看跌'}信号${isInvalid.invalid ? ' (可信度降低)' : ''}, 目标价位: ${priceTarget.toFixed(2)}, 止损位: ${(breakoutDirection === PatternDirection.Bullish ? projectedSupport : projectedResistance).toFixed(2)}`
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

/**
 * 新增：检查三角形形态是否无效
 * 返回一个对象，包含是否无效的布尔值和无效的原因
 */
interface InvalidCheckResult {
  invalid: boolean;
  reason: InvalidPatternReason;
}

function checkTriangleInvalid(
  data: Candle[],
  startIndex: number,
  endIndex: number,
  peaks: PeakValley[],
  valleys: PeakValley[],
  topInitialPrice: number,
  bottomInitialPrice: number,
  topSlope: number,
  bottomSlope: number,
  convergenceIndex: number,
  patternHeight: number,
  currentPrice: number,
  patternType: PatternType
): InvalidCheckResult {
  // 默认结果为有效
  const result: InvalidCheckResult = {
    invalid: false,
    reason: InvalidPatternReason.None,
  };

  // 获取形态内的价格数据
  const patternData = data.slice(startIndex, endIndex + 1);

  // 1. 检查形态是否过于扁平
  const avgPrice =
    patternData.reduce((sum, d) => sum + d.close, 0) / patternData.length;
  const heightRatio = patternHeight / avgPrice;

  if (heightRatio < 0.01) {
    // 如果形态高度小于平均价格的1%，认为过于扁平
    result.invalid = true;
    result.reason = InvalidPatternReason.TooFlat;
    return result;
  }

  // 2. 检查是否有足够的价格触碰趋势线
  // 检查上趋势线和下趋势线的价格触碰次数
  const touchesNeeded = 3; // 至少需要3次触碰才视为有效形态

  // 计算有多少次价格接触到阻力线和支撑线
  let topTouches = 0;
  let bottomTouches = 0;

  for (let i = startIndex; i <= endIndex; i++) {
    const relativeIndex = i - startIndex;
    // 计算当前位置的趋势线价格
    const topTrendLine = topInitialPrice + topSlope * relativeIndex;
    const bottomTrendLine = bottomInitialPrice + bottomSlope * relativeIndex;

    const highPrice = data[i].high;
    const lowPrice = data[i].low;

    // 如果高价接近阻力线，计为一次触碰
    if (Math.abs(highPrice - topTrendLine) / topTrendLine < 0.005) {
      topTouches++;
    }

    // 如果低价接近支撑线，计为一次触碰
    if (Math.abs(lowPrice - bottomTrendLine) / bottomTrendLine < 0.005) {
      bottomTouches++;
    }
  }

  // 如果触碰次数不足，标记为无效
  if (topTouches < touchesNeeded || bottomTouches < touchesNeeded) {
    result.invalid = true;
    result.reason = InvalidPatternReason.InsufficientTouches;
    return result;
  }

  // 3. 检查价格是否多次穿越趋势线（表明形态不稳定）
  let topBreaches = 0;
  let bottomBreaches = 0;

  for (let i = startIndex; i <= endIndex; i++) {
    const relativeIndex = i - startIndex;
    const topTrendLine = topInitialPrice + topSlope * relativeIndex;
    const bottomTrendLine = bottomInitialPrice + bottomSlope * relativeIndex;

    const highPrice = data[i].high;
    const lowPrice = data[i].low;

    // 检查是否有穿越顶部趋势线
    if (highPrice > topTrendLine * 1.01) {
      topBreaches++;
    }

    // 检查是否有穿越底部趋势线
    if (lowPrice < bottomTrendLine * 0.99) {
      bottomBreaches++;
    }
  }

  // 如果有多次严重穿越，形态可能无效
  if (topBreaches > 2 || bottomBreaches > 2) {
    result.invalid = true;
    result.reason = InvalidPatternReason.PriceCrossesTrendlines;
    return result;
  }

  // 4. 检测临近收敛点但长时间未突破
  // 计算当前位置距离收敛点的距离
  const currentIndex = data.length - 1;
  const distanceToConvergence = Math.abs(currentIndex - convergenceIndex);

  // 如果接近收敛点（距离小于10个bar）但尚未突破且长时间处于横盘状态
  if (distanceToConvergence < 10 && currentIndex > endIndex + 15) {
    // 判断最近是否横盘 - 计算最近价格的标准差
    const recentPrices = data
      .slice(endIndex + 1, currentIndex + 1)
      .map(d => d.close);
    const avg =
      recentPrices.reduce((sum, p) => sum + p, 0) / recentPrices.length;
    const stdDev = Math.sqrt(
      recentPrices.reduce((sum, p) => sum + Math.pow(p - avg, 2), 0) /
        recentPrices.length
    );

    // 如果价格波动很小且接近收敛点，形态可能失效
    if (stdDev / avg < 0.01) {
      result.invalid = true;
      result.reason = InvalidPatternReason.NearConvergenceNoBreakout;
      return result;
    }
  }

  // 5. 检测形态期间的异常成交量
  // 计算成交量的均值和标准差
  const volumes = patternData.map(d => d.volume);
  const avgVolume = volumes.reduce((sum, v) => sum + v, 0) / volumes.length;
  const volumeStdDev = Math.sqrt(
    volumes.reduce((sum, v) => sum + Math.pow(v - avgVolume, 2), 0) /
      volumes.length
  );

  // 检查是否有异常大的成交量
  const abnormalVolumeCount = volumes.filter(
    v => v > avgVolume + 2.5 * volumeStdDev
  ).length;

  // 如果有多个异常大的成交量峰值，可能表明形态不稳定
  if (abnormalVolumeCount > 2) {
    result.invalid = true;
    result.reason = InvalidPatternReason.AbnormalVolume;
    return result;
  }

  // 6. 检测形态内部结构的规则性
  // 计算价格的波动率
  const closePrices = patternData.map(d => d.close);
  const priceChanges = [];
  for (let i = 1; i < closePrices.length; i++) {
    priceChanges.push(Math.abs(closePrices[i] / closePrices[i - 1] - 1));
  }

  // 计算平均日波动率
  const avgDailyChange =
    priceChanges.reduce((sum, c) => sum + c, 0) / priceChanges.length;

  // 计算极端波动的天数
  const extremeChangeDays = priceChanges.filter(
    c => c > avgDailyChange * 3
  ).length;

  // 如果有多个日内极端波动，形态可能不规则
  if (extremeChangeDays > patternData.length * 0.15) {
    result.invalid = true;
    result.reason = InvalidPatternReason.ExcessivePriceVolatility;
    return result;
  }

  // 7. 如果是对称三角形，检查形态的对称性
  if (patternType === PatternType.SymmetricalTriangle) {
    // 计算趋势线斜率的绝对值比率，理想情况下应接近1（对称）
    const slopeRatio = Math.abs(topSlope) / Math.abs(bottomSlope);

    // 如果斜率比率过大或过小，表明形态不够对称
    if (slopeRatio > 2.5 || slopeRatio < 0.4) {
      result.invalid = true;
      result.reason = InvalidPatternReason.IrregularStructure;
      return result;
    }
  }

  return result;
}
