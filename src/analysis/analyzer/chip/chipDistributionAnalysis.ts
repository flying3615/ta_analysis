import type { ChipAnalysisResult, ChipDistribution } from './chipTypes.js';
import { calculateTechnicalIndicators } from '../../../util/taUtil.js';
import {
  buildOverallSuggestion,
  enrichCommentsWithPeaks,
  scoreBuySignal,
  scoreShortSignal,
} from './chipSignals.js';
import { Candle } from '../../../types.js';
import {
  analyzeChipPeakPattern,
  calculateBullBearRatio,
  calculateCumulativeDistribution,
  calculateEntropyOfDistribution,
  calculateGiniCoefficient,
  identifyChipPeaks,
  identifyKeyPriceLevels,
} from '../../../util/chipUtils.js';

/**
 * 计算筹码分布
 */
export function calculateChipDistribution(
  data: Candle[],
  decayFactor: number = 0.95,
  priceSegments: number = 100
): ChipDistribution[] {
  // 找出价格范围
  const allPrices = data.flatMap(d => [d.high, d.low, d.open, d.close]);
  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);

  // 创建价格区间
  const priceStep = (maxPrice - minPrice) / priceSegments;
  const priceRanges: number[] = [];
  for (let i = 0; i <= priceSegments; i++) {
    priceRanges.push(minPrice + i * priceStep);
  }

  // 初始化分布数组
  const distribution: { [price: number]: number } = {};
  priceRanges.forEach(price => {
    distribution[price] = 0;
  });

  // 计算每个交易日的筹码分布并累加
  let totalWeight = 0;
  let weightFactor = 1;

  // 从最近的数据开始计算
  for (let i = data.length - 1; i >= 0; i--) {
    const day = data[i];
    const dayAvgPrice = (day.high + day.low + day.open + day.close) / 4;
    const volume = day.volume;

    // 找到最接近的价格区间
    const closestPrice = priceRanges.reduce((prev, curr) =>
      Math.abs(curr - dayAvgPrice) < Math.abs(prev - dayAvgPrice) ? curr : prev
    );

    // 累加权重后的成交量
    distribution[closestPrice] += volume * weightFactor;
    totalWeight += volume * weightFactor;

    // 应用衰减因子
    weightFactor *= decayFactor;
  }

  // 计算百分比并格式化结果
  const result: ChipDistribution[] = Object.entries(distribution)
    .map(([price, weight]) => ({
      price: parseFloat(price),
      weight,
      percentage: (weight / totalWeight) * 100,
    }))
    .filter(item => item.weight > 0) // 移除权重为0的项
    .sort((a, b) => a.price - b.price); // 按价格排序

  return result;
}

/**
 * 分析成交量趋势 - 新增
 */
function analyzeVolumeTrend(
  data: Candle[],
  lookbackPeriod: number = 20
): {
  recentVolumeChange: number;
  volumeTrend: string;
  volumeComment: string;
} {
  // 确保有足够的数据
  if (data.length < lookbackPeriod + 5) {
    return {
      recentVolumeChange: 0,
      volumeTrend: '数据不足',
      volumeComment: '历史数据不足，无法分析成交量趋势。',
    };
  }

  // 获取近期成交量和前期成交量
  const recentVolumes = data.slice(data.length - lookbackPeriod);
  const previousVolumes = data.slice(
    data.length - lookbackPeriod * 2,
    data.length - lookbackPeriod
  );

  // 计算平均成交量
  const recentAvgVolume =
    recentVolumes.reduce((sum, d) => sum + d.volume, 0) / recentVolumes.length;
  const previousAvgVolume =
    previousVolumes.reduce((sum, d) => sum + d.volume, 0) /
    previousVolumes.length;

  // 计算成交量变化比例（防止除零）
  const denomVol =
    Math.abs(previousAvgVolume) < 1e-8 ? 1e-8 : previousAvgVolume;
  const volumeChange = ((recentAvgVolume - previousAvgVolume) / denomVol) * 100;

  // 判断成交量趋势
  let volumeTrend = '';
  let volumeComment = '';

  if (volumeChange > 20) {
    volumeTrend = '明显放大';
    volumeComment =
      '近期成交量明显放大，表明市场参与度增强，可能预示重要行情启动。';
  } else if (volumeChange > 5) {
    volumeTrend = '小幅放大';
    volumeComment = '近期成交量小幅放大，市场活跃度有所提升。';
  } else if (volumeChange < -20) {
    volumeTrend = '明显萎缩';
    volumeComment =
      '近期成交量明显萎缩，表明交投清淡，可能是底部构筑过程，主力可能在低位悄悄吸筹。';
  } else if (volumeChange < -5) {
    volumeTrend = '小幅萎缩';
    volumeComment = '近期成交量小幅萎缩，市场活跃度有所下降。';
  } else {
    volumeTrend = '基本稳定';
    volumeComment = '近期成交量基本稳定，市场处于均衡状态。';
  }

  return {
    recentVolumeChange: parseFloat(volumeChange.toFixed(2)),
    volumeTrend,
    volumeComment,
  };
}

/**
 * 分析筹码移动趋势 - 改进版
 * 通过比较不同时期的筹码分布来分析筹码迁移方向
 */
function analyzeChipMigration(
  data: Candle[],
  currentPrice: number
): {
  chipMigrationDirection: string;
  chipMigrationSpeed: number;
  migrationComment: string;
} {
  // 防御性检查：确保有足够的数据进行分析
  if (data.length < 10) {
    return {
      chipMigrationDirection: '数据不足',
      chipMigrationSpeed: 0,
      migrationComment: '历史数据不足，无法分析筹码迁移趋势。',
    };
  }

  // 动态计算期间长度，确保至少有5个数据点
  const recentPeriod = Math.max(5, Math.min(30, Math.floor(data.length / 3)));
  const previousPeriod = Math.max(5, Math.min(30, Math.floor(data.length / 3)));

  // 确保有足够的数据来计算两个周期
  if (data.length < recentPeriod + previousPeriod) {
    return {
      chipMigrationDirection: '数据不足',
      chipMigrationSpeed: 0,
      migrationComment: '历史数据不足，无法完整分析筹码迁移趋势。',
    };
  }

  const recentData = data.slice(data.length - recentPeriod);
  const previousData = data.slice(
    data.length - recentPeriod - previousPeriod,
    data.length - recentPeriod
  );

  // 计算筹码分布
  const recentDistribution = calculateChipDistribution(recentData);
  const previousDistribution = calculateChipDistribution(previousData);

  // 防御性检查：确保分布计算成功
  if (!recentDistribution.length || !previousDistribution.length) {
    return {
      chipMigrationDirection: '计算错误',
      chipMigrationSpeed: 0,
      migrationComment: '筹码分布计算失败，无法分析迁移趋势。',
    };
  }

  // 计算近期和前期的平均价格（加权平均）
  const recentTotalPercentage = recentDistribution.reduce(
    (sum, item) => sum + item.percentage,
    0
  );

  const previousTotalPercentage = previousDistribution.reduce(
    (sum, item) => sum + item.percentage,
    0
  );

  // 防御性检查：确保分母不为零
  const recentAvgPrice =
    recentTotalPercentage > 0
      ? recentDistribution.reduce(
          (sum, item) => sum + item.price * item.percentage,
          0
        ) / recentTotalPercentage
      : 0;

  const previousAvgPrice =
    previousTotalPercentage > 0
      ? previousDistribution.reduce(
          (sum, item) => sum + item.price * item.percentage,
          0
        ) / previousTotalPercentage
      : 0;

  // 防御性检查：确保计算有效
  if (recentAvgPrice === 0 || previousAvgPrice === 0) {
    return {
      chipMigrationDirection: '计算错误',
      chipMigrationSpeed: 0,
      migrationComment: '筹码分布数据异常，无法分析迁移趋势。',
    };
  }

  // 计算价格变化百分比
  const priceChange =
    ((recentAvgPrice - previousAvgPrice) / previousAvgPrice) * 100;

  // 计算市场波动率，用于动态调整阈值
  const priceSeries = data.slice(-30).map(d => d.close);
  const avgPrice =
    priceSeries.reduce((sum, price) => sum + price, 0) / priceSeries.length;
  const volatility =
    (Math.sqrt(
      priceSeries.reduce(
        (sum, price) => sum + Math.pow(price - avgPrice, 2),
        0
      ) / priceSeries.length
    ) /
      (Math.abs(avgPrice) < 1e-8 ? 1e-8 : avgPrice)) *
    100;

  // 动态阈值：在高波动市场中使用更高的阈值
  const significantThreshold = Math.max(2, volatility * 0.5);
  const moderateThreshold = Math.max(0.5, volatility * 0.2);

  // 计算筹码移动速度：考虑时间因素和市场波动性
  const timeNormalization = 30 / recentPeriod; // 标准化为30天周期
  const normalizedChange = Math.abs(priceChange) * timeNormalization;
  const volDenom = Math.max(volatility * 0.1, 1e-8);
  const migrationSpeed = Math.min(100, (normalizedChange / volDenom) * 10);

  // 计算不同价格区间的筹码变化
  const calculateChipChangeInRange = (
    recentDist: ChipDistribution[],
    previousDist: ChipDistribution[],
    minPrice: number,
    maxPrice: number
  ): number => {
    const recentTotal = recentDist
      .filter(item => item.price >= minPrice && item.price < maxPrice)
      .reduce((sum, item) => sum + item.percentage, 0);

    const previousTotal = previousDist
      .filter(item => item.price >= minPrice && item.price < maxPrice)
      .reduce((sum, item) => sum + item.percentage, 0);

    return recentTotal - previousTotal;
  };

  const lowPriceChipChange = calculateChipChangeInRange(
    recentDistribution,
    previousDistribution,
    0,
    currentPrice * 0.9
  );

  const midPriceChipChange = calculateChipChangeInRange(
    recentDistribution,
    previousDistribution,
    currentPrice * 0.9,
    currentPrice * 1.1
  );

  const highPriceChipChange = calculateChipChangeInRange(
    recentDistribution,
    previousDistribution,
    currentPrice * 1.1,
    Infinity
  );

  // 计算筹码集中度变化
  const calculateChipConcentration = (
    distribution: ChipDistribution[]
  ): number => {
    const sortedDist = [...distribution].sort(
      (a, b) => b.percentage - a.percentage
    );

    // 前20%的筹码占总筹码的百分比
    const top20Percent = Math.ceil(distribution.length * 0.2);
    if (top20Percent === 0) return 0;

    const top20Weight = sortedDist
      .slice(0, top20Percent)
      .reduce((sum, item) => sum + item.percentage, 0);
    const totalWeight = sortedDist.reduce(
      (sum, item) => sum + item.percentage,
      0
    );

    return totalWeight > 0 ? (top20Weight / totalWeight) * 100 : 0;
  };

  const recentConcentration = calculateChipConcentration(recentDistribution);
  const previousConcentration =
    calculateChipConcentration(previousDistribution);
  const concentrationChange = recentConcentration - previousConcentration;

  // 确定筹码迁移方向
  let migrationDirection = '';
  let migrationComment = '';

  if (priceChange > significantThreshold) {
    migrationDirection = '明显向上';
    migrationComment = '筹码正在明显向上移动，表明持仓成本上移，多头占优势。';
  } else if (priceChange > moderateThreshold) {
    migrationDirection = '缓慢向上';
    migrationComment = '筹码缓慢向上移动，市场温和走强。';
  } else if (priceChange < -significantThreshold) {
    migrationDirection = '明显向下';
    migrationComment = '筹码正在明显向下移动，表明持仓成本下移，空头占优势。';
  } else if (priceChange < -moderateThreshold) {
    migrationDirection = '缓慢向下';
    migrationComment = '筹码缓慢向下移动，市场温和走弱。';
  } else {
    migrationDirection = '基本横盘';
    migrationComment = '筹码基本处于横盘状态，市场处于震荡整理。';
  }

  // 分析筹码聚集趋势
  if (Math.abs(concentrationChange) > 5) {
    migrationComment +=
      concentrationChange > 0
        ? ' 筹码集中度正在提高，可能形成更明确的支撑或阻力位。'
        : ' 筹码集中度正在降低，价格区间可能扩大。';
  }

  // 与当前价格比较，增加更多信息
  const relativePriceRatio = currentPrice / recentAvgPrice;
  if (relativePriceRatio > 1.1) {
    migrationComment +=
      ' 当前价格显著高于主流筹码成本，获利盘较多，注意回调风险。';
  } else if (relativePriceRatio > 1.03) {
    migrationComment +=
      ' 当前价格略高于主流筹码成本，获利筹码增加，可能面临一定抛压。';
  } else if (relativePriceRatio < 0.9) {
    migrationComment +=
      ' 当前价格显著低于主流筹码成本，套牢盘较多，若能放量突破将有较大上涨空间。';
  } else if (relativePriceRatio < 0.97) {
    migrationComment +=
      ' 当前价格略低于主流筹码成本，部分筹码套牢，需要成交量配合才能突破。';
  } else {
    migrationComment += ' 当前价格接近主流筹码成本，多空双方处于相对平衡状态。';
  }

  // 分析筹码区域变化
  if (lowPriceChipChange > 5) {
    migrationComment += ' 低价区筹码明显增加，显示有资金在低位吸筹。';
  } else if (highPriceChipChange > 5) {
    migrationComment += ' 高价区筹码明显增加，显示有获利盘在高位套现的风险。';
  } else if (midPriceChipChange > 5) {
    migrationComment += ' 中间价位筹码增加，市场交投活跃度提升。';
  }

  return {
    chipMigrationDirection: migrationDirection,
    chipMigrationSpeed: parseFloat(migrationSpeed.toFixed(2)),
    migrationComment: migrationComment.trim(),
  };
}

/**
 * 分析筹码分布并生成买入建议
 */
export function analyzeChipDistribution(
  symbol: string,
  chipDistribution: ChipDistribution[],
  currentPrice: number,
  data: Candle[]
): ChipAnalysisResult {
  // 1. 基本信息

  // 2. 计算筹码集中度
  // 使用基尼系数、熵值和前N%的筹码占比来衡量集中度
  const giniCoefficient = calculateGiniCoefficient(chipDistribution);

  // 使用熵值作为筹码分散度的另一个衡量指标
  const entropyValue = calculateEntropyOfDistribution(chipDistribution);

  // 计算累积分布函数，用于后续分析
  const cumulativeDistribution =
    calculateCumulativeDistribution(chipDistribution);

  // 计算多空比率，判断市场情绪
  const bullBearRatio = calculateBullBearRatio(chipDistribution, currentPrice);

  // 识别关键价格水平
  const keyPriceLevels = identifyKeyPriceLevels(chipDistribution, currentPrice);

  // 计算Top 20%价格区间的筹码占比
  const sortedByPercentage = [...chipDistribution].sort(
    (a, b) => b.percentage - a.percentage
  );
  const top20Percentage = sortedByPercentage
    .slice(0, Math.ceil(chipDistribution.length * 0.2))
    .reduce((sum, item) => sum + item.percentage, 0);

  // 筹码集中指数 (0-100)
  const concentrationIndex = Math.round(
    (giniCoefficient * 0.5 + (top20Percentage / 100) * 0.5) * 100
  );

  // 集中度评级
  let concentrationLevel = '';
  let isEasyToPush = false;
  if (concentrationIndex > 70) {
    concentrationLevel = '高';
    isEasyToPush = true;
  } else if (concentrationIndex > 40) {
    concentrationLevel = '中';
    isEasyToPush = concentrationIndex > 60;
  } else {
    concentrationLevel = '低';
    isEasyToPush = false;
  }

  // 3. 分析上方套牢盘
  // 计算当前价格上方的筹码比例
  const chipsAbove = chipDistribution
    .filter(item => item.price > currentPrice)
    .reduce((sum, item) => sum + item.percentage, 0);

  // 计算上方筹码密度 - 上方筹码占比/价格区间数量
  const priceRangesAbove = chipDistribution.filter(
    item => item.price > currentPrice
  ).length;
  const chipDensityAbove =
    priceRangesAbove > 0 ? chipsAbove / priceRangesAbove : 0;

  // 阻力评级
  let resistanceLevel = '';
  let isPushingDifficult = false;

  if (chipsAbove > 40) {
    resistanceLevel = '强';
    isPushingDifficult = true;
  } else if (chipsAbove > 20) {
    resistanceLevel = '中';
    isPushingDifficult = chipDensityAbove > 0.8; // 如果上方筹码密度较高，也视为困难
  } else {
    resistanceLevel = '弱';
    isPushingDifficult = false;
  }

  // 4. 分析获利盘比例
  // 计算当前价格下方的筹码比例 (视为获利盘)
  const profitChipsPercentage = chipDistribution
    .filter(item => item.price < currentPrice)
    .reduce((sum, item) => sum + item.percentage, 0);

  // 获利风险评级
  let profitTakingRisk = '';
  let isRiskyToChase = false;

  if (profitChipsPercentage > 60) {
    profitTakingRisk = '高';
    isRiskyToChase = true;
  } else if (profitChipsPercentage > 30) {
    profitTakingRisk = '中';
    isRiskyToChase = currentPrice > sortedByPercentage[0].price * 1.1; // 如果当前价格高于主要筹码峰10%以上
  } else {
    profitTakingRisk = '低';
    isRiskyToChase = false;
  }

  // 5. 识别和分析筹码峰 - 新增功能
  const chipPeaks = identifyChipPeaks(chipDistribution, currentPrice);
  const majorPeaks = chipPeaks.filter(peak => peak.peakType === 'major');

  // 6. 分析筹码峰形态
  const peakAnalysis = analyzeChipPeakPattern(
    chipPeaks,
    currentPrice,
    chipDistribution
  );

  // 7. 分析成交量趋势
  const volumeAnalysis = analyzeVolumeTrend(data);

  // 8. 分析筹码移动趋势
  const migrationAnalysis = analyzeChipMigration(data, currentPrice);

  // 9. 计算技术指标
  const technicalIndicators = calculateTechnicalIndicators(data);

  // 10. 生成买入建议（使用评分模块）
  const buy = scoreBuySignal({
    concentrationLevel,
    bullBearRatio,
    resistanceLevel,
    shapeBuySignal: peakAnalysis.shapeBuySignal,
    volumeTrend: volumeAnalysis.volumeTrend,
    profitChipsPercentage,
    chipMigrationDirection: migrationAnalysis.chipMigrationDirection,
    technicalSignal: technicalIndicators.technicalSignal,
  });
  const buyScore = buy.score;
  const buyRecommendation = buy.recommendation;
  let buyComment = buy.comment;

  // 11. 新增：生成卖空建议（使用评分模块）
  const short = scoreShortSignal({
    concentrationLevel,
    bullBearRatio,
    resistanceLevel,
    shapeBuySignal: peakAnalysis.shapeBuySignal,
    volumeTrend: volumeAnalysis.volumeTrend,
    profitChipsPercentage,
    chipMigrationDirection: migrationAnalysis.chipMigrationDirection,
    technicalSignal: technicalIndicators.technicalSignal,
    rsiLevel: technicalIndicators.rsiLevel,
  });
  const shortScore = short.score;
  const shortRecommendation = short.recommendation;
  let shortComment = short.comment;
  const isShortRecommended = short.isShort;

  // 12. 制定综合交易建议（使用评分模块）
  const overall = buildOverallSuggestion(buyScore, shortScore);
  const overallRecommendation = overall.overallRecommendation;
  const positionSuggestion = overall.positionSuggestion;
  let overallComment = overall.overallComment;

  // 增加一些具体细节到建议中（使用封装方法）
  ({ buyComment, shortComment } = enrichCommentsWithPeaks(
    majorPeaks,
    currentPrice,
    buyComment,
    shortComment
  ));

  // 在处理强支撑位的地方保存 closestSupport
  let closestSupport = null;
  if (keyPriceLevels.strongSupports.length > 0) {
    closestSupport = keyPriceLevels.strongSupports.reduce((closest, price) =>
      Math.abs(price - currentPrice) < Math.abs(closest - currentPrice)
        ? price
        : closest
    );
    const supportDistance = (
      ((closestSupport - currentPrice) / currentPrice) *
      100
    ).toFixed(2);

    buyComment += ` 最近的强支撑位在${closestSupport.toFixed(2)}(距当前价格${supportDistance}%)。`;
    shortComment += ` 注意最近的强支撑位在${closestSupport.toFixed(2)}(距当前价格${supportDistance}%)，跌破此位可加仓做空。`;
  }

  // 在处理强阻力位的地方使用已保存的 closestSupport
  let closestResistance = null;
  if (keyPriceLevels.strongResistances.length > 0) {
    closestResistance = keyPriceLevels.strongResistances.reduce(
      (closest, price) =>
        Math.abs(price - currentPrice) < Math.abs(closest - currentPrice)
          ? price
          : closest
    );
    const resistanceDistance = (
      ((closestResistance - currentPrice) / currentPrice) *
      100
    ).toFixed(2);

    buyComment += ` 最近的强阻力位在${closestResistance.toFixed(2)}(距当前价格${resistanceDistance}%)。`;
    shortComment += ` 最近的强阻力位在${closestResistance.toFixed(2)}(距当前价格${resistanceDistance}%)，可作为做空的进场点。`;
  }

  // 在处理完支撑位和阻力位后，添加到 overallComment
  if (closestSupport || closestResistance) {
    overallComment += ' 短期关注';
    if (closestSupport) {
      overallComment += `${closestSupport.toFixed(2)}支撑位`;
      if (closestResistance) {
        overallComment += '和';
      }
    }
    if (closestResistance) {
      overallComment += `${closestResistance.toFixed(2)}阻力位`;
    }
    overallComment += '的表现。';
  }

  if (profitTakingRisk === '高') {
    buyComment += ' 当前获利盘较多，存在回调风险。';
    shortComment += ' 当前获利盘较多，存在获利了结引发下跌的可能，利于做空。';
  }

  if (technicalIndicators.rsiLevel < 30) {
    buyComment += ' RSI处于超卖区域，可能出现技术性反弹。';
    shortComment += ' RSI处于超卖区域，不建议继续做空，注意反弹风险。';
  } else if (technicalIndicators.rsiLevel > 70) {
    buyComment += ' RSI处于超买区域，短期可能面临回调。';
    shortComment += ' RSI处于超买区域，技术上存在回落空间，有利于做空。';
  }

  // 13. 寻找主要支撑位和阻力位 (筹码密集区)
  const majorSupportLevels = chipPeaks
    .filter(peak => peak.price < currentPrice)
    .slice(0, 3)
    .map(peak => peak.price);

  const majorResistanceLevels = chipPeaks
    .filter(peak => peak.price > currentPrice)
    .slice(0, 3)
    .map(peak => peak.price);

  // 14. 生成评论
  const concentrationComment =
    `筹码集中度${concentrationLevel}，筹码集中指数: ${concentrationIndex}。` +
    `前20%价格区间的筹码占比为${top20Percentage.toFixed(2)}%。` +
    (isEasyToPush
      ? '筹码分布相对集中，套牢盘较少，技术上更容易拉升。'
      : '筹码分布分散，不利于短期快速拉升。');

  const resistanceComment =
    `上方套牢盘占比${chipsAbove.toFixed(2)}%，阻力${resistanceLevel}。` +
    (isPushingDifficult
      ? '存在明显上方阻力，拉升难度较大。'
      : '上方阻力较小，技术上拉升较为容易。');

  const profitComment =
    `当前获利筹码占比${profitChipsPercentage.toFixed(2)}%，获利风险${profitTakingRisk}。` +
    (isRiskyToChase
      ? '获利盘较多，追高风险较大，可能面临较大抛压。'
      : '获利盘风险可控，适当追高风险相对较低。');

  // 整合分析结果
  return {
    symbol,
    currentPrice,
    concentrationIndex,
    concentrationLevel,
    isEasyToPush,
    concentrationComment,
    entropyValue,
    bullBearRatio,
    trappedChipsAbove: chipsAbove,
    resistanceLevel,
    isPushingDifficult,
    resistanceComment,
    profitChipsPercentage,
    profitTakingRisk,
    isRiskyToChase,
    profitComment,
    chipPeaks,
    majorPeaks,
    peakDistribution: peakAnalysis.peakDistribution,
    peakComment: peakAnalysis.peakComment,
    chipShape: peakAnalysis.chipShape,
    shapeBuySignal: peakAnalysis.shapeBuySignal,
    shapeComment: peakAnalysis.peakComment,
    recentVolumeChange: volumeAnalysis.recentVolumeChange,
    volumeTrend: volumeAnalysis.volumeTrend,
    volumeComment: volumeAnalysis.volumeComment,
    chipMigrationDirection: migrationAnalysis.chipMigrationDirection,
    chipMigrationSpeed: migrationAnalysis.chipMigrationSpeed,
    migrationComment: migrationAnalysis.migrationComment,
    buySignalStrength: buyScore,
    buyRecommendation,
    buyComment,
    shortSignalStrength: shortScore,
    shortRecommendation,
    shortComment,
    isShortRecommended,
    overallRecommendation,
    positionSuggestion,
    overallComment,
    majorSupportLevels,
    majorResistanceLevels,
    giniCoefficient,
    strongSupportLevels: keyPriceLevels.strongSupports,
    moderateSupportLevels: keyPriceLevels.moderateSupports,
    strongResistanceLevels: keyPriceLevels.strongResistances,
    moderateResistanceLevels: keyPriceLevels.moderateResistances,
    cumulativeDistribution,
    macdSignal: technicalIndicators.macdSignal,
    rsiLevel: technicalIndicators.rsiLevel,
    bollingerStatus: technicalIndicators.bollingerStatus,
    technicalSignal: technicalIndicators.technicalSignal,
  };
}
