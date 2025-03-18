import { getStockDataForTimeframe } from '../util/util.js';

interface ExpectedReturnParams {
  symbol: string; // 股票代码
  initialShares: number; // 初始持股数量
  feePerTrade: number; // 每次交易手续费
  downPercent: number; // 下跌买入触发百分比
  upPercent: number; // 上涨卖出触发百分比
  tradingRatio: number; // 用于交易的股票比例
  stopLossPercent: number; // 止损百分比，当股价跌破此百分比时清仓
}

/**
 * 模拟特定波动率下的股价路径
 * @returns 每日股价数组
 * @param symbol
 */
async function getPrices(symbol: string): Promise<number[]> {
  const today = new Date();
  console.log('正在获取数据...');

  const startDate = new Date();
  startDate.setDate(today.getDate() - 30); // 获取一年的数据

  const dailyData = await getStockDataForTimeframe(
    symbol,
    startDate,
    today,
    'daily'
  ); // 获取日线数据

  return dailyData.map(c => c.close);
}

/**
 * 计算在特定价格路径下滚仓策略的收益
 * @param pricePath 价格路径数组
 * @param params 策略参数
 * @returns 策略收益结果
 */
function calculateStrategyReturns(
  pricePath: number[],
  params: ExpectedReturnParams
) {
  const {
    initialShares,
    feePerTrade,
    downPercent,
    upPercent,
    tradingRatio,
    stopLossPercent,
  } = params;

  const initialPrice = pricePath[0];

  // 初始化状态
  let currentShares = initialShares;
  let totalInvestment = initialShares * initialPrice;
  let avgCost = initialPrice;
  let cashBalance = 0;
  let totalFees = 0;
  const tradingPosition = Math.floor(initialShares * tradingRatio);

  // 跟踪买入状态
  let hasBought = false;
  let lastBuyPrice = 0;
  let lastTradeDay = 0;

  // 跟踪止损状态
  let stopLossCount = 0;
  let lastStopLossDay = 0;

  const trades = [];

  // 遍历价格路径
  for (let day = 1; day < pricePath.length; day++) {
    const currentPrice = pricePath[day];

    // 检查是否触发止损
    if (
      currentPrice <= initialPrice * (1 - stopLossPercent) &&
      currentShares > 0
    ) {
      // 执行清仓
      const sellValue = currentShares * currentPrice;

      cashBalance += sellValue - feePerTrade;
      totalFees += feePerTrade;

      // 记录交易
      const stopLossTrade = {
        day,
        type: 'stopLoss',
        price: currentPrice,
        shares: currentShares,
        value: sellValue,
        fee: feePerTrade,
        newShares: 0,
        newAvgCost: 0,
        cycleProfitLoss: sellValue - currentShares * avgCost - feePerTrade *  2,
      };
      trades.push(stopLossTrade);

      // 更新状态
      totalInvestment = 0;
      currentShares = 0;
      avgCost = 0;
      hasBought = false;
      lastTradeDay = day;
      lastStopLossDay = day;
      stopLossCount++;

      continue;
    }

    // 如果未买入状态，检查是否满足买入条件
    if (!hasBought) {
      // 价格下跌达到触发条件
      if (currentPrice <= pricePath[lastTradeDay] * (1 - downPercent)) {
        // 执行买入
        const buyValue = tradingPosition * currentPrice;
        const buyFee = feePerTrade;

        cashBalance -= buyValue + buyFee;
        totalFees += buyFee;

        // 更新持股和成本
        currentShares += tradingPosition;
        totalInvestment += buyValue + buyFee;
        avgCost = totalInvestment / currentShares;

        // 记录交易
        const buyTrade = {
          day,
          type: 'buy',
          price: currentPrice,
          shares: tradingPosition,
          value: buyValue,
          fee: buyFee,
          newShares: currentShares,
          newAvgCost: avgCost,
        };
        trades.push(buyTrade);

        // 更新状态
        hasBought = true;
        lastBuyPrice = currentPrice;
        lastTradeDay = day;
      }
    }
    // 如果已买入状态，检查是否满足卖出条件
    else {
      // 价格上涨达到触发条件
      if (currentPrice >= lastBuyPrice * (1 + upPercent)) {
        // 执行卖出
        const sellValue = tradingPosition * currentPrice;

        cashBalance += sellValue - feePerTrade;
        totalFees += feePerTrade;

        // 更新持股和成本
        totalInvestment =
          totalInvestment * ((currentShares - tradingPosition) / currentShares);
        currentShares -= tradingPosition;
        avgCost = totalInvestment / currentShares;

        // 计算单次循环利润
        const cycleProfitLoss =
          sellValue - tradingPosition * lastBuyPrice - feePerTrade * 2;

        // 记录交易
        const sellTrade = {
          day,
          type: 'sell',
          price: currentPrice,
          shares: tradingPosition,
          value: sellValue,
          fee: feePerTrade,
          newShares: currentShares,
          newAvgCost: avgCost,
          cycleProfitLoss,
        };
        trades.push(sellTrade);

        // 更新状态
        hasBought = false;
        lastTradeDay = day;
      }
    }
  }

  // 计算最终结果
  const finalPrice = pricePath[pricePath.length - 1];
  const finalMarketValue = currentShares * finalPrice;
  const totalReturn =
    finalMarketValue + cashBalance - initialShares * initialPrice;
  const returnRate = (totalReturn / (initialShares * initialPrice)) * 100;

  return {
    initialInvestment: initialShares * initialPrice,
    finalShares: currentShares,
    finalAvgCost: avgCost,
    finalMarketValue,
    cashBalance,
    totalFees,
    totalTrades: trades.length,
    totalReturn,
    returnRate,
    breakevenGrowthNeeded: avgCost > 0 ? (avgCost / finalPrice - 1) * 100 : 0,
    trades,
    stopLossCount,
  };
}

/**
 * 分析滚仓策略在多种市场情景下的预期收益
 * @param params 策略和模拟参数
 * @returns 综合分析结果
 */
async function analyzeExpectedReturns(params: ExpectedReturnParams) {
  const pricePath = await getPrices(params.symbol);

  // 计算策略收益
  const result = calculateStrategyReturns(pricePath, params);

  return {
    simulationParams: {
      initialPrice: pricePath[0],
      currentPrice: pricePath[pricePath.length - 1],
      stopLossPercent: params.stopLossPercent,
    },
    averageResults: {
      averageTotalReturn: result.totalReturn,
      averageReturnRate: result.returnRate,
      averageTrades: result.trades,
      averageFinalCost: result.finalAvgCost,
      stopLossCount: result.stopLossCount,
    },
    allResults: result,
  };
}

/**
 * 格式化分析结果输出
 * @param analysis 分析结果
 * @returns 格式化的字符串输出
 */
function formatAnalysisResult(analysis: any): string {
  const { simulationParams, averageResults } = analysis;

  let output = `# 滚仓策略预期收益分析报告\n\n`;

  output += `## 模拟参数\n`;
  output += `- 初始价格: ${simulationParams.initialPrice.toFixed(2)}元\n`;
  output += `- 当前价格: ${simulationParams.currentPrice.toFixed(2)}元\n`;
  output += `- 止损设置: ${(simulationParams.stopLossPercent * 100).toFixed(2)}%\n`;

  output += `## 平均预期结果\n`;
  output += `- 平均总收益: ${averageResults.averageTotalReturn.toFixed(2)}元\n`;
  output += `- 平均收益率: ${averageResults.averageReturnRate.toFixed(2)}%\n`;

  output += `- 止损触发次数: ${averageResults.stopLossCount}\n`;

  if (averageResults.averageFinalCost) {
    output += `- 平均最终成本: ${averageResults.averageFinalCost.toFixed(2)}元\n`;

    if (averageResults.averageFinalCost < simulationParams.initialPrice) {
      const costReduction =
        (1 - averageResults.averageFinalCost / simulationParams.initialPrice) *
        100;
      output += `- 策略平均可降低成本${costReduction.toFixed(2)}%，有效减轻了套牢风险。\n`;
    }
  } else {
    output += `- 最终状态: 已全部清仓\n`;
  }
  output += `- 交易: ${JSON.stringify(averageResults.averageTrades, null, 2)}\n`;

  return output;
}

/**
 * 运行滚仓策略的期待收益分析
 * @param params 分析参数
 * @returns 格式化的分析结果
 */
async function runExpectedReturnsAnalysis(
  params: ExpectedReturnParams
): Promise<string> {
  const analysis = await analyzeExpectedReturns(params);
  return formatAnalysisResult(analysis);
}

// 比较不同波动率下的期望收益
async function compareVolatilityScenarios(
  baseParams: ExpectedReturnParams
): Promise<string> {
  let output = `# 不同波动率下的滚仓策略比较\n\n`;

  const volatilities = [0.01, 0.02, 0.03, 0.05, 0.08];
  const results = [];

  for (const vol of volatilities) {
    const params = { ...baseParams, volatility: vol };
    const analysis = await analyzeExpectedReturns(params);
    results.push({
      volatility: vol,
      ...analysis.averageResults,
    });
  }

  output += `## 比较结果\n\n`;
  output += `| 波动率 | 平均收益率 | 平均交易次数 | 成功率 | 平均最终成本 | 止损触发次数 |\n`;
  output += `| ------ | ---------- | ------------ | ------ | ------------ | ------------ |\n`;

  for (const result of results) {
    output += `| ${(result.volatility * 100).toFixed(1)}% | ${result.averageReturnRate.toFixed(2)}% | ${result.averageTrades.toFixed(1)} | ${result.successRate ? result.successRate.toFixed(2) : 'N/A'}% | ${result.averageFinalCost ? result.averageFinalCost.toFixed(2) : 'N/A'} | ${result.stopLossCount} |\n`;
  }

  output += `\n## 结论\n\n`;

  // 找出最佳波动率
  const bestVol = results.reduce(
    (best, current) =>
      current.averageReturnRate > best.averageReturnRate ? current : best,
    results[0]
  );

  output += `- 在测试的波动率范围内，${(bestVol.volatility * 100).toFixed(1)}%的波动率表现最佳，预期收益率为${bestVol.averageReturnRate.toFixed(2)}%。\n`;

  // 检查止损触发情况
  const totalStopLossCount = results.reduce(
    (sum, r) => sum + (r.stopLossCount || 0),
    0
  );
  if (totalStopLossCount > 0) {
    output += `- 在所有波动率场景中共触发了${totalStopLossCount}次止损机制，有效控制了风险。\n`;
  }

  // 比较交易频率
  const highVolTrades = results[results.length - 1].averageTrades;
  const lowVolTrades = results[0].averageTrades;
  output += `- 高波动率(${(volatilities[volatilities.length - 1] * 100).toFixed(1)}%)股票的平均交易次数(${highVolTrades.toFixed(1)})是低波动率(${(volatilities[0] * 100).toFixed(1)}%)股票(${lowVolTrades.toFixed(1)})的${(highVolTrades / lowVolTrades).toFixed(1)}倍。\n`;

  // 比较成功率
  if (results.some(r => r.successRate)) {
    const successRates = results.map(r => r.successRate || 0);
    const maxSuccessRate = Math.max(...successRates);
    const optimalVolIndex = successRates.indexOf(maxSuccessRate);
    output += `- 最高成功率${maxSuccessRate.toFixed(2)}%出现在波动率为${(volatilities[optimalVolIndex] * 100).toFixed(1)}%的情况下。\n`;
  }

  return output;
}

// 使用示例
const sampleParams: ExpectedReturnParams = {
  symbol: 'FFAI',
  initialShares: 1000,
  feePerTrade: 5,
  downPercent: 0.03,
  upPercent: 0.05,
  tradingRatio: 0.3,
  stopLossPercent: 0.1, // 20%止损线
};

// 运行分析示例
const analysisReport = await runExpectedReturnsAnalysis(sampleParams);
console.log(analysisReport);

// const result = compareVolatilityScenarios(sampleParams);
// console.log(result);

// 导出函数
export {
  ExpectedReturnParams,
  getPrices,
  calculateStrategyReturns,
  analyzeExpectedReturns,
  runExpectedReturnsAnalysis,
  compareVolatilityScenarios,
};
