import {
  AnalysisResult,
  Candle,
  PatternFeatures,
  PatternMatchResult,
} from '../types.js';
import {
  calculateSlope,
  getStockData,
  getStockDataForTimeframe,
  percentChange,
  rollingMax,
  rollingMin,
  standardDeviation,
} from '../util/util.js';
import { EMA, RSI, SMA } from 'technicalindicators';

export function extractPatternFeatures(candles: Candle[]): PatternFeatures {
  const analysis = analyzeStockPattern(candles);
  // 保留原有代码...
  let trendType: 'up' | 'down' | 'sideways';
  if (Math.abs(analysis.trendSlope) < 0.01) {
    trendType = 'sideways';
  } else {
    trendType = analysis.trendSlope > 0 ? 'up' : 'down';
  }

  let volatilityLevel: 'high' | 'medium' | 'low';
  if (analysis.volatility > 0.4) {
    volatilityLevel = 'high';
  } else if (analysis.volatility > 0.2) {
    volatilityLevel = 'medium';
  } else {
    volatilityLevel = 'low';
  }

  let volumePattern: 'increasing' | 'decreasing' | 'stable' | 'spikes';
  if (
    analysis.highVolumeDates.length >
    Math.floor(analysis.highVolumeDates.length / 10)
  ) {
    volumePattern = 'spikes';
  } else if (Math.abs(analysis.avgVolumeRatio - 1) < 0.1) {
    volumePattern = 'stable';
  } else {
    volumePattern = analysis.avgVolumeRatio > 1 ? 'increasing' : 'decreasing';
  }

  let rsiState: 'overbought' | 'oversold' | 'neutral';
  if (analysis.currentRsi > 70) {
    rsiState = 'overbought';
  } else if (analysis.currentRsi < 30) {
    rsiState = 'oversold';
  } else {
    rsiState = 'neutral';
  }

  const supportResistanceCount =
    analysis.supportLevels.length + analysis.resistanceLevels.length;

  let maConfiguration: 'above' | 'below' | 'crossing';
  if (
    analysis.goldenCrossDates.length > 0 &&
    analysis.deathCrossDates.length > 0
  ) {
    const lastGoldenCross =
      analysis.goldenCrossDates[analysis.goldenCrossDates.length - 1];
    const lastDeathCross =
      analysis.deathCrossDates[analysis.deathCrossDates.length - 1];

    if (lastGoldenCross > lastDeathCross) {
      maConfiguration = 'above';
    } else {
      maConfiguration = 'below';
    }
  } else if (analysis.goldenCrossDates.length > 0) {
    maConfiguration = 'above';
  } else if (analysis.deathCrossDates.length > 0) {
    maConfiguration = 'below';
  } else {
    maConfiguration = 'crossing';
  }

  // 计算波动率趋势
  let volatilityTrend: 'decreasing' | 'increasing' | 'stable';
  // 获取价格和日期数据
  const prices = candles.map(candle => candle.close);
  const highs = candles.map(candle => candle.high);
  const lows = candles.map(candle => candle.low);
  const opens = candles.map(candle => candle.open);
  const volumes = candles.map(candle => candle.volume);
  const windowSize = Math.min(20, Math.floor(prices.length / 4));

  // 计算滚动波动率
  const rollingVolatilities: number[] = [];
  for (let i = windowSize; i < prices.length; i++) {
    const windowPrices = prices.slice(i - windowSize, i);
    const returns = percentChange(windowPrices);
    rollingVolatilities.push(standardDeviation(returns) * Math.sqrt(252));
  }

  const volatilitySlope = calculateSlope(rollingVolatilities);

  if (Math.abs(volatilitySlope) < 0.0005) {
    volatilityTrend = 'stable';
  } else {
    volatilityTrend = volatilitySlope < 0 ? 'decreasing' : 'increasing';
  }

  // 新逻辑：判断在波动率低的区域，价格位于交易区间的位置
  let priceVolatilityPattern:
    | 'low_volatility_upper_range'
    | 'low_volatility_lower_range'
    | 'low_volatility_mid_range'
    | 'other';

  // 只在波动率低或波动率下降的情况下进行判断
  if (volatilityLevel === 'low' || volatilityTrend === 'decreasing') {
    // 获取最近一段时间的价格数据（例如最后10个交易日）
    const recentPrices = prices.slice(-10);
    const highestPrice = Math.max(...recentPrices);
    const lowestPrice = Math.min(...recentPrices);
    const priceRange = highestPrice - lowestPrice;

    // 获取最近的收盘价
    const lastPrice = prices[prices.length - 1];

    // 计算最新价格在区间中的相对位置 (0 表示在最低点，1 表示在最高点)
    const relativePosition =
      priceRange > 0 ? (lastPrice - lowestPrice) / priceRange : 0.5;

    // 判断价格是在上部、中部还是下部
    if (relativePosition > 0.67) {
      priceVolatilityPattern = 'low_volatility_upper_range';
    } else if (relativePosition < 0.33) {
      priceVolatilityPattern = 'low_volatility_lower_range';
    } else {
      priceVolatilityPattern = 'low_volatility_mid_range';
    }
  } else {
    priceVolatilityPattern = 'other';
  }

  // 1. 价格行为模式识别
  let priceAction:
    | 'breakout'
    | 'breakdown'
    | 'consolidation'
    | 'pullback'
    | 'other';

  // 检查最近的价格是否突破了前期阻力
  if (prices.length >= 20) {
    const recentPrice = prices[prices.length - 1];
    const previousPrices = prices.slice(-20, -1);
    const previousHigh = Math.max(...previousPrices);

    // 计算前期20天的价格范围
    const priceRange =
      Math.max(...previousPrices) - Math.min(...previousPrices);
    const rangeMidpoint = Math.min(...previousPrices) + priceRange / 2;

    const ema20Prices = EMA.calculate({
      period: 20,
      values: prices,
    });
    const ema20Price = ema20Prices[ema20Prices.length - 1];

    const derivation = (recentPrice - ema20Price) / ema20Price;
    const isNear = Math.abs(derivation) <= 0.03;

    if (recentPrice > previousHigh * 1.02) {
      priceAction = 'breakout';
    } else if (recentPrice < Math.min(...previousPrices) * 0.98) {
      priceAction = 'breakdown';
    } else if (priceRange < previousHigh * 0.05) {
      // 价格范围小于5%视为盘整
      priceAction = 'consolidation';
    } else if (trendType === 'up' && isNear) {
      priceAction = 'pullback';
    } else {
      priceAction = 'other';
    }
  } else {
    priceAction = 'other';
  }

  // 2. 识别蜡烛图形态
  const candlePatterns: string[] = [];

  // 识别十字星形态
  for (let i = 0; i < candles.length; i++) {
    const body = Math.abs(candles[i].close - candles[i].open);
    const totalRange = candles[i].high - candles[i].low;

    if (body / totalRange < 0.1 && totalRange > 0) {
      candlePatterns.push('doji');
      break; // 只记录一次
    }
  }

  // 识别锤子线
  for (let i = 0; i < candles.length; i++) {
    const bodyHigh = Math.max(candles[i].open, candles[i].close);
    const bodyLow = Math.min(candles[i].open, candles[i].close);
    const body = bodyHigh - bodyLow;
    const upperShadow = candles[i].high - bodyHigh;
    const lowerShadow = bodyLow - candles[i].low;

    if (body > 0 && lowerShadow > body * 2 && upperShadow < body * 0.2) {
      candlePatterns.push('hammer');
      break; // 只记录一次
    }
  }

  // 识别吞没形态
  for (let i = 1; i < candles.length; i++) {
    const current = candles[i];
    const previous = candles[i - 1];

    // 定义上涨和下跌的K线
    const currentBullish = current.close > current.open;
    const previousBullish = previous.close > previous.open;

    // 看涨吞没形态
    if (
      !previousBullish &&
      currentBullish &&
      current.close > previous.open &&
      current.open < previous.close
    ) {
      candlePatterns.push('bullish_engulfing');
      break; // 只记录一次
    }

    // 看跌吞没形态
    if (
      previousBullish &&
      !currentBullish &&
      current.open > previous.close &&
      current.close < previous.open
    ) {
      candlePatterns.push('bearish_engulfing');
      break; // 只记录一次
    }
  }

  // 3. 检查是否存在价格缺口
  let gapPresent = false;
  for (let i = 1; i < candles.length; i++) {
    const current = candles[i];
    const previous = candles[i - 1];

    // 上涨缺口
    if (current.low > previous.high) {
      gapPresent = true;
      break;
    }

    // 下跌缺口
    if (current.high < previous.low) {
      gapPresent = true;
      break;
    }
  }

  // 4. 分析价格与成交量的关系
  let volumePriceRelationship:
    | 'rising_price_rising_volume'
    | 'rising_price_falling_volume'
    | 'falling_price_rising_volume'
    | 'falling_price_falling_volume'
    | 'neutral';

  if (prices.length >= 5 && volumes.length >= 5) {
    const recentPrices = prices.slice(-5);
    const recentVolumes = volumes.slice(-5);

    const priceChange = recentPrices[recentPrices.length - 1] - recentPrices[0];
    const volumeChange =
      recentVolumes[recentVolumes.length - 1] - recentVolumes[0];

    if (priceChange > 0 && volumeChange > 0) {
      volumePriceRelationship = 'rising_price_rising_volume';
    } else if (priceChange > 0 && volumeChange < 0) {
      volumePriceRelationship = 'rising_price_falling_volume';
    } else if (priceChange < 0 && volumeChange > 0) {
      volumePriceRelationship = 'falling_price_rising_volume';
    } else if (priceChange < 0 && volumeChange < 0) {
      volumePriceRelationship = 'falling_price_falling_volume';
    } else {
      volumePriceRelationship = 'neutral';
    }
  } else {
    volumePriceRelationship = 'neutral';
  }

  // 5. 分析波动高点和低点
  let swingHighsLows:
    | 'higher_highs_higher_lows'
    | 'lower_highs_lower_lows'
    | 'higher_highs_lower_lows'
    | 'lower_highs_higher_lows'
    | 'flat';

  if (prices.length >= 20) {
    // 简单方法：将数据分成4段，比较第一段和最后一段的高点和低点
    const segment1 = highs.slice(0, 5);
    const segment4 = highs.slice(-5);
    const segment1Lows = lows.slice(0, 5);
    const segment4Lows = lows.slice(-5);

    const segment1High = Math.max(...segment1);
    const segment4High = Math.max(...segment4);
    const segment1Low = Math.min(...segment1Lows);
    const segment4Low = Math.min(...segment4Lows);

    const higherHighs = segment4High > segment1High;
    const higherLows = segment4Low > segment1Low;

    if (higherHighs && higherLows) {
      swingHighsLows = 'higher_highs_higher_lows';
    } else if (!higherHighs && !higherLows) {
      swingHighsLows = 'lower_highs_lower_lows';
    } else if (higherHighs && !higherLows) {
      swingHighsLows = 'higher_highs_lower_lows';
    } else if (!higherHighs && higherLows) {
      swingHighsLows = 'lower_highs_higher_lows';
    } else {
      swingHighsLows = 'flat';
    }
  } else {
    swingHighsLows = 'flat';
  }

  // 6. 识别价格通道类型
  let priceChannelType:
    | 'ascending'
    | 'descending'
    | 'horizontal'
    | 'expanding'
    | 'contracting'
    | 'none';

  if (prices.length >= 20) {
    // 计算高点和低点的线性回归斜率
    const highsSlope = calculateSlope(highs.slice(-20));
    const lowsSlope = calculateSlope(lows.slice(-20));

    // 计算通道宽度变化
    const recentChannelWidth =
      Math.max(...highs.slice(-5)) - Math.min(...lows.slice(-5));
    const earlierChannelWidth =
      Math.max(...highs.slice(-20, -15)) - Math.min(...lows.slice(-20, -15));
    const channelWidthChange = recentChannelWidth - earlierChannelWidth;

    if (Math.abs(highsSlope) < 0.0001 && Math.abs(lowsSlope) < 0.0001) {
      priceChannelType = 'horizontal';
    } else if (highsSlope > 0.0001 && lowsSlope > 0.0001) {
      priceChannelType = 'ascending';
    } else if (highsSlope < -0.0001 && lowsSlope < -0.0001) {
      priceChannelType = 'descending';
    } else if (channelWidthChange > earlierChannelWidth * 0.2) {
      priceChannelType = 'expanding';
    } else if (channelWidthChange < -earlierChannelWidth * 0.2) {
      priceChannelType = 'contracting';
    } else {
      priceChannelType = 'none';
    }
  } else {
    priceChannelType = 'none';
  }

  return {
    // 现有特征...
    trendType,
    volatilityLevel,
    volumePattern,
    rsiState,
    supportResistanceCount,
    maConfiguration,
    volatilityTrend,
    priceVolatilityPattern,

    // 新增特征
    priceAction,
    candlePatterns,
    gapPresent,
    volumePriceRelationship,
    swingHighsLows,
    priceChannelType,
  };
}

// 3. 权重可能需要调整，特别是新的 priceVolatilityPattern 特征
export function matchStockPattern(
  symbol: string,
  sourcePatterns: PatternFeatures,
  targetPatterns: PatternFeatures
): PatternMatchResult {
  // 匹配每个特征
  const featureMatches: { [feature: string]: boolean } = {
    trendType: targetPatterns.trendType === sourcePatterns.trendType,
    volatilityLevel:
      targetPatterns.volatilityLevel === sourcePatterns.volatilityLevel,
    volumePattern:
      targetPatterns.volumePattern === sourcePatterns.volumePattern,
    rsiState: targetPatterns.rsiState === sourcePatterns.rsiState,
    maConfiguration:
      targetPatterns.maConfiguration === sourcePatterns.maConfiguration,
    supportResistanceCount:
      Math.abs(
        targetPatterns.supportResistanceCount -
          sourcePatterns.supportResistanceCount
      ) <= 2,
    volatilityTrend:
      targetPatterns.volatilityTrend === sourcePatterns.volatilityTrend,
    priceVolatilityPattern:
      targetPatterns.priceVolatilityPattern ===
      sourcePatterns.priceVolatilityPattern,
    priceAction: targetPatterns.priceAction === sourcePatterns.priceAction,
    // 对于蜡烛图形态，检查是否有至少一个共同模式
    candlePatterns:
      sourcePatterns.candlePatterns.some(pattern =>
        targetPatterns.candlePatterns.includes(pattern)
      ) ||
      (sourcePatterns.candlePatterns.length === 0 &&
        targetPatterns.candlePatterns.length === 0),
    gapPresent: targetPatterns.gapPresent === sourcePatterns.gapPresent,
    volumePriceRelationship:
      targetPatterns.volumePriceRelationship ===
      sourcePatterns.volumePriceRelationship,
    swingHighsLows:
      targetPatterns.swingHighsLows === sourcePatterns.swingHighsLows,
    priceChannelType:
      targetPatterns.priceChannelType === sourcePatterns.priceChannelType,
  };

  // 计算匹配得分 (0-100)
  const weights = {
    trendType: 0.08,
    volatilityLevel: 0.06,
    volumePattern: 0.06,
    rsiState: 0.06,
    maConfiguration: 0.08,
    supportResistanceCount: 0.03,
    volatilityTrend: 0.07,
    priceVolatilityPattern: 0.1,
    priceAction: 0.1,
    candlePatterns: 0.08,
    gapPresent: 0.05,
    volumePriceRelationship: 0.08,
    swingHighsLows: 0.07,
    priceChannelType: 0.08,
  };

  let score = 0;
  for (const [feature, isMatch] of Object.entries(featureMatches)) {
    if (isMatch) {
      score += weights[feature as keyof typeof weights] * 100;
    }
  }

  // 确定是否匹配 (分数 >= 75 被认为是匹配)
  const isMatch = score >= 75;

  return {
    symbol,
    isMatch,
    matchScore: `${score}/100`,
    featureMatches,
    features: targetPatterns,
  };
}

// Main function: analyze stock pattern
function analyzeStockPattern(candles: Candle[]): AnalysisResult {
  const dates = candles.map(candle => candle.timestamp);
  const prices = candles.map(candle => candle.close);
  const volumes = candles.map(candle => candle.volume);

  // 1. Trend analysis
  const slope = calculateSlope(prices);
  const trendDirection = slope > 0 ? 'up' : 'down';

  // 2. Support and resistance levels identification
  // computes the window size as one-twentieth of the length of the prices array,
  // ensures that the window size is at least 10, even if the calculated value is smaller
  const window = Math.max(10, Math.floor(prices.length / 20)); // Dynamic window size
  const rollingMins = rollingMin(prices, window);
  const rollingMaxs = rollingMax(prices, window);

  const supportLevels: number[] = [];
  const resistanceLevels: number[] = [];

  for (let i = window; i < prices.length - window; i++) {
    if (prices[i] === rollingMins[i] && !isNaN(rollingMins[i])) {
      const isNearExisting = supportLevels.some(
        level => Math.abs(level - prices[i]) / prices[i] < 0.02
      );
      if (!isNearExisting) {
        supportLevels.push(prices[i]);
      }
    }
    if (prices[i] === rollingMaxs[i] && !isNaN(rollingMaxs[i])) {
      const isNearExisting = resistanceLevels.some(
        level => Math.abs(level - prices[i]) / prices[i] < 0.02
      );
      if (!isNearExisting) {
        resistanceLevels.push(prices[i]);
      }
    }
  }

  // 3. Moving average analysis - using EMA instead of SMA
  const shortMa = EMA.calculate({
    period: 10,
    values: prices,
  });
  const longMa = EMA.calculate({
    period: 20,
    values: prices,
  });

  const goldenCrossDates: Date[] = [];
  const deathCrossDates: Date[] = [];

  for (let i = 1; i < prices.length; i++) {
    if (
      !isNaN(shortMa[i]) &&
      !isNaN(longMa[i]) &&
      !isNaN(shortMa[i - 1]) &&
      !isNaN(longMa[i - 1])
    ) {
      if (shortMa[i] > longMa[i] && shortMa[i - 1] <= longMa[i - 1]) {
        goldenCrossDates.push(dates[i]);
      }
      if (shortMa[i] < longMa[i] && shortMa[i - 1] >= longMa[i - 1]) {
        deathCrossDates.push(dates[i]);
      }
    }
  }

  // 4. Volume analysis
  const avgVolume = SMA.calculate({ period: 20, values: volumes });
  const volumeRatio: number[] = [];

  for (let i = 0; i < volumes.length; i++) {
    volumeRatio.push(isNaN(avgVolume[i]) ? NaN : volumes[i] / avgVolume[i]);
  }

  const highVolumeDates: Date[] = [];
  let validVolumeRatios = 0;
  let sumVolumeRatio = 0;

  for (let i = 0; i < volumeRatio.length; i++) {
    if (!isNaN(volumeRatio[i])) {
      if (volumeRatio[i] > 2) {
        highVolumeDates.push(dates[i]);
      }
      sumVolumeRatio += volumeRatio[i];
      validVolumeRatios++;
    }
  }

  const avgVolumeRatio =
    validVolumeRatios > 0 ? sumVolumeRatio / validVolumeRatios : 0;

  // 5. Volatility analysis
  const dailyReturns = percentChange(prices);
  const annualizedVolatility = standardDeviation(dailyReturns) * Math.sqrt(252);

  // 6. RSI analysis
  const rsi = RSI.calculate({
    period: 14,
    values: prices,
  });
  const currentRsi = rsi[rsi.length - 1] || 0;

  let overboughtDays = 0;
  let oversoldDays = 0;

  for (const rsiValue of rsi) {
    if (!isNaN(rsiValue)) {
      if (rsiValue > 70) overboughtDays++;
      if (rsiValue < 30) oversoldDays++;
    }
  }

  return {
    trendSlope: slope,
    trendDirection,
    supportLevels,
    resistanceLevels,
    goldenCrossDates,
    deathCrossDates,
    highVolumeDates,
    avgVolumeRatio,
    volatility: annualizedVolatility,
    currentRsi,
    overboughtDays,
    oversoldDays,
  };
}

const main = async () => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 30);

  const sourceCandles = await getStockData('COIN', startDate, endDate);
  const sourceFeatures = extractPatternFeatures(sourceCandles);
  console.log('Source features:', sourceFeatures);

  const targetCandles = await getStockData('MSTR', startDate, endDate);
  const targetFeatures = extractPatternFeatures(targetCandles);
  console.log('Target features:', targetFeatures);

  const result = matchStockPattern('MSTR', sourceFeatures, targetFeatures);

  console.log('Match result:', result);
};

// main();
