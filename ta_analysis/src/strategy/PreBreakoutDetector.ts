import { PatternMatchResult, Strategy } from '../types.js';
import { getStockData } from '../util/util.js';

import { MarketQuery } from '../finance/MarketQuery.js';
import { preBreakOutPattern } from './patternData.js';
import { sourceIds } from '../config.js';

import {
  analyzeStockPattern,
  extractPatternFeatures,
  matchStockPattern,
} from './PatternMathcer.js';

export class PreBreakoutDetector
  implements Strategy<Promise<PatternMatchResult[]>>
{
  async run() {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 60); // 60 days ago

    // 1. Extract features from preBreak
    const targetCandles = preBreakOutPattern.map(pattern => {
      return {
        symbol: pattern.symbol,
        open: pattern.open,
        high: pattern.high,
        low: pattern.low,
        close: pattern.close,
        volume: pattern.volume,
        timestamp: new Date(pattern.timestamp),
      };
    });

    // 4. 修改 analyzeStockPattern 函数调用，传递 candles 参数
    const targetAnalysis = analyzeStockPattern(targetCandles);
    const targetFeatures = extractPatternFeatures(
      targetAnalysis,
      targetCandles
    );

    // Target features: {
    //   trendType: 'sideways',
    //       volatilityLevel: 'high',
    //       volumePattern: 'spikes',
    //       rsiState: 'neutral',
    //       supportResistanceCount: 6,
    //       maConfiguration: 'below',
    //       volatilityTrend: 'decreasing',
    //       priceVolatilityPattern: 'low_volatility_upper_range',
    //       priceAction: 'breakout',
    //       candlePatterns: [ 'doji', 'bullish_engulfing' ],
    //       gapPresent: true,
    //       volumePriceRelationship: 'rising_price_falling_volume',
    //       swingHighsLows: 'higher_highs_higher_lows',
    //       priceChannelType: 'ascending'
    // }

    const marketQuery = new MarketQuery();
    const gainersWithScore = await marketQuery.fetchWholeMarketData({
      minVolume: 5000000, // 成交量 > 500万
      sourceIds,
    });

    const matchedResults: PatternMatchResult[] = [];

    for (const quoteSummary of gainersWithScore) {
      // 2. Analyze new data and match
      const newCandles = await getStockData(
        quoteSummary.symbol,
        startDate,
        endDate
      );

      const matchResult = matchStockPattern(targetFeatures, newCandles);
      if (matchResult.isMatch) {
        matchedResults.push(matchResult);
      }
    }
    return matchedResults;
  }
}
