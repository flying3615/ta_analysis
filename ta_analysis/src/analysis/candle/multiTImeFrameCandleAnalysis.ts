import { generateTradeRecommendation } from './BullOrBearDetector.js';
import { Candle } from '../../types.js';
import { getStockDataForTimeframe } from '../../util/util.js';

/**
 * 生成多个股票的交易计划，并以JSON格式返回
 * @param symbol 股票代码数组
 * @param dailyCandles
 * @param weeklyCandles
 * @returns 多股票交易计划JSON
 */
const multiTimeCandleAnalysis = async (
  symbol: string,
  dailyCandles: Candle[],
  weeklyCandles: Candle[]
): Promise<Record<string, any>> => {
  console.log('生成交易计划...');

  try {
    console.log(`分析 ${symbol}...`);
    const recommendation = await generateTradeRecommendation(
      symbol,
      dailyCandles,
      weeklyCandles
    );

    // 计算潜在收益与风险
    let potentialProfit = 0;
    let potentialLoss = 0;
    let riskRewardRatio = 0;
    let profitPercentage = 0;
    let lossPercentage = 0;

    if (
      recommendation.hasSignal &&
      recommendation.direction === 'bullish' &&
      recommendation.takeProfitPrice &&
      recommendation.stopLossPrice
    ) {
      potentialProfit =
        recommendation.takeProfitPrice - recommendation.currentPrice;
      potentialLoss =
        recommendation.currentPrice - recommendation.stopLossPrice;
      riskRewardRatio = potentialProfit / potentialLoss;
      profitPercentage = (potentialProfit / recommendation.currentPrice) * 100;
      lossPercentage = (potentialLoss / recommendation.currentPrice) * 100;
    } else if (
      recommendation.hasSignal &&
      recommendation.direction === 'bearish' &&
      recommendation.takeProfitPrice &&
      recommendation.stopLossPrice
    ) {
      potentialProfit =
        recommendation.currentPrice - recommendation.takeProfitPrice;
      potentialLoss =
        recommendation.stopLossPrice - recommendation.currentPrice;
      riskRewardRatio = potentialProfit / potentialLoss;
      profitPercentage = (potentialProfit / recommendation.currentPrice) * 100;
      lossPercentage = (potentialLoss / recommendation.currentPrice) * 100;
    }

    // 格式化日线和周线形态数据
    const dailyBullishDetails =
      recommendation.dailySignals.bullishDetails?.map(pattern => ({
        date: pattern.date.toISOString(),
        patterns: pattern.patternNames,
        strength: pattern.strength,
        price: pattern.priceLevel,
      })) || [];

    const dailyBearishDetails =
      recommendation.dailySignals.bearishDetails?.map(pattern => ({
        date: pattern.date.toISOString(),
        patterns: pattern.patternNames,
        strength: pattern.strength,
        price: pattern.priceLevel,
      })) || [];

    const weeklyBullishDetails =
      recommendation.weeklySignals.bullishDetails?.map(pattern => ({
        date: pattern.date.toISOString(),
        patterns: pattern.patternNames,
        strength: pattern.strength,
        price: pattern.priceLevel,
      })) || [];

    const weeklyBearishDetails =
      recommendation.weeklySignals.bearishDetails?.map(pattern => ({
        date: pattern.date.toISOString(),
        patterns: pattern.patternNames,
        strength: pattern.strength,
        price: pattern.priceLevel,
      })) || [];

    return {
      symbol: recommendation.symbol,
      currentPrice: recommendation.currentPrice,
      hasSignal: recommendation.hasSignal,
      direction: recommendation.direction,
      signalStrength: parseFloat(recommendation.signalStrength.toFixed(2)),
      entryPrice: recommendation.entryPrice,
      stopLossPrice: recommendation.stopLossPrice,
      targetPrice: recommendation.takeProfitPrice,
      reasoning: recommendation.reasoning,
      riskReward: {
        potentialProfit: parseFloat(potentialProfit.toFixed(2)),
        potentialLoss: parseFloat(potentialLoss.toFixed(2)),
        profitPercentage: parseFloat(profitPercentage.toFixed(2)),
        lossPercentage: parseFloat(lossPercentage.toFixed(2)),
        riskRewardRatio: parseFloat(riskRewardRatio.toFixed(2)),
      },
      patterns: {
        daily: {
          bullish: dailyBullishDetails,
          bearish: dailyBearishDetails,
        },
        weekly: {
          bullish: weeklyBullishDetails,
          bearish: weeklyBearishDetails,
        },
      },
    };
  } catch (error) {
    console.error(`分析 ${symbol} 时出错:`, error);
    return {
      symbol,
      error: `分析出错: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
};

/**
 * 生成JSON格式的交易计划文件
 */
export const tradesPlanFromCandlesPattern = async (symbol: string) => {
  // 获取不同时间周期的数据
  const today = new Date();

  const startDateWeekly = new Date();
  startDateWeekly.setDate(today.getDate() - 365); // 获取一年的数据

  const startDateDaily = new Date();
  startDateDaily.setDate(today.getDate() - 90); // 获取三个月的数据

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

  // 生成交易计划
  const tradePlans = await multiTimeCandleAnalysis(
    symbol,
    dailyData,
    weeklyData
  );

  // 将交易计划保存为JSON字符串
  const tradePlansJson = JSON.stringify(tradePlans, null, 2);

  // 打印JSON字符串
  console.log('\n===== 交易计划JSON =====');
  console.log(tradePlansJson);

  return tradePlansJson;
};

// 运行测试
// TODO need to check if the signal happens on S/R level
// print out patterns name
const result = tradesPlanFromCandlesPattern('COIN'); // 生成JSON格式交易计划
console.log(JSON.stringify(result, null, 2));

export { multiTimeCandleAnalysis };
