import { chipConfig } from './chipConfig.js';
import type { ChipAnalysisResult, ChipPeak } from './chipTypes.js';

export function scoreBuySignal(params: {
  concentrationLevel: string;
  bullBearRatio: number;
  resistanceLevel: string;
  shapeBuySignal: boolean;
  volumeTrend: string;
  profitChipsPercentage: number;
  chipMigrationDirection: string;
  technicalSignal: string;
}): { score: number; recommendation: string; comment: string } {
  let buyScore = 0;

  if (params.concentrationLevel === '高')
    buyScore += chipConfig.buy.concentration.high;
  else if (params.concentrationLevel === '中')
    buyScore += chipConfig.buy.concentration.medium;
  else buyScore += chipConfig.buy.concentration.low;

  if (params.bullBearRatio > chipConfig.buy.bullBear.strongBullRatio)
    buyScore += chipConfig.buy.bullBear.strongBull;
  else if (params.bullBearRatio > chipConfig.buy.bullBear.moderateBullRatio)
    buyScore += chipConfig.buy.bullBear.moderateBull;
  else if (params.bullBearRatio < chipConfig.buy.bullBear.strongBearRatio)
    buyScore += chipConfig.buy.bullBear.strongBear;

  if (params.resistanceLevel === '弱')
    buyScore += chipConfig.buy.resistance.weak;
  else if (params.resistanceLevel === '中')
    buyScore += chipConfig.buy.resistance.medium;

  if (params.shapeBuySignal) buyScore += chipConfig.buy.shapeBuy;

  if (params.volumeTrend === '明显萎缩')
    buyScore += chipConfig.buy.volume.shrinkStrong;
  else if (params.volumeTrend === '小幅放大')
    buyScore += chipConfig.buy.volume.expandSmall;
  else if (
    params.volumeTrend === '明显放大' &&
    params.profitChipsPercentage < chipConfig.buy.volume.breakoutProfitThreshold
  )
    buyScore += chipConfig.buy.volume.expandBreakout;
  else if (
    params.volumeTrend === '明显放大' &&
    params.profitChipsPercentage > chipConfig.buy.volume.topProfitThreshold
  )
    buyScore += chipConfig.buy.volume.expandTop;

  if (params.chipMigrationDirection === '明显向上')
    buyScore += chipConfig.buy.migration.strongUp;
  else if (params.chipMigrationDirection === '缓慢向上')
    buyScore += chipConfig.buy.migration.slowUp;
  else if (params.chipMigrationDirection === '明显向下')
    buyScore += chipConfig.buy.migration.strongDown;

  if (params.technicalSignal === '强买入')
    buyScore += chipConfig.buy.technical.strongBuy;
  else if (params.technicalSignal === '买入')
    buyScore += chipConfig.buy.technical.buy;
  else if (params.technicalSignal === '强卖出')
    buyScore += chipConfig.buy.technical.strongSell;
  else if (params.technicalSignal === '卖出')
    buyScore += chipConfig.buy.technical.sell;

  buyScore = Math.max(0, Math.min(100, buyScore));

  let buyRecommendation = '';
  let buyComment = '';
  if (buyScore >= 75) {
    buyRecommendation = '强烈推荐买入';
    buyComment =
      '多项指标显示极佳的买入时机，筹码结构优良，上方阻力小，技术指标支持。';
  } else if (buyScore >= 60) {
    buyRecommendation = '建议买入';
    buyComment = '筹码结构良好，具备上涨条件，可以考虑分批买入。';
  } else if (buyScore >= 40) {
    buyRecommendation = '谨慎买入';
    buyComment =
      '筹码结构一般，存在一定风险，建议小仓位试探性买入或等待更好时机。';
  } else if (buyScore >= 25) {
    buyRecommendation = '暂时观望';
    buyComment = '当前筹码结构不佳，建议等待筹码结构改善后再考虑买入。';
  } else {
    buyRecommendation = '不建议买入';
    buyComment =
      '多项指标显示不适合当前买入，筹码结构差，上方阻力大，技术指标不支持。';
  }

  return {
    score: buyScore,
    recommendation: buyRecommendation,
    comment: buyComment,
  };
}

export function scoreShortSignal(params: {
  concentrationLevel: string;
  bullBearRatio: number;
  resistanceLevel: string;
  shapeBuySignal: boolean;
  volumeTrend: string;
  profitChipsPercentage: number;
  chipMigrationDirection: string;
  technicalSignal: string;
  rsiLevel: number;
}): {
  score: number;
  recommendation: string;
  comment: string;
  isShort: boolean;
} {
  let shortScore = 0;

  if (params.concentrationLevel === '高')
    shortScore += chipConfig.short.concentration.high;
  else if (params.concentrationLevel === '中')
    shortScore += chipConfig.short.concentration.medium;
  else shortScore += chipConfig.short.concentration.low;

  if (params.bullBearRatio < chipConfig.short.bullBear.strongBearRatio)
    shortScore += chipConfig.short.bullBear.strongBear;
  else if (params.bullBearRatio < chipConfig.short.bullBear.slightBearRatio)
    shortScore += chipConfig.short.bullBear.slightBear;
  else if (params.bullBearRatio > chipConfig.short.bullBear.strongBullRatio)
    shortScore += chipConfig.short.bullBear.strongBull;

  if (params.resistanceLevel === '强')
    shortScore += chipConfig.short.resistance.strong;
  else if (params.resistanceLevel === '中')
    shortScore += chipConfig.short.resistance.medium;
  else shortScore += chipConfig.short.resistance.weak;

  if (!params.shapeBuySignal) shortScore += chipConfig.short.shapeAgainstBuy;

  if (
    params.volumeTrend === '明显放大' &&
    params.profitChipsPercentage > chipConfig.short.volume.topProfitThreshold
  )
    shortScore += chipConfig.short.volume.expandTop;
  else if (
    params.volumeTrend === '明显萎缩' &&
    params.profitChipsPercentage > chipConfig.short.volume.topProfitThreshold
  )
    shortScore += chipConfig.short.volume.shrinkHigh;
  else if (
    params.volumeTrend === '明显放大' &&
    params.profitChipsPercentage < chipConfig.short.volume.bottomProfitThreshold
  )
    shortScore += chipConfig.short.volume.expandBottom;

  if (params.chipMigrationDirection === '明显向下')
    shortScore += chipConfig.short.migration.strongDown;
  else if (params.chipMigrationDirection === '缓慢向下')
    shortScore += chipConfig.short.migration.slowDown;
  else if (params.chipMigrationDirection === '明显向上')
    shortScore += chipConfig.short.migration.strongUp;
  else if (params.chipMigrationDirection === '缓慢向上')
    shortScore += chipConfig.short.migration.slowUp;

  if (params.technicalSignal === '强卖出')
    shortScore += chipConfig.short.technical.strongSell;
  else if (params.technicalSignal === '卖出')
    shortScore += chipConfig.short.technical.sell;
  else if (params.technicalSignal === '强买入')
    shortScore += chipConfig.short.technical.strongBuy;
  else if (params.technicalSignal === '买入')
    shortScore += chipConfig.short.technical.buy;

  if (params.rsiLevel > chipConfig.short.rsi.overboughtThreshold)
    shortScore += chipConfig.short.rsi.overbought;
  else if (params.rsiLevel < chipConfig.short.rsi.oversoldThreshold)
    shortScore += chipConfig.short.rsi.oversold;

  shortScore = Math.max(0, Math.min(100, shortScore));

  let shortRecommendation = '';
  let shortComment = '';
  let isShort = false;
  if (shortScore >= 75) {
    shortRecommendation = '强烈推荐卖空';
    shortComment =
      '多项指标显示极佳的卖空时机，筹码结构处于高位，下方支撑弱，技术指标支持做空。';
    isShort = true;
  } else if (shortScore >= 60) {
    shortRecommendation = '建议卖空';
    shortComment = '筹码结构偏弱，具备下跌条件，可以考虑分批做空。';
    isShort = true;
  } else if (shortScore >= 40) {
    shortRecommendation = '谨慎卖空';
    shortComment =
      '存在一定做空机会，但风险较高，建议小仓位试探性做空或等待更好时机。';
  } else if (shortScore >= 25) {
    shortRecommendation = '暂不建议卖空';
    shortComment = '当前做空条件不成熟，建议等待更好的做空机会。';
  } else {
    shortRecommendation = '不建议卖空';
    shortComment =
      '多项指标显示当前不适合做空，筹码结构健康，支撑较强，技术指标不支持做空。';
  }

  return {
    score: shortScore,
    recommendation: shortRecommendation,
    comment: shortComment,
    isShort,
  };
}

export function buildOverallSuggestion(
  buyScore: number,
  shortScore: number
): {
  overallRecommendation: string;
  positionSuggestion: string;
  overallComment: string;
} {
  let overallRecommendation = '';
  let positionSuggestion = '';
  let overallComment = '';

  if (buyScore > 60 && shortScore < 30) {
    overallRecommendation = '做多';
    if (buyScore > 80) {
      positionSuggestion = '重仓做多';
      overallComment = '强烈看多信号，建议积极入场做多，可适当加大仓位。';
    } else {
      positionSuggestion = '中等仓位做多';
      overallComment = '看多信号明确，建议择机入场做多，控制好仓位。';
    }
  } else if (shortScore > 60 && buyScore < 30) {
    overallRecommendation = '做空';
    if (shortScore > 80) {
      positionSuggestion = '重仓做空';
      overallComment = '强烈看空信号，建议积极入场做空，可适当加大仓位。';
    } else {
      positionSuggestion = '中等仓位做空';
      overallComment = '看空信号明确，建议择机入场做空，控制好仓位。';
    }
  } else if (
    buyScore >= 40 &&
    buyScore <= 60 &&
    shortScore >= 40 &&
    shortScore <= 60
  ) {
    overallRecommendation = '观望';
    positionSuggestion = '空仓观望';
    overallComment = '多空信号交织，市场方向不明确，建议暂时观望等待明确信号。';
  } else if (buyScore > shortScore + 15) {
    overallRecommendation = '偏多';
    positionSuggestion = '轻仓做多';
    overallComment = '偏向看多，但信号不够强烈，建议小仓位试探性做多。';
  } else if (shortScore > buyScore + 15) {
    overallRecommendation = '偏空';
    positionSuggestion = '轻仓做空';
    overallComment = '偏向看空，但信号不够强烈，建议小仓位试探性做空。';
  } else {
    overallRecommendation = '中性';
    positionSuggestion = '观望为主';
    overallComment =
      '多空双方力量相当，市场处于震荡状态，建议以观望为主，等待明确信号出现。';
  }

  return { overallRecommendation, positionSuggestion, overallComment };
}

export function enrichCommentsWithPeaks(
  majorPeaks: ChipPeak[],
  currentPrice: number,
  buyComment: string,
  shortComment: string
): { buyComment: string; shortComment: string } {
  if (majorPeaks.length === 0) return { buyComment, shortComment };
  const nearestPeak = majorPeaks.reduce((nearest, peak) =>
    Math.abs(peak.distance) < Math.abs(nearest.distance) ? peak : nearest
  );
  if (nearestPeak.price < currentPrice && nearestPeak.distance > -10) {
    buyComment += ` 当前价格刚刚突破主要筹码峰(${nearestPeak.price.toFixed(2)})，可能是突破买点。`;
    shortComment += ` 注意当前价格刚刚突破主要筹码峰(${nearestPeak.price.toFixed(2)})，做空存在风险。`;
  } else if (nearestPeak.price > currentPrice && nearestPeak.distance < 10) {
    buyComment += ` 注意上方${nearestPeak.distance.toFixed(2)}%处存在主要筹码峰(${nearestPeak.price.toFixed(2)})，可能形成阻力。`;
    shortComment += ` 上方${nearestPeak.distance.toFixed(2)}%处存在主要筹码峰(${nearestPeak.price.toFixed(2)})，可作为做空参考点位。`;
  }
  return { buyComment, shortComment };
}
