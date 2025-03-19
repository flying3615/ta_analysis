import { Candle } from '../../types.js';
import { getStockDataForTimeframe, toEDTString } from '../../util/util.js';

import _ from 'lodash';
import { findHeadAndShoulders } from './findHeadAndShoulders.js';
import { findDoubleTopsAndBottoms } from './findDoubleTopsAndBottoms.js';
import { findTriangles } from './findTriangles.js';
import { findWedges } from './findWedges.js';
import { findFlagsAndPennants } from './findFlagsAndPennants.js';
import { findCupAndHandle } from './findCupAndHandle.js';
import { findRoundingPatterns } from './findRoundingPatterns.js';
import { findBuyingClimax } from './findBuyingClimax.js';
import { findSellingClimax } from './findSellingClimax.js';

/**
 * 价格形态类型枚举
 */
enum PatternType {
  HeadAndShoulders = 'head_and_shoulders',
  InverseHeadAndShoulders = 'inverse_head_and_shoulders',
  DoubleTop = 'double_top',
  DoubleBottom = 'double_bottom',
  TripleTop = 'triple_top',
  TripleBottom = 'triple_bottom',
  AscendingTriangle = 'ascending_triangle',
  DescendingTriangle = 'descending_triangle',
  SymmetricalTriangle = 'symmetrical_triangle',
  RisingWedge = 'rising_wedge',
  FallingWedge = 'falling_wedge',
  Rectangle = 'rectangle',
  Flag = 'flag',
  Pennant = 'pennant',
  CupAndHandle = 'cup_and_handle',
  RoundingBottom = 'rounding_bottom',
  RoundingTop = 'rounding_top',
  BuyingClimax = 'buying_climax',
  SellingClimax = 'selling_climax',
}

/**
 * 形态识别状态枚举
 */
enum PatternStatus {
  Forming = 'forming', // 正在形成
  Completed = 'completed', // 已完成但未确认突破
  Confirmed = 'confirmed', // 已确认突破
  Failed = 'failed', // 形成后失败
}

/**
 * 形态趋势方向枚举
 */
enum PatternDirection {
  Bullish = 'bullish', // 看多形态
  Bearish = 'bearish', // 看空形态
  Neutral = 'neutral', // 中性形态
}

/**
 * 峰谷点类型
 */
interface PeakValley {
  index: number; // 在K线数组中的索引
  price: number; // 价格（高点或低点）
  date: Date; // 日期
  type: 'peak' | 'valley'; // 峰或谷
}

/**
 * 形态组成部分
 */
interface PatternComponent {
  startIndex: number; // 形态开始点在K线数组中的索引
  endIndex: number; // 形态结束点在K线数组中的索引
  keyPoints: PeakValley[]; // 形态的关键点
  patternHeight: number; // 形态高度（最高点与最低点的价差）
  breakoutLevel: number; // 突破价位（颈线）
  volumePattern: string; // 成交量特征
}

/**
 * 价格形态分析结果
 */
interface PatternAnalysisResult {
  patternType: PatternType; // 形态类型
  status: PatternStatus; // 形态状态
  direction: PatternDirection; // 形态方向
  reliability: number; // 可靠性评分(0-100)
  significance: number; // 重要性评分(0-100)

  component: PatternComponent; // 形态组成部分

  priceTarget?: number; // 价格目标（如果形态已确认）
  stopLoss?: number; // 建议止损位

  breakoutExpected?: boolean; // 是否预期将发生突破
  breakoutDirection?: PatternDirection; // 预期突破方向
  probableBreakoutZone?: [number, number]; // 可能的突破区域

  description: string; // 形态描述
  tradingImplication: string; // 交易含义

  keyDates: Date[]; // 关键日期
  keyPrices: number[]; // 关键价格
}

/**
 * 多时间周期形态分析结果
 */
interface AnalyzeMultiTimeframePatterns {
  timeframe: 'weekly' | 'daily' | '1hour';
  patterns: PatternAnalysisResult[];
  dominantPattern?: PatternAnalysisResult; // 主导形态
  patternSignal: PatternDirection; // 形态综合信号
}

/**
 * 完整的价格形态分析结果，包含所有时间周期
 */
interface ComprehensivePatternAnalysis {
  timeframeAnalyses: AnalyzeMultiTimeframePatterns[];
  combinedSignal: PatternDirection; // 综合信号
  signalStrength: number; // 信号强度(0-100)
  description: string; // 总体形态分析描述
}

/**
 * 增强型峰谷检测函数，更注重最近的价格波动
 * @param data K线数据
 * @param windowSize 用于峰谷检测的窗口大小
 * @param recentEmphasis 最近数据的权重因子
 */
function detectPeaksAndValleys(
  data: Candle[],
  windowSize: number = 5,
  recentEmphasis: boolean = true
): PeakValley[] {
  const result: PeakValley[] = [];

  // 确保有足够的数据
  if (data.length < windowSize * 2 + 1) {
    return result;
  }

  for (let i = windowSize; i < data.length - windowSize; i++) {
    const current = data[i];
    let isPeak = true;
    let isValley = true;

    // 检查是否是峰
    for (let j = i - windowSize; j < i; j++) {
      if (data[j].high >= current.high) {
        isPeak = false;
        break;
      }
    }

    for (let j = i + 1; j <= i + windowSize; j++) {
      if (data[j].high >= current.high) {
        isPeak = false;
        break;
      }
    }

    // 检查是否是谷
    for (let j = i - windowSize; j < i; j++) {
      if (data[j].low <= current.low) {
        isValley = false;
        break;
      }
    }

    for (let j = i + 1; j <= i + windowSize; j++) {
      if (data[j].low <= current.low) {
        isValley = false;
        break;
      }
    }

    if (isPeak) {
      result.push({
        index: i,
        price: current.high,
        date: current.timestamp,
        type: 'peak',
      });
    } else if (isValley) {
      result.push({
        index: i,
        price: current.low,
        date: current.timestamp,
        type: 'valley',
      });
    }
  }

  // 当启用最近数据强调时，对峰谷点按照与当前时间的接近程度进行排序
  if (recentEmphasis && result.length > 0) {
    const lastIndex = data.length - 1;

    // 对每个峰谷点的重要性进行加权
    for (const point of result) {
      // 计算与最后一个K线的距离
      const distance = lastIndex - point.index;

      // 添加一个重要性属性，随着距离增加而降低
      (point as any).importance = Math.exp(-0.01 * distance);
    }

    // 按照新的重要性属性排序
    result.sort((a, b) => (b as any).importance - (a as any).importance);
  }

  return result;
}

/**
 * 主函数：分析所有形态，增强最近形态的重要性
 * @param rawData K线数据
 * @param timeframe 时间周期
 */
async function analyzeAllPatterns(
  rawData: Candle[],
  timeframe: 'weekly' | 'daily' | '1hour'
): Promise<AnalyzeMultiTimeframePatterns> {
  // 仅保留最近100根K线
  const data = rawData.slice(-100);

  // 检测所有峰谷点
  const peaksValleys = detectPeaksAndValleys(data);

  // 分析所有形态
  const headAndShoulders = findHeadAndShoulders(data, peaksValleys);
  const doubleTopsBottoms = findDoubleTopsAndBottoms(data, peaksValleys);
  const triangles = findTriangles(data, peaksValleys);
  const wedges = findWedges(data, peaksValleys);
  const flagsPennants = findFlagsAndPennants(data, peaksValleys);
  const cupHandle = findCupAndHandle(data, peaksValleys);
  const roundingPatterns = findRoundingPatterns(data, peaksValleys);
  const buyingClimax = findBuyingClimax(data, peaksValleys);

  // 分析卖出高潮形态
  const sellingClimax = findSellingClimax(data, peaksValleys);

  // 合并所有形态
  const allPatterns = [
    ...headAndShoulders,
    ...doubleTopsBottoms,
    ...triangles,
    ...wedges,
    ...flagsPennants,
    ...cupHandle,
    ...roundingPatterns,
    ...buyingClimax,
    ...sellingClimax,
  ];

  // 计算当前最后一根K线的索引
  const lastIndex = data.length - 1;

  // 修改每个形态的重要性，根据形态结束点与最后一根K线的距离加权
  allPatterns.forEach(pattern => {
    // 计算形态结束点与当前点的距离
    const distanceFromCurrent = lastIndex - pattern.component.endIndex;

    // 计算距离因子：距离越近，因子越大
    // 使用指数衰减函数，可以根据需要调整衰减速率
    const distanceFactor = Math.exp(-0.05 * distanceFromCurrent);

    // 更新形态的重要性，与距离因子成正比
    pattern.significance = pattern.significance * distanceFactor;

    // 为已确认突破的形态额外加分
    if (pattern.status === PatternStatus.Confirmed) {
      pattern.significance *= 1.5;
    }

    // 对正在形成中但接近完成的形态增加一定权重
    if (
      pattern.status === PatternStatus.Forming &&
      pattern.breakoutExpected &&
      distanceFromCurrent < 5
    ) {
      pattern.significance *= 1.3;
    }
  });

  // 按照调整后的可靠性和重要性排序
  allPatterns.sort(
    (a, b) => b.reliability * b.significance - a.reliability * a.significance
  );

  // 确定主导形态
  const dominantPattern = allPatterns.length > 0 ? allPatterns[0] : undefined;

  // 确定形态综合信号，更偏重于最近的形态
  let patternSignal = PatternDirection.Neutral;
  let bullishScore = 0;
  let bearishScore = 0;

  // 仅考虑最近的N个形态来确定信号方向
  const recentPatternCount = Math.min(10, allPatterns.length);
  const recentPatterns = allPatterns.slice(0, recentPatternCount);

  for (const pattern of recentPatterns) {
    const patternWeight = pattern.reliability * pattern.significance;

    if (pattern.direction === PatternDirection.Bullish) {
      bullishScore += patternWeight;
    } else if (pattern.direction === PatternDirection.Bearish) {
      bearishScore += patternWeight;
    }
  }

  if (bullishScore > bearishScore * 1.5) {
    patternSignal = PatternDirection.Bullish;
  } else if (bearishScore > bullishScore * 1.5) {
    patternSignal = PatternDirection.Bearish;
  } else if (bullishScore > bearishScore) {
    patternSignal = PatternDirection.Bullish;
  } else if (bearishScore > bullishScore) {
    patternSignal = PatternDirection.Bearish;
  }

  // 返回分析结果
  return {
    timeframe,
    patterns: allPatterns,
    dominantPattern,
    patternSignal,
  };
}

/**
 * 综合多时间周期的形态分析，更注重最近形态
 * @param timeframeAnalyses 各时间周期的形态分析结果
 */
function combinePatternAnalyses(
  timeframeAnalyses: AnalyzeMultiTimeframePatterns[]
): ComprehensivePatternAnalysis {
  // 计算综合信号
  let bullishCount = 0;
  let bearishCount = 0;
  let neutralCount = 0;

  // 对不同时间周期的信号进行加权，短期时间周期权重更高
  const timeframeWeights = {
    weekly: 1.0,
    daily: 1.5,
    '1hour': 2.0,
  };

  for (const analysis of timeframeAnalyses) {
    const weight = timeframeWeights[analysis.timeframe] || 1.0;

    if (analysis.patternSignal === PatternDirection.Bullish) {
      bullishCount += weight;
    } else if (analysis.patternSignal === PatternDirection.Bearish) {
      bearishCount += weight;
    } else {
      neutralCount += weight;
    }
  }

  let combinedSignal: PatternDirection;

  if (bullishCount > bearishCount * 1.2) {
    combinedSignal = PatternDirection.Bullish;
  } else if (bearishCount > bullishCount * 1.2) {
    combinedSignal = PatternDirection.Bearish;
  } else {
    combinedSignal = PatternDirection.Neutral;
  }

  // 计算信号强度
  let signalStrength = 50; // 中性起点
  const totalWeight = Object.values(timeframeWeights).reduce(
    (sum, weight) => sum + weight,
    0
  );

  if (combinedSignal === PatternDirection.Bullish) {
    signalStrength += 20 * (bullishCount / totalWeight);
    signalStrength +=
      15 *
      (bullishCount > totalWeight / 2 ? 1 : bullishCount / (totalWeight / 2)); // 多个时间周期一致加分

    // 检查短期时间周期
    const hourlyAnalysis = timeframeAnalyses.find(a => a.timeframe === '1hour');
    if (
      hourlyAnalysis &&
      hourlyAnalysis.patternSignal === PatternDirection.Bullish
    ) {
      signalStrength += 10; // 短期看涨加分
    }

    // 检查日线
    const dailyAnalysis = timeframeAnalyses.find(a => a.timeframe === 'daily');
    if (
      dailyAnalysis &&
      dailyAnalysis.patternSignal === PatternDirection.Bullish
    ) {
      signalStrength += 15; // 日线看涨加分
    }
  } else if (combinedSignal === PatternDirection.Bearish) {
    signalStrength += 20 * (bearishCount / totalWeight);
    signalStrength +=
      15 *
      (bearishCount > totalWeight / 2 ? 1 : bearishCount / (totalWeight / 2)); // 多个时间周期一致加分

    // 检查短期时间周期
    const hourlyAnalysis = timeframeAnalyses.find(a => a.timeframe === '1hour');
    if (
      hourlyAnalysis &&
      hourlyAnalysis.patternSignal === PatternDirection.Bearish
    ) {
      signalStrength += 10; // 短期看跌加分
    }

    // 检查日线
    const dailyAnalysis = timeframeAnalyses.find(a => a.timeframe === 'daily');
    if (
      dailyAnalysis &&
      dailyAnalysis.patternSignal === PatternDirection.Bearish
    ) {
      signalStrength += 15; // 日线看跌加分
    }
  }

  // 检查主导形态的可靠性和最近程度
  for (const analysis of timeframeAnalyses) {
    if (analysis.dominantPattern) {
      const pattern = analysis.dominantPattern;
      if (pattern.reliability > 70) {
        signalStrength += 10;
      }

      // 根据形态的最近程度额外加分
      // 获取该时间周期数据的长度（通过分析主导形态的位置估算）
      if (pattern.component) {
        // 计算形态结束位置与当前位置的距离
        const patternEndIndex = pattern.component.endIndex;
        const estimatedDataLength =
          patternEndIndex + (patternEndIndex - pattern.component.startIndex); // 估计数据长度

        // 计算接近程度比率 - 越接近1表示越近期
        const recencyRatio = patternEndIndex / estimatedDataLength;

        if (recencyRatio > 0.8) {
          // 非常近期的形态
          signalStrength += 10;
        } else if (recencyRatio > 0.6) {
          // 较近期的形态
          signalStrength += 5;
        }
      }
    }
  }

  // 确保信号强度在0-100范围内
  signalStrength = Math.max(0, Math.min(100, signalStrength));

  // 生成总体描述
  let description = '';

  if (combinedSignal === PatternDirection.Bullish) {
    description = `综合形态分析显示看涨信号`;
  } else if (combinedSignal === PatternDirection.Bearish) {
    description = `综合形态分析显示看跌信号`;
  } else {
    description = `综合形态分析显示中性信号`;
  }

  description += `，信号强度: ${signalStrength.toFixed(2)}/100。`;

  // 添加短期和长期一致性描述
  const hourlySignal = timeframeAnalyses.find(
    a => a.timeframe === '1hour'
  )?.patternSignal;
  const dailySignal = timeframeAnalyses.find(
    a => a.timeframe === 'daily'
  )?.patternSignal;
  const weeklySignal = timeframeAnalyses.find(
    a => a.timeframe === 'weekly'
  )?.patternSignal;

  if (
    hourlySignal === dailySignal &&
    hourlySignal === weeklySignal &&
    hourlySignal !== PatternDirection.Neutral
  ) {
    description += ` 短期和长期形态分析一致${hourlySignal === PatternDirection.Bullish ? '看涨' : '看跌'}，信号非常可靠。`;
  } else if (
    hourlySignal === dailySignal &&
    hourlySignal !== PatternDirection.Neutral
  ) {
    description += ` 短期和中期形态分析一致${hourlySignal === PatternDirection.Bullish ? '看涨' : '看跌'}，信号较为可靠。`;
  } else if (
    dailySignal === weeklySignal &&
    dailySignal !== PatternDirection.Neutral
  ) {
    description += ` 中期和长期形态分析一致${dailySignal === PatternDirection.Bullish ? '看涨' : '看跌'}，但短期可能有波动。`;
  } else if (hourlySignal !== PatternDirection.Neutral) {
    description += ` 短期形态分析显示${hourlySignal === PatternDirection.Bullish ? '看涨' : '看跌'}，建议关注短线机会。`;
  }

  const hourlyAnalyses = timeframeAnalyses.find(a => a.timeframe === '1hour');
  const dailyAnalyses = timeframeAnalyses.find(a => a.timeframe === 'daily');

  // 添加主导形态描述，优先展示短期和日线周期的主导形态
  const hourlyDominant = hourlyAnalyses?.dominantPattern;
  const dailyDominant = dailyAnalyses?.dominantPattern;

  const hourlyOtherPatternsDesc = hourlyAnalyses?.patterns
    .filter(p => p !== hourlyDominant)
    .map(p => {
      const datePriceMapping = _.zip(p.keyDates, p.keyPrices);
      return `${p.patternType} ${datePriceMapping.map(([date, price]) => `${toEDTString(date)} @ (${price.toFixed(2)})`).join(' | ')}`;
    })
    .join('\n');

  const dailyOtherPatternsDesc = dailyAnalyses?.patterns
    .filter(p => p !== dailyDominant)
    .map(p => {
      const datePriceMapping = _.zip(p.keyDates, p.keyPrices);
      return `${p.patternType} ${datePriceMapping.map(([date, price]) => `${toEDTString(date)} @ (${price.toFixed(2)})`).join(' | ')}`;
    })
    .join('\n');

  if (hourlyDominant) {
    const datePriceMapping = _.zip(
      hourlyDominant.keyDates,
      hourlyDominant.keyPrices
    );

    description += `\n\n小时线主导形态: ${hourlyDominant.patternType}
    \n 关键时间: ${datePriceMapping.map(([date, price]) => `${toEDTString(date)} @ (${price.toFixed(2)})`).join(' | ')}, (${hourlyDominant.direction === PatternDirection.Bullish ? '看涨' : '看跌'})，可靠性: ${hourlyDominant.reliability.toFixed(2)}/100。`;
  }

  if (dailyDominant) {
    const datePriceMapping = _.zip(
      dailyDominant.keyDates,
      dailyDominant.keyPrices
    );
    description += `\n\n日线主导形态: ${dailyDominant.patternType}
    \n 关键时间: ${datePriceMapping.map(([date, price]) => `${toEDTString(date)} @ (${price.toFixed(2)})`).join(' | ')}, (${dailyDominant.direction === PatternDirection.Bullish ? '看涨' : '看跌'})，可靠性: ${dailyDominant.reliability.toFixed(2)}/100。`;
  }

  // 添加其他形态描述
  if (hourlyOtherPatternsDesc) {
    description += `\n\n小时线其他形态:\n ${hourlyOtherPatternsDesc}`;
  }

  if (dailyOtherPatternsDesc) {
    description += `\n\n日线其他形态:\n ${dailyOtherPatternsDesc}`;
  }

  return {
    timeframeAnalyses,
    combinedSignal,
    signalStrength,
    description,
  };
}

/**
 * 导出的API函数：多时间周期的价格形态分析
 */
async function analyzeMultiTimeframePatterns(
  weeklyData: Candle[],
  dailyData: Candle[],
  hourlyData: Candle[]
): Promise<ComprehensivePatternAnalysis> {
  // 分析各个时间周期的形态
  const weeklyAnalysis = await analyzeAllPatterns(weeklyData, 'weekly');
  const dailyAnalysis = await analyzeAllPatterns(dailyData, 'daily');
  const hourlyAnalysis = await analyzeAllPatterns(hourlyData, '1hour');

  // 综合分析
  return combinePatternAnalyses([
    weeklyAnalysis,
    dailyAnalysis,
    hourlyAnalysis,
  ]);
}

/**
 * 格式化并打印形态分析结果
 * @param analysisResult 综合形态分析结果
 * @param symbol 股票代码
 */
function formatAndPrintPatternAnalysis(
  analysisResult: ComprehensivePatternAnalysis,
  symbol: string = ''
): void {
  // 显示综合结果标题
  console.log(`\n===== ${symbol ? symbol + ' ' : ''}形态分析综合结果 =====`);
  console.log(`${analysisResult.description}`);

  // 信号强度和一致性
  console.log(`信号强度: ${analysisResult.signalStrength.toFixed(2)}/100`);

  // 按时间周期计算看涨和看跌形态的数量
  const patternCountsByTimeframe = analysisResult.timeframeAnalyses.map(tfa => {
    const bullishPatterns = tfa.patterns.filter(
      p => p.direction === PatternDirection.Bullish
    );
    const bearishPatterns = tfa.patterns.filter(
      p => p.direction === PatternDirection.Bearish
    );
    const neutralPatterns = tfa.patterns.filter(
      p => p.direction === PatternDirection.Neutral
    );

    return {
      timeframe: tfa.timeframe,
      bullish: bullishPatterns.length,
      bearish: bearishPatterns.length,
      neutral: neutralPatterns.length,
      total: tfa.patterns.length,
      signal: tfa.patternSignal,
    };
  });

  console.log('\n----- 各时间周期信号分布 -----');
  console.log('时间周期   | 看涨  | 看空  | 中性  | 总计  | 综合信号');
  console.log('----------|-------|-------|-------|-------|--------');

  patternCountsByTimeframe.forEach(count => {
    const timeframeLabel =
      count.timeframe === 'weekly'
        ? '周线     '
        : count.timeframe === 'daily'
          ? '日线     '
          : '小时线   ';
    const signalText =
      count.signal === PatternDirection.Bullish
        ? '看涨'
        : count.signal === PatternDirection.Bearish
          ? '看空'
          : '中性';

    console.log(
      `${timeframeLabel}| ${count.bullish.toString().padEnd(5)} | ${count.bearish.toString().padEnd(5)} | ${count.neutral.toString().padEnd(5)} | ${count.total.toString().padEnd(5)} | ${signalText}`
    );
  });

  // 按照时间周期显示主导形态
  console.log('\n===== 主导形态分析 =====');

  analysisResult.timeframeAnalyses.forEach(tfa => {
    const timeframeLabel =
      tfa.timeframe === 'weekly'
        ? '周线'
        : tfa.timeframe === 'daily'
          ? '日线'
          : '小时线';

    console.log(`\n----- ${timeframeLabel}主导形态 -----`);

    if (tfa.dominantPattern) {
      const pattern = tfa.dominantPattern;
      const patternTypeMap: { [key: string]: string } = {
        head_and_shoulders: '头肩顶',
        inverse_head_and_shoulders: '头肩底',
        double_top: '双顶',
        double_bottom: '双底',
        triple_top: '三重顶',
        triple_bottom: '三重底',
        ascending_triangle: '上升三角形',
        descending_triangle: '下降三角形',
        symmetrical_triangle: '对称三角形',
        rising_wedge: '上升楔形',
        falling_wedge: '下降楔形',
        rectangle: '矩形',
        flag: '旗形',
        pennant: '三角旗',
        cup_and_handle: '杯柄',
        rounding_bottom: '圆底',
        rounding_top: '圆顶',
      };

      const statusMap: { [key: string]: string } = {
        forming: '正在形成中',
        completed: '已完成但未突破',
        confirmed: '已确认突破',
        failed: '形成后失败',
      };

      const patternName =
        patternTypeMap[pattern.patternType] || pattern.patternType;
      const statusText = statusMap[pattern.status] || pattern.status;
      const directionText =
        pattern.direction === PatternDirection.Bullish
          ? '看涨'
          : pattern.direction === PatternDirection.Bearish
            ? '看空'
            : '中性';

      console.log(`形态类型: ${patternName}`);
      console.log(`方向: ${directionText}  |  状态: ${statusText}`);
      console.log(
        `可靠性评分: ${pattern.reliability.toFixed(2)}/100  |  重要性: ${pattern.significance.toFixed(2)}/100`
      );
      console.log(
        `目标价位: ${pattern.priceTarget ? pattern.priceTarget.toFixed(2) : '未计算'}  |  止损位: ${pattern.stopLoss ? pattern.stopLoss.toFixed(2) : '未计算'}`
      );

      if (pattern.probableBreakoutZone) {
        console.log(
          `可能突破区间: ${pattern.probableBreakoutZone[0].toFixed(2)} - ${pattern.probableBreakoutZone[1].toFixed(2)}`
        );
      }

      console.log(`形态描述: ${pattern.description}`);
      console.log(`交易含义: ${pattern.tradingImplication}`);
    } else {
      console.log('未检测到显著形态');
    }

    // 显示该时间周期检测到的所有形态
    const bullishPatterns = tfa.patterns.filter(
      p => p.direction === PatternDirection.Bullish
    );
    const bearishPatterns = tfa.patterns.filter(
      p => p.direction === PatternDirection.Bearish
    );

    if (bullishPatterns.length > 0 || bearishPatterns.length > 0) {
      console.log(`\n${timeframeLabel}检测到的其他形态:`);

      if (bullishPatterns.length > 0) {
        console.log('  看涨形态:');
        bullishPatterns.slice(0, 3).forEach((p, idx) => {
          if (idx === 0 && p === tfa.dominantPattern) return; // 跳过已经详细显示的主导形态
          console.log(
            `   - ${p.patternType} (可靠性: ${p.reliability.toFixed(2)})`
          );
        });
        if (bullishPatterns.length > 3)
          console.log(`   ... 等共${bullishPatterns.length}个看涨形态`);
      }

      if (bearishPatterns.length > 0) {
        console.log('  看空形态:');
        bearishPatterns.slice(0, 3).forEach((p, idx) => {
          if (idx === 0 && p === tfa.dominantPattern) return; // 跳过已经详细显示的主导形态
          console.log(
            `   - ${p.patternType} (可靠性: ${p.reliability.toFixed(2)})`
          );
        });
        if (bearishPatterns.length > 3)
          console.log(`   ... 等共${bearishPatterns.length}个看空形态`);
      }
    }
  });

  // 显示关键价位
  console.log('\n===== 关键价位分析 =====');

  // 按照时间周期收集支撑位和阻力位
  analysisResult.timeframeAnalyses.forEach(tfa => {
    const timeframeLabel =
      tfa.timeframe === 'weekly'
        ? '周线'
        : tfa.timeframe === 'daily'
          ? '日线'
          : '小时线';

    // 收集该时间周期所有形态中提到的关键价位
    const supportLevels: number[] = [];
    const resistanceLevels: number[] = [];

    tfa.patterns.forEach(p => {
      // 根据形态方向添加关键价位
      if (p.direction === PatternDirection.Bullish) {
        // 在看涨形态中，突破位通常是阻力位，止损通常是支撑位附近
        resistanceLevels.push(p.component.breakoutLevel);
        if (p.stopLoss) supportLevels.push(p.stopLoss);
      } else if (p.direction === PatternDirection.Bearish) {
        // 在看跌形态中，突破位通常是支撑位，止损通常是阻力位附近
        supportLevels.push(p.component.breakoutLevel);
        if (p.stopLoss) resistanceLevels.push(p.stopLoss);
      }

      // 添加目标价
      if (p.priceTarget) {
        if (p.direction === PatternDirection.Bullish) {
          resistanceLevels.push(p.priceTarget);
        } else if (p.direction === PatternDirection.Bearish) {
          supportLevels.push(p.priceTarget);
        }
      }
    });

    // 去重并排序
    const uniqueSupportLevels = [...new Set(supportLevels)].sort(
      (a, b) => a - b
    );
    const uniqueResistanceLevels = [...new Set(resistanceLevels)].sort(
      (a, b) => a - b
    );

    console.log(`\n----- ${timeframeLabel}关键价位 -----`);

    if (uniqueResistanceLevels.length > 0) {
      console.log(
        `阻力位: ${uniqueResistanceLevels.map(l => l.toFixed(2)).join(', ')}`
      );
    } else {
      console.log('未检测到明确的阻力位');
    }

    if (uniqueSupportLevels.length > 0) {
      console.log(
        `支撑位: ${uniqueSupportLevels.map(l => l.toFixed(2)).join(', ')}`
      );
    } else {
      console.log('未检测到明确的支撑位');
    }
  });

  console.log('\n===== 形态分析总结 =====');
  const overallDirection =
    analysisResult.combinedSignal === PatternDirection.Bullish
      ? '看涨'
      : analysisResult.combinedSignal === PatternDirection.Bearish
        ? '看空'
        : '中性';

  // 计算各时间周期方向的一致性
  const timeframeDirections = analysisResult.timeframeAnalyses.map(
    tfa => tfa.patternSignal
  );
  const allBullish = timeframeDirections.every(
    dir => dir === PatternDirection.Bullish
  );
  const allBearish = timeframeDirections.every(
    dir => dir === PatternDirection.Bearish
  );

  let consistencyMessage = '';
  if (allBullish) {
    consistencyMessage = '所有时间周期一致看涨，信号强度高';
  } else if (allBearish) {
    consistencyMessage = '所有时间周期一致看空，信号强度高';
  } else {
    const bullishCount = timeframeDirections.filter(
      dir => dir === PatternDirection.Bullish
    ).length;
    const bearishCount = timeframeDirections.filter(
      dir => dir === PatternDirection.Bearish
    ).length;
    const neutralCount = timeframeDirections.filter(
      dir => dir === PatternDirection.Neutral
    ).length;

    if (bullishCount > bearishCount && bullishCount > neutralCount) {
      consistencyMessage = `偏向看涨，但时间周期一致性不强 (${bullishCount}看涨/${bearishCount}看空/${neutralCount}中性)`;
    } else if (bearishCount > bullishCount && bearishCount > neutralCount) {
      consistencyMessage = `偏向看空，但时间周期一致性不强 (${bullishCount}看涨/${bearishCount}看空/${neutralCount}中性)`;
    } else {
      consistencyMessage = `时间周期信号混合，无明确方向 (${bullishCount}看涨/${bearishCount}看空/${neutralCount}中性)`;
    }
  }

  console.log(`综合方向: ${overallDirection}`);
  console.log(`时间周期一致性: ${consistencyMessage}`);
  console.log(
    `形态分析信号强度: ${analysisResult.signalStrength.toFixed(2)}/100`
  );

  // 交易建议
  console.log('\n----- 形态分析交易建议 -----');

  if (analysisResult.signalStrength > 70) {
    if (analysisResult.combinedSignal === PatternDirection.Bullish) {
      console.log('强烈看涨信号，建议考虑做多策略');
    } else if (analysisResult.combinedSignal === PatternDirection.Bearish) {
      console.log('强烈看空信号，建议考虑做空策略');
    }
  } else if (analysisResult.signalStrength > 50) {
    if (analysisResult.combinedSignal === PatternDirection.Bullish) {
      console.log('中等强度看涨信号，可考虑小仓位做多或等待更多确认');
    } else if (analysisResult.combinedSignal === PatternDirection.Bearish) {
      console.log('中等强度看空信号，可考虑小仓位做空或等待更多确认');
    }
  } else {
    console.log('信号强度不足，建议观望或寻求其他分析方法确认');
  }

  // 查找最可靠的形态作为参考
  const mostReliablePattern = analysisResult.timeframeAnalyses
    .flatMap(tfa => tfa.patterns)
    .sort((a, b) => b.reliability - a.reliability)[0];

  if (mostReliablePattern && mostReliablePattern.reliability > 60) {
    const patternTimeframe = analysisResult.timeframeAnalyses.find(tfa =>
      tfa.patterns.includes(mostReliablePattern)
    )?.timeframe;

    const timeframeText =
      patternTimeframe === 'weekly'
        ? '周线'
        : patternTimeframe === 'daily'
          ? '日线'
          : '小时线';

    console.log(
      `\n参考最可靠形态 (${timeframeText}): ${mostReliablePattern.patternType} (可靠性: ${mostReliablePattern.reliability.toFixed(2)})`
    );
    console.log(`形态描述: ${mostReliablePattern.description}`);
    console.log(`交易含义: ${mostReliablePattern.tradingImplication}`);
  }
}

export {
  // 类型和接口
  PatternType,
  PatternStatus,
  PatternDirection,
  PeakValley,
  PatternComponent,
  PatternAnalysisResult,
  AnalyzeMultiTimeframePatterns,
  ComprehensivePatternAnalysis,

  // 核心分析函数
  analyzeAllPatterns,
  combinePatternAnalyses,
  analyzeMultiTimeframePatterns,

  // 辅助和输出相关函数
  formatAndPrintPatternAnalysis,
};

/**
 * 多时间周期分析示例
 */
async function exampleMultiTimeframeUsage(symbol: string) {
  try {
    console.log(`====== 多时间周期形态分析: ${symbol} ======`);

    // 获取不同时间周期的数据
    const today = new Date();

    const startDateWeekly = new Date();
    startDateWeekly.setDate(today.getDate() - 365); // 获取一年的数据

    const startDateDaily = new Date();
    startDateDaily.setDate(today.getDate() - 90); // 获取一年的数据

    const startDateHourly = new Date();
    startDateHourly.setDate(today.getDate() - 30); // 获取一年的数据

    const weeklyData = await getStockDataForTimeframe(
      symbol,
      startDateWeekly,
      today,
      'weekly'
    ); // 获取周线数据

    const dailyData = await getStockDataForTimeframe(
      symbol,
      startDateDaily,
      today,
      'daily'
    ); // 获取日线数据

    const hourlyData = await getStockDataForTimeframe(
      symbol,
      startDateHourly,
      today,
      '1hour'
    ); // 获取4小时线数据

    // 进行多时间周期分析
    const multiTimeframeResult = await analyzeMultiTimeframePatterns(
      weeklyData,
      dailyData,
      hourlyData
    );

    // 使用格式化函数打印结果
    formatAndPrintPatternAnalysis(multiTimeframeResult, symbol);
  } catch (error) {
    console.error('多时间周期分析失败:', error);
  }
}

// only focus on recently patterns
// exampleMultiTimeframeUsage('PLTR');
