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
 * 不同时间周期适合的形态说明：
 *
 * 1. 长期形态（更适合周线）
 *    - 头肩顶/底（Head and Shoulders）：需要较长时间形成，在周线上更可靠
 *    - 双顶/底、三重顶/底：大型反转形态，在周线上信号更强
 *    - 杯柄形态（Cup and Handle）：形成周期长，通常需要数月时间
 *    - 圆底/顶：大型反转形态，需要较长时间形成
 *
 * 2. 中长期形态（适合周线和日线）
 *    - 楔形（Wedges）：可以在多个时间周期形成，但中长期更可靠
 *    - 三角形（Triangles）：在各时间周期都有效，但形成时间较长
 *
 * 3. 中短期形态（适合日线和小时线）
 *    - 旗形和三角旗（Flags and Pennants）：短期整理形态，在日线和小时线上常见
 *    - 矩形（Rectangles）：短中期整理形态
 *
 * 4. 短期形态（主要适合小时线）
 *    - 买入/卖出高潮：短期市场情绪的爆发，在小时线上更容易识别
 *    - 小型楔形和三角形：短期整理形态
 */

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
 * 形态与时间周期的匹配配置
 */
const PATTERN_TIMEFRAME_CONFIG = {
  // 基础形态（所有时间周期都检测）
  base: {
    patterns: ['findTriangles'],
    timeframes: ['weekly', 'daily', '1hour'],
  },
  // 长期形态
  long: {
    patterns: [
      'findHeadAndShoulders',
      'findDoubleTopsAndBottoms',
      'findCupAndHandle',
      'findRoundingPatterns',
    ],
    timeframes: ['weekly'],
  },
  // 中长期形态
  mediumLong: {
    patterns: [
      'findWedges',
      'findHeadAndShoulders',
      'findDoubleTopsAndBottoms',
    ],
    timeframes: ['weekly', 'daily'],
  },
  // 中短期形态
  mediumShort: {
    patterns: ['findFlagsAndPennants'],
    timeframes: ['daily', '1hour'],
  },
  // 短期形态
  short: {
    patterns: ['findBuyingClimax', 'findSellingClimax'],
    timeframes: ['1hour'],
  },
};

/**
 * 形态检测函数映射
 */
const PATTERN_DETECTORS = {
  findTriangles,
  findHeadAndShoulders,
  findDoubleTopsAndBottoms,
  findCupAndHandle,
  findRoundingPatterns,
  findWedges,
  findFlagsAndPennants,
  findBuyingClimax,
  findSellingClimax,
};

/**
 * 主函数：根据时间周期分析适合的形态，增强最近形态的重要性
 */
async function analyzeAllPatterns(
  rawData: Candle[],
  timeframe: 'weekly' | 'daily' | '1hour'
): Promise<AnalyzeMultiTimeframePatterns> {
  // 仅保留最近100根K线
  const data = rawData.slice(-100);

  // 检测所有峰谷点
  const peaksValleys = detectPeaksAndValleys(data);

  // 初始化形态数组
  let allPatterns: PatternAnalysisResult[] = [];

  // 遍历配置，执行符合当前时间周期的形态检测
  for (const [category, config] of Object.entries(PATTERN_TIMEFRAME_CONFIG)) {
    if (config.timeframes.includes(timeframe)) {
      for (const patternName of config.patterns) {
        const detector =
          PATTERN_DETECTORS[patternName as keyof typeof PATTERN_DETECTORS];
        const patterns = detector(data, peaksValleys);
        allPatterns = [...allPatterns, ...patterns];
      }
    }
  }

  // 计算当前最后一根K线的索引
  const lastIndex = data.length - 1;

  // 调整形态重要性和可靠性
  allPatterns.forEach(pattern => {
    const distanceFromCurrent = lastIndex - pattern.component.endIndex;
    const distanceFactor = Math.exp(-0.05 * distanceFromCurrent);

    // 根据形态类型和时间周期的匹配度调整可靠性
    const timeframeMatchFactor = calculateTimeframeMatchFactor(
      pattern.patternType,
      timeframe
    );

    // 调整形态的可靠性和重要性
    pattern.reliability = Math.min(
      100,
      pattern.reliability * timeframeMatchFactor
    );
    pattern.significance =
      pattern.significance * distanceFactor * timeframeMatchFactor;

    // 为已确认突破的形态和正在形成的形态调整权重
    if (pattern.status === PatternStatus.Confirmed) {
      pattern.significance *= 1.5;
    }
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

  // 确定主导形态和形态综合信号
  const dominantPattern = allPatterns.length > 0 ? allPatterns[0] : undefined;
  const patternSignal = calculatePatternSignal(allPatterns);

  return {
    timeframe,
    patterns: allPatterns,
    dominantPattern,
    patternSignal,
  };
}

/**
 * 计算时间周期匹配因子
 */
function calculateTimeframeMatchFactor(
  patternType: PatternType,
  timeframe: 'weekly' | 'daily' | '1hour'
): number {
  const longTermPatterns = [
    PatternType.HeadAndShoulders,
    PatternType.InverseHeadAndShoulders,
    PatternType.DoubleTop,
    PatternType.DoubleBottom,
    PatternType.TripleTop,
    PatternType.TripleBottom,
    PatternType.CupAndHandle,
    PatternType.RoundingBottom,
    PatternType.RoundingTop,
  ];

  const mediumTermPatterns = [
    PatternType.AscendingTriangle,
    PatternType.DescendingTriangle,
    PatternType.SymmetricalTriangle,
    PatternType.RisingWedge,
    PatternType.FallingWedge,
    PatternType.Rectangle,
  ];

  const shortTermPatterns = [
    PatternType.Flag,
    PatternType.Pennant,
    PatternType.BuyingClimax,
    PatternType.SellingClimax,
  ];

  if (longTermPatterns.includes(patternType)) {
    return timeframe === 'weekly' ? 1.3 : timeframe === 'daily' ? 1.1 : 0.8;
  }
  if (mediumTermPatterns.includes(patternType)) {
    return timeframe === 'daily' ? 1.3 : timeframe === 'weekly' ? 1.1 : 0.9;
  }
  if (shortTermPatterns.includes(patternType)) {
    return timeframe === '1hour' ? 1.3 : timeframe === 'daily' ? 1.0 : 0.7;
  }
  return 1.0;
}

/**
 * 计算形态综合信号
 */
function calculatePatternSignal(
  patterns: PatternAnalysisResult[]
): PatternDirection {
  const recentPatternCount = Math.min(10, patterns.length);
  const recentPatterns = patterns.slice(0, recentPatternCount);

  let bullishScore = 0;
  let bearishScore = 0;

  for (const pattern of recentPatterns) {
    const patternWeight = pattern.reliability * pattern.significance;
    if (pattern.direction === PatternDirection.Bullish) {
      bullishScore += patternWeight;
    } else if (pattern.direction === PatternDirection.Bearish) {
      bearishScore += patternWeight;
    }
  }

  if (bullishScore > bearishScore * 1.5) {
    return PatternDirection.Bullish;
  } else if (bearishScore > bullishScore * 1.5) {
    return PatternDirection.Bearish;
  } else if (bullishScore > bearishScore) {
    return PatternDirection.Bullish;
  } else if (bearishScore > bullishScore) {
    return PatternDirection.Bearish;
  }
  return PatternDirection.Neutral;
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

  // 对不同时间周期的信号进行加权
  const timeframeWeights = {
    weekly: 1.5,
    daily: 1.3,
    '1hour': 1.0,
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
      (bullishCount > totalWeight / 2 ? 1 : bullishCount / (totalWeight / 2));

    const hourlyAnalysis = timeframeAnalyses.find(a => a.timeframe === '1hour');
    if (
      hourlyAnalysis &&
      hourlyAnalysis.patternSignal === PatternDirection.Bullish
    ) {
      signalStrength += 10;
    }

    const dailyAnalysis = timeframeAnalyses.find(a => a.timeframe === 'daily');
    if (
      dailyAnalysis &&
      dailyAnalysis.patternSignal === PatternDirection.Bullish
    ) {
      signalStrength += 15;
    }
  } else if (combinedSignal === PatternDirection.Bearish) {
    signalStrength += 20 * (bearishCount / totalWeight);
    signalStrength +=
      15 *
      (bearishCount > totalWeight / 2 ? 1 : bearishCount / (totalWeight / 2));

    const hourlyAnalysis = timeframeAnalyses.find(a => a.timeframe === '1hour');
    if (
      hourlyAnalysis &&
      hourlyAnalysis.patternSignal === PatternDirection.Bearish
    ) {
      signalStrength += 10;
    }

    const dailyAnalysis = timeframeAnalyses.find(a => a.timeframe === 'daily');
    if (
      dailyAnalysis &&
      dailyAnalysis.patternSignal === PatternDirection.Bearish
    ) {
      signalStrength += 15;
    }
  }

  for (const analysis of timeframeAnalyses) {
    if (analysis.dominantPattern) {
      const pattern = analysis.dominantPattern;
      if (pattern.reliability > 70) {
        signalStrength += 10;
      }

      if (pattern.component) {
        const patternEndIndex = pattern.component.endIndex;
        const estimatedDataLength =
          patternEndIndex + (patternEndIndex - pattern.component.startIndex);

        const recencyRatio = patternEndIndex / estimatedDataLength;

        if (recencyRatio > 0.8) {
          signalStrength += 10;
        } else if (recencyRatio > 0.6) {
          signalStrength += 5;
        }
      }
    }
  }

  signalStrength = Math.max(0, Math.min(100, signalStrength));

  let description = '';

  if (combinedSignal === PatternDirection.Bullish) {
    description = `综合形态分析显示看涨信号`;
  } else if (combinedSignal === PatternDirection.Bearish) {
    description = `综合形态分析显示看跌信号`;
  } else {
    description = `综合形态分析显示中性信号`;
  }

  description += `，信号强度: ${signalStrength.toFixed(2)}/100。`;

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

  const hourlyOtherPatternsDesc = hourlyAnalyses?.patterns
    .filter(p => p !== hourlyAnalyses.dominantPattern)
    .map(p => {
      const datePriceMapping = _.zip(p.keyDates, p.keyPrices);
      return `${p.patternType} ${datePriceMapping.map(([date, price]) => `${toEDTString(date)} @ (${price.toFixed(2)})`).join(' | ')}`;
    })
    .join('\n');

  const dailyOtherPatternsDesc = dailyAnalyses?.patterns
    .filter(p => p !== dailyAnalyses.dominantPattern)
    .map(p => {
      const datePriceMapping = _.zip(p.keyDates, p.keyPrices);
      return `${p.patternType} ${datePriceMapping.map(([date, price]) => `${toEDTString(date)} @ (${price.toFixed(2)})`).join(' | ')}`;
    })
    .join('\n');

  if (hourlyAnalyses?.dominantPattern) {
    const datePriceMapping = _.zip(
      hourlyAnalyses.dominantPattern.keyDates,
      hourlyAnalyses.dominantPattern.keyPrices
    );

    description += `\n\n小时线主导形态: ${hourlyAnalyses.dominantPattern.patternType}
    \n 关键时间: ${datePriceMapping.map(([date, price]) => `${toEDTString(date)} @ (${price.toFixed(2)})`).join(' | ')}, (${hourlyAnalyses.dominantPattern.direction === PatternDirection.Bullish ? '看涨' : '看跌'})，可靠性: ${hourlyAnalyses.dominantPattern.reliability.toFixed(2)}/100。`;
  }

  if (dailyAnalyses?.dominantPattern) {
    const datePriceMapping = _.zip(
      dailyAnalyses.dominantPattern.keyDates,
      dailyAnalyses.dominantPattern.keyPrices
    );
    description += `\n\n日线主导形态: ${dailyAnalyses.dominantPattern.patternType}
    \n 关键时间: ${datePriceMapping.map(([date, price]) => `${toEDTString(date)} @ (${price.toFixed(2)})`).join(' | ')}, (${dailyAnalyses.dominantPattern.direction === PatternDirection.Bullish ? '看涨' : '看跌'})，可靠性: ${dailyAnalyses.dominantPattern.reliability.toFixed(2)}/100。`;
  }

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
  const weeklyAnalysis = await analyzeAllPatterns(weeklyData, 'weekly');
  const dailyAnalysis = await analyzeAllPatterns(dailyData, 'daily');
  const hourlyAnalysis = await analyzeAllPatterns(hourlyData, '1hour');

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
  console.log(`\n===== ${symbol ? symbol + ' ' : ''}形态分析综合结果 =====`);
  console.log(`${analysisResult.description}`);

  console.log(`信号强度: ${analysisResult.signalStrength.toFixed(2)}/100`);

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
          if (idx === 0 && p === tfa.dominantPattern) return;
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
          if (idx === 0 && p === tfa.dominantPattern) return;
          console.log(
            `   - ${p.patternType} (可靠性: ${p.reliability.toFixed(2)})`
          );
        });
        if (bearishPatterns.length > 3)
          console.log(`   ... 等共${bearishPatterns.length}个看空形态`);
      }
    }
  });

  console.log('\n===== 关键价位分析 =====');

  analysisResult.timeframeAnalyses.forEach(tfa => {
    const timeframeLabel =
      tfa.timeframe === 'weekly'
        ? '周线'
        : tfa.timeframe === 'daily'
          ? '日线'
          : '小时线';

    const supportLevels: number[] = [];
    const resistanceLevels: number[] = [];

    tfa.patterns.forEach(p => {
      if (p.direction === PatternDirection.Bullish) {
        resistanceLevels.push(p.component.breakoutLevel);
        if (p.stopLoss) supportLevels.push(p.stopLoss);
      } else if (p.direction === PatternDirection.Bearish) {
        supportLevels.push(p.component.breakoutLevel);
        if (p.stopLoss) resistanceLevels.push(p.stopLoss);
      }

      if (p.priceTarget) {
        if (p.direction === PatternDirection.Bullish) {
          resistanceLevels.push(p.priceTarget);
        } else if (p.direction === PatternDirection.Bearish) {
          supportLevels.push(p.priceTarget);
        }
      }
    });

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
  PatternType,
  PatternStatus,
  PatternDirection,
  PeakValley,
  PatternComponent,
  PatternAnalysisResult,
  AnalyzeMultiTimeframePatterns,
  ComprehensivePatternAnalysis,
  analyzeAllPatterns,
  combinePatternAnalyses,
  analyzeMultiTimeframePatterns,
  formatAndPrintPatternAnalysis,
};

/**
 * 多时间周期分析示例
 */
async function exampleMultiTimeframeUsage(symbol: string) {
  try {
    console.log(`====== 多时间周期形态分析: ${symbol} ======`);

    const today = new Date();

    const startDateWeekly = new Date();
    startDateWeekly.setDate(today.getDate() - 365);

    const startDateDaily = new Date();
    startDateDaily.setDate(today.getDate() - 90);

    const startDateHourly = new Date();
    startDateHourly.setDate(today.getDate() - 30);

    const weeklyData = await getStockDataForTimeframe(
      symbol,
      startDateWeekly,
      today,
      'weekly'
    );

    const dailyData = await getStockDataForTimeframe(
      symbol,
      startDateDaily,
      today,
      'daily'
    );

    const hourlyData = await getStockDataForTimeframe(
      symbol,
      startDateHourly,
      today,
      '1hour'
    );

    const multiTimeframeResult = await analyzeMultiTimeframePatterns(
      weeklyData,
      dailyData,
      hourlyData
    );

    formatAndPrintPatternAnalysis(multiTimeframeResult, symbol);
  } catch (error) {
    console.error('多时间周期分析失败:', error);
  }
}

// exampleMultiTimeframeUsage('MSTR');
