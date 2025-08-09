import { chipConfig } from './chipConfig.js';
import type { ChipAnalysisResult } from './chipTypes.js';
import type {
  MultiTimeframeAnalysisResult,
  TimeframeAnalysis,
} from './chipMultiTypes.js';

/**
 * 将相近的价格水平分组
 */
export function groupNearbyLevels(
  levels: number[],
  currentPrice: number,
  proximityThreshold = chipConfig.combine.groupProximityThreshold
): number[] {
  if (levels.length === 0) return [];

  const sortedLevels = [...levels].sort((a, b) => a - b);

  const groupedLevels: number[] = [];
  let currentGroup: number[] = [sortedLevels[0]];

  for (let i = 1; i < sortedLevels.length; i++) {
    const currentLevel = sortedLevels[i];
    const previousLevel = sortedLevels[i - 1];

    if ((currentLevel - previousLevel) / currentPrice <= proximityThreshold) {
      currentGroup.push(currentLevel);
    } else {
      groupedLevels.push(
        currentGroup.reduce((sum, val) => sum + val, 0) / currentGroup.length
      );
      currentGroup = [currentLevel];
    }
  }

  if (currentGroup.length > 0) {
    groupedLevels.push(
      currentGroup.reduce((sum, val) => sum + val, 0) / currentGroup.length
    );
  }

  return groupedLevels;
}

/**
 * 根据建议和价格水平确定止损位
 */
export function determineStopLossLevels(
  recommendation: string,
  currentPrice: number,
  supportLevels: number[],
  resistanceLevels: number[]
): number[] {
  if (recommendation.includes('多')) {
    const relevantSupports = supportLevels
      .filter(level => level < currentPrice)
      .sort((a, b) => b - a);
    return relevantSupports.slice(0, Math.min(2, relevantSupports.length));
  } else if (recommendation.includes('空')) {
    const relevantResistances = resistanceLevels
      .filter(level => level > currentPrice)
      .sort((a, b) => a - b);
    return relevantResistances.slice(0, Math.min(2, relevantResistances.length));
  }

  const closestSupport = supportLevels
    .filter(level => level < currentPrice)
    .sort((a, b) => b - a)[0];

  const closestResistance = resistanceLevels
    .filter(level => level > currentPrice)
    .sort((a, b) => a - b)[0];

  return [closestSupport, closestResistance].filter(Boolean) as number[];
}

/**
 * 根据建议和价格水平确定止盈位
 */
export function determineTakeProfitLevels(
  recommendation: string,
  currentPrice: number,
  supportLevels: number[],
  resistanceLevels: number[]
): number[] {
  if (recommendation.includes('多')) {
    const relevantResistances = resistanceLevels
      .filter(level => level > currentPrice)
      .sort((a, b) => a - b);
    return relevantResistances.slice(0, Math.min(3, relevantResistances.length));
  } else if (recommendation.includes('空')) {
    const relevantSupports = supportLevels
      .filter(level => level < currentPrice)
      .sort((a, b) => b - a);
    return relevantSupports.slice(0, Math.min(3, relevantSupports.length));
  }
  return [];
}

/**
 * 识别时间周期之间的冲突
 */
export function identifyTimeframeConflicts(
  timeframeAnalyses: TimeframeAnalysis[]
): string[] {
  const conflicts: string[] = [];

  const shortTerm = timeframeAnalyses.find(ta => ta.timeframe === '1hour')?.analysis;
  const mediumTerm = timeframeAnalyses.find(ta => ta.timeframe === 'daily')?.analysis;

  if (shortTerm && mediumTerm) {
    if (
      shortTerm.overallRecommendation.includes('多') &&
      mediumTerm.overallRecommendation.includes('空')
    ) {
      conflicts.push('短期看多但中期看空，存在反转风险');
    } else if (
      shortTerm.overallRecommendation.includes('空') &&
      mediumTerm.overallRecommendation.includes('多')
    ) {
      conflicts.push('短期看空但中期看多，可能是回调机会');
    }
  }

  const longTerm = timeframeAnalyses.find(ta => ta.timeframe === 'weekly')?.analysis;

  if (mediumTerm && longTerm) {
    if (
      mediumTerm.overallRecommendation.includes('多') &&
      longTerm.overallRecommendation.includes('空')
    ) {
      conflicts.push('中期看多但长期看空，注意长期阻力位');
    } else if (
      mediumTerm.overallRecommendation.includes('空') &&
      longTerm.overallRecommendation.includes('多')
    ) {
      conflicts.push('中期看空但长期看多，可能是在长期上升趋势中回调');
    }
  }

  for (const ta of timeframeAnalyses) {
    if (ta.analysis.technicalSignal.includes('买入') && !ta.analysis.shapeBuySignal) {
      conflicts.push(
        `${ta.timeframe === 'weekly' ? '周线' : ta.timeframe === 'daily' ? '日线' : '1小时'}技术指标看多但筹码形态不支持`
      );
    } else if (
      ta.analysis.technicalSignal.includes('卖出') &&
      ta.analysis.shapeBuySignal
    ) {
      conflicts.push(
        `${ta.timeframe === 'weekly' ? '周线' : ta.timeframe === 'daily' ? '日线' : '1小时'}技术指标看空但筹码形态看多`
      );
    }
  }

  return conflicts;
}

/**
 * 根据单个时间周期的分析生成展望
 */
export function generateTimeframeOutlook(analysis?: ChipAnalysisResult): string {
  if (!analysis) return '数据不足，无法分析';

  if (analysis.buySignalStrength > 75) return '强烈看多';
  if (analysis.buySignalStrength > 60) return '看多';
  if (analysis.shortSignalStrength > 75) return '强烈看空';
  if (analysis.shortSignalStrength > 60) return '看空';
  if (analysis.buySignalStrength > analysis.shortSignalStrength + 10) return '偏多';
  if (analysis.shortSignalStrength > analysis.buySignalStrength + 10) return '偏空';
  return '中性';
}

/**
 * 组合不同时间周期的分析结果
 */
export function combineTimeframeAnalyses(
  timeframeAnalyses: TimeframeAnalysis[],
  primaryTimeframe: 'weekly' | 'daily' | '1hour'
): MultiTimeframeAnalysisResult {
  const primaryAnalysis = timeframeAnalyses.find(ta => ta.timeframe === primaryTimeframe)?.analysis;
  if (!primaryAnalysis) {
    throw new Error(`未找到主要时间周期 ${primaryTimeframe} 的分析结果`);
  }

  let totalWeight = 0;
  let weightedBuySignal = 0;
  let weightedShortSignal = 0;
  for (const ta of timeframeAnalyses) {
    weightedBuySignal += ta.analysis.buySignalStrength * ta.weight;
    weightedShortSignal += ta.analysis.shortSignalStrength * ta.weight;
    totalWeight += ta.weight;
  }

  const combinedBuySignalStrength = Math.round(weightedBuySignal / totalWeight);
  const combinedShortSignalStrength = Math.round(weightedShortSignal / totalWeight);

  const bullishCount = timeframeAnalyses.filter(ta => ta.analysis.overallRecommendation.includes('多')).length;
  const bearishCount = timeframeAnalyses.filter(ta => ta.analysis.overallRecommendation.includes('空')).length;
  const neutralCount = timeframeAnalyses.length - bullishCount - bearishCount;

  let timeframeAlignment = '混合';
  let alignmentStrength = 0;
  if (bullishCount > bearishCount && bullishCount > neutralCount) {
    timeframeAlignment = '看多';
    alignmentStrength = Math.round((bullishCount / timeframeAnalyses.length) * 100);
  } else if (bearishCount > bullishCount && bearishCount > neutralCount) {
    timeframeAlignment = '看空';
    alignmentStrength = Math.round((bearishCount / timeframeAnalyses.length) * 100);
  } else if (neutralCount >= bullishCount && neutralCount >= bearishCount) {
    timeframeAlignment = '中性';
    alignmentStrength = Math.round((neutralCount / timeframeAnalyses.length) * 100);
  }

  const trendDirections = timeframeAnalyses.map(ta => {
    const buyStrength = ta.analysis.buySignalStrength;
    const shortStrength = ta.analysis.shortSignalStrength;
    if (buyStrength > shortStrength + 20) return '上升趋势';
    if (shortStrength > buyStrength + 20) return '下降趋势';
    return '震荡整理';
  });

  const uptrendCount = trendDirections.filter(t => t === '上升趋势').length;
  const downtrendCount = trendDirections.filter(t => t === '下降趋势').length;
  const rangingCount = trendDirections.filter(t => t === '震荡整理').length;

  let trendDirection = '震荡整理';
  if (uptrendCount > downtrendCount && uptrendCount > rangingCount) trendDirection = '上升趋势';
  else if (downtrendCount > uptrendCount && downtrendCount > rangingCount) trendDirection = '下降趋势';

  const dominantTrendCount = Math.max(uptrendCount, downtrendCount, rangingCount);
  const trendConsistencyRatio = dominantTrendCount / timeframeAnalyses.length;
  let trendConsistency = '弱';
  if (trendConsistencyRatio >= 0.8) trendConsistency = '强';
  else if (trendConsistencyRatio >= 0.5) trendConsistency = '中等';

  const allSupportLevels = timeframeAnalyses.flatMap(ta => [
    ...ta.analysis.strongSupportLevels,
    ...ta.analysis.moderateSupportLevels,
  ]);
  const allResistanceLevels = timeframeAnalyses.flatMap(ta => [
    ...ta.analysis.strongResistanceLevels,
    ...ta.analysis.moderateResistanceLevels,
  ]);

  const aggregatedSupportLevels = groupNearbyLevels(allSupportLevels, primaryAnalysis.currentPrice);
  const aggregatedResistanceLevels = groupNearbyLevels(allResistanceLevels, primaryAnalysis.currentPrice);

  const timeframeConflicts = identifyTimeframeConflicts(timeframeAnalyses);

  const shortTermOutlook = generateTimeframeOutlook(
    timeframeAnalyses.find(ta => ta.timeframe === '1hour')?.analysis
  );
  const mediumTermOutlook = generateTimeframeOutlook(
    timeframeAnalyses.find(ta => ta.timeframe === 'daily')?.analysis
  );
  const longTermOutlook = generateTimeframeOutlook(
    timeframeAnalyses.find(ta => ta.timeframe === 'weekly')?.analysis
  );

  let combinedRecommendation = '';
  let recommendationComment = '';
  let entryStrategy = '';
  let exitStrategy = '';

  if (combinedBuySignalStrength > combinedShortSignalStrength + chipConfig.combine.signalDiffThreshold) {
    combinedRecommendation = '综合建议：做多';
    if (timeframeAlignment === '看多' && alignmentStrength > chipConfig.combine.alignmentStrongThreshold) {
      recommendationComment = '多个时间周期一致看多，强烈建议买入。';
      entryStrategy = '可积极入场，建议在支撑位附近分批买入。';
    } else if (timeframeAlignment === '看多') {
      recommendationComment = '多个时间周期偏向看多，建议买入。';
      entryStrategy = '建议在回调到支撑位时买入。';
    } else {
      recommendationComment = '综合指标偏向看多，但时间周期一致性不强，建议谨慎买入。';
      entryStrategy = '建议小仓位试探性买入，等待更多确认。';
    }
    exitStrategy = '可设置在主要阻力位附近，或当短期时间周期出现卖出信号时离场。';
  } else if (combinedShortSignalStrength > combinedBuySignalStrength + chipConfig.combine.signalDiffThreshold) {
    combinedRecommendation = '综合建议：做空';
    if (timeframeAlignment === '看空' && alignmentStrength > chipConfig.combine.alignmentStrongThreshold) {
      recommendationComment = '多个时间周期一致看空，强烈建议卖出/做空。';
      entryStrategy = '可积极入场做空，建议在阻力位附近分批做空。';
    } else if (timeframeAlignment === '看空') {
      recommendationComment = '多个时间周期偏向看空，建议卖出/做空。';
      entryStrategy = '建议在反弹到阻力位时做空。';
    } else {
      recommendationComment = '综合指标偏向看空，但时间周期一致性不强，建议谨慎做空。';
      entryStrategy = '建议小仓位试探性做空，等待更多确认。';
    }
    exitStrategy = '可设置在主要支撑位附近，或当短期时间周期出现买入信号时离场。';
  } else {
    combinedRecommendation = '综合建议：观望';
    recommendationComment = '各时间周期信号不一致或中性，建议暂时观望。';
    entryStrategy = '建议等待更明确的信号出现再入场。';
    exitStrategy = '现有仓位可在小幅盈利时了结，控制风险。';
  }

  recommendationComment += ` 趋势分析显示市场处于${trendDirection}，一致性${trendConsistency}。`;
  if (timeframeConflicts.length > 0) {
    recommendationComment += ` 注意：${timeframeConflicts.join(' ')}`;
  }

  const stopLossLevels = determineStopLossLevels(
    combinedRecommendation,
    primaryAnalysis.currentPrice,
    aggregatedSupportLevels,
    aggregatedResistanceLevels
  );
  const takeProfitLevels = determineTakeProfitLevels(
    combinedRecommendation,
    primaryAnalysis.currentPrice,
    aggregatedSupportLevels,
    aggregatedResistanceLevels
  );

  recommendationComment += ` 短期(1小时)${shortTermOutlook}，中期(日线)${mediumTermOutlook}，长期(周线)${longTermOutlook}。`;

  return {
    symbol: primaryAnalysis.symbol,
    currentPrice: primaryAnalysis.currentPrice,
    timeframes: timeframeAnalyses,
    combinedBuySignalStrength,
    combinedShortSignalStrength,
    timeframeAlignment,
    alignmentStrength,
    primaryTimeframe,
    primaryTimeframeRecommendation: primaryAnalysis.overallRecommendation,
    combinedRecommendation,
    recommendationComment,
    trendConsistency,
    trendDirection,
    aggregatedSupportLevels,
    aggregatedResistanceLevels,
    entryStrategy,
    exitStrategy,
    stopLossLevels,
    takeProfitLevels,
    timeframeConflicts,
    shortTermOutlook,
    mediumTermOutlook,
    longTermOutlook,
  };
}


