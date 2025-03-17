interface ExpectedReturnParams {
  initialShares: number; // 初始持股数量
  initialPrice: number; // 初始买入价格
  currentPrice: number; // 当前市场价格
  feePerTrade: number; // 每次交易手续费
  downPercent: number; // 下跌买入触发百分比
  upPercent: number; // 上涨卖出触发百分比
  tradingRatio: number; // 用于交易的股票比例
  volatility: number; // 股票波动率
  expectedGrowthRate: number; // 股票预期年化增长率
  simulationYears: number; // 模拟年数
  simulationCount: number; // 模拟次数
}

/**
 * 模拟特定波动率下的股价路径
 * @param startPrice 起始价格
 * @param days 模拟天数
 * @param volatility 日波动率
 * @param annualGrowth 年化增长率
 * @returns 每日股价数组
 */
function simulatePricePath(
  startPrice: number,
  days: number,
  volatility: number,
  annualGrowth: number
): number[] {
  const dailyGrowth = Math.pow(1 + annualGrowth, 1 / 252) - 1; // 转换为日增长率，假设一年252个交易日
  const prices: number[] = [startPrice];

  for (let i = 1; i < days; i++) {
    // 生成正态分布的随机因子（简化实现，用均匀分布代替）
    const randomFactor = (Math.random() * 2 - 1) * volatility;
    // 每日价格 = 前一日价格 * (1 + 日增长率 + 随机波动)
    const newPrice = prices[i - 1] * (1 + dailyGrowth + randomFactor);
    prices.push(newPrice);
  }

  return prices;
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
    initialPrice,
    feePerTrade,
    downPercent,
    upPercent,
    tradingRatio,
  } = params;

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

  const trades = [];

  // 遍历价格路径
  for (let day = 1; day < pricePath.length; day++) {
    const currentPrice = pricePath[day];

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
        const sellFee = feePerTrade;

        cashBalance += sellValue - sellFee;
        totalFees += sellFee;

        // 更新持股和成本
        currentShares -= tradingPosition;
        totalInvestment -= tradingPosition * avgCost;
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
          fee: sellFee,
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
    breakevenGrowthNeeded: (avgCost / finalPrice - 1) * 100,
    trades,
  };
}

/**
 * 分析滚仓策略在多种市场情景下的预期收益
 * @param params 策略和模拟参数
 * @returns 综合分析结果
 */
function analyzeExpectedReturns(params: ExpectedReturnParams) {
  const {
    initialPrice,
    currentPrice,
    volatility,
    expectedGrowthRate,
    simulationYears,
    simulationCount,
  } = params;

  const daysPerSimulation = Math.floor(simulationYears * 252); // 假设一年252个交易日
  const results = [];

  // 运行多次模拟
  for (let i = 0; i < simulationCount; i++) {
    // 模拟价格路径
    const pricePath = simulatePricePath(
      currentPrice,
      daysPerSimulation,
      volatility,
      expectedGrowthRate
    );

    // 计算策略收益
    const result = calculateStrategyReturns(pricePath, params);
    results.push(result);
  }

  // 计算平均结果
  const avgTotalReturn =
    results.reduce((sum, result) => sum + result.totalReturn, 0) /
    results.length;
  const avgReturnRate =
    results.reduce((sum, result) => sum + result.returnRate, 0) /
    results.length;
  const avgTrades =
    results.reduce((sum, result) => sum + result.totalTrades, 0) /
    results.length;
  const avgFinalCost =
    results.reduce((sum, result) => sum + result.finalAvgCost, 0) /
    results.length;

  // 计算成功率 (正收益比例)
  const successRate =
    (results.filter(result => result.totalReturn > 0).length / results.length) *
    100;

  // 找出最好和最差的情况
  const bestCase = results.reduce(
    (best, current) => (current.returnRate > best.returnRate ? current : best),
    results[0]
  );
  const worstCase = results.reduce(
    (worst, current) =>
      current.returnRate < worst.returnRate ? current : worst,
    results[0]
  );

  return {
    simulationParams: {
      initialPrice,
      currentPrice,
      volatility,
      expectedGrowthRate,
      simulationYears,
      simulationCount,
    },
    averageResults: {
      averageTotalReturn: avgTotalReturn,
      averageReturnRate: avgReturnRate,
      averageTrades: avgTrades,
      averageFinalCost: avgFinalCost,
      successRate,
    },
    extremeCases: {
      bestCase,
      worstCase,
    },
    allResults: results,
  };
}

/**
 * 格式化分析结果输出
 * @param analysis 分析结果
 * @returns 格式化的字符串输出
 */
function formatAnalysisResult(analysis: any): string {
  const { simulationParams, averageResults, extremeCases } = analysis;

  let output = `# 滚仓策略预期收益分析报告\n\n`;

  output += `## 模拟参数\n`;
  output += `- 初始价格: ${simulationParams.initialPrice.toFixed(2)}元\n`;
  output += `- 当前价格: ${simulationParams.currentPrice.toFixed(2)}元\n`;
  output += `- 股票波动率: ${(simulationParams.volatility * 100).toFixed(2)}%\n`;
  output += `- 预期年化增长率: ${(simulationParams.expectedGrowthRate * 100).toFixed(2)}%\n`;
  output += `- 模拟年数: ${simulationParams.simulationYears}年\n`;
  output += `- 模拟次数: ${simulationParams.simulationCount}次\n\n`;

  output += `## 平均预期结果\n`;
  output += `- 平均总收益: ${averageResults.averageTotalReturn.toFixed(2)}元\n`;
  output += `- 平均收益率: ${averageResults.averageReturnRate.toFixed(2)}%\n`;
  output += `- 平均交易次数: ${averageResults.averageTrades.toFixed(1)}次\n`;
  output += `- 平均最终成本: ${averageResults.averageFinalCost.toFixed(2)}元\n`;
  output += `- 获得正收益概率: ${averageResults.successRate.toFixed(2)}%\n\n`;

  output += `## 最佳情况\n`;
  output += `- 总收益: ${extremeCases.bestCase.totalReturn.toFixed(2)}元\n`;
  output += `- 收益率: ${extremeCases.bestCase.returnRate.toFixed(2)}%\n`;
  output += `- 交易次数: ${extremeCases.bestCase.totalTrades}次\n\n`;

  output += `## 最差情况\n`;
  output += `- 总收益: ${extremeCases.worstCase.totalReturn.toFixed(2)}元\n`;
  output += `- 收益率: ${extremeCases.worstCase.returnRate.toFixed(2)}%\n`;
  output += `- 交易次数: ${extremeCases.worstCase.totalTrades}次\n\n`;

  output += `## 结论与建议\n`;

  // 根据结果提供建议
  if (averageResults.successRate > 70) {
    output += `- 该股票的滚仓策略成功率较高 (${averageResults.successRate.toFixed(2)}%)，是一个相对安全的策略选择。\n`;
  } else if (averageResults.successRate > 50) {
    output += `- 该股票的滚仓策略有一定成功率 (${averageResults.successRate.toFixed(2)}%)，可以尝试但需要控制风险。\n`;
  } else {
    output += `- 该股票的滚仓策略成功率较低 (${averageResults.successRate.toFixed(2)}%)，不建议大规模采用，可考虑调整参数或选择其他策略。\n`;
  }

  if (averageResults.averageFinalCost < simulationParams.initialPrice) {
    const costReduction =
      (1 - averageResults.averageFinalCost / simulationParams.initialPrice) *
      100;
    output += `- 策略平均可降低成本${costReduction.toFixed(2)}%，有效减轻了套牢风险。\n`;
  }

  if (averageResults.averageTrades > 10) {
    output += `- 预计交易频繁 (平均${averageResults.averageTrades.toFixed(1)}次)，请考虑交易成本和时间投入。\n`;
  } else {
    output += `- 预计交易次数适中 (平均${averageResults.averageTrades.toFixed(1)}次)，操作难度适中。\n`;
  }

  return output;
}

/**
 * 运行滚仓策略的期待收益分析
 * @param params 分析参数
 * @returns 格式化的分析结果
 */
function runExpectedReturnsAnalysis(params: ExpectedReturnParams): string {
  const analysis = analyzeExpectedReturns(params);
  return formatAnalysisResult(analysis);
}

// 比较不同波动率下的期望收益
function compareVolatilityScenarios(baseParams: ExpectedReturnParams): string {
  let output = `# 不同波动率下的滚仓策略比较\n\n`;

  const volatilities = [0.01, 0.02, 0.03, 0.05, 0.08];
  const results = [];

  for (const vol of volatilities) {
    const params = { ...baseParams, volatility: vol };
    const analysis = analyzeExpectedReturns(params);
    results.push({
      volatility: vol,
      ...analysis.averageResults,
    });
  }

  output += `## 比较结果\n\n`;
  output += `| 波动率 | 平均收益率 | 平均交易次数 | 成功率 | 平均最终成本 |\n`;
  output += `| ------ | ---------- | ------------ | ------ | ------------ |\n`;

  for (const result of results) {
    output += `| ${(result.volatility * 100).toFixed(1)}% | ${result.averageReturnRate.toFixed(2)}% | ${result.averageTrades.toFixed(1)} | ${result.successRate.toFixed(2)}% | ${result.averageFinalCost.toFixed(2)} |\n`;
  }

  output += `\n## 结论\n\n`;

  // 找出最佳波动率
  const bestVol = results.reduce(
    (best, current) =>
      current.averageReturnRate > best.averageReturnRate ? current : best,
    results[0]
  );

  output += `- 在测试的波动率范围内，${(bestVol.volatility * 100).toFixed(1)}%的波动率表现最佳，预期收益率为${bestVol.averageReturnRate.toFixed(2)}%。\n`;

  // 比较交易频率
  const highVolTrades = results[results.length - 1].averageTrades;
  const lowVolTrades = results[0].averageTrades;
  output += `- 高波动率(${(volatilities[volatilities.length - 1] * 100).toFixed(1)}%)股票的平均交易次数(${highVolTrades.toFixed(1)})是低波动率(${(volatilities[0] * 100).toFixed(1)}%)股票(${lowVolTrades.toFixed(1)})的${(highVolTrades / lowVolTrades).toFixed(1)}倍。\n`;

  // 比较成功率
  const successRates = results.map(r => r.successRate);
  const maxSuccessRate = Math.max(...successRates);
  const optimalVolIndex = successRates.indexOf(maxSuccessRate);
  output += `- 最高成功率${maxSuccessRate.toFixed(2)}%出现在波动率为${(volatilities[optimalVolIndex] * 100).toFixed(1)}%的情况下。\n`;

  return output;
}

// 使用示例
const sampleParams: ExpectedReturnParams = {
  initialShares: 1000,
  initialPrice: 50,
  currentPrice: 50, // 这里设置为同价格，模拟新买入的股票
  feePerTrade: 5,
  downPercent: 0.08,
  upPercent: 0.1,
  tradingRatio: 0.3,
  volatility: 0.05, // 5%的日波动率
  expectedGrowthRate: 0.1, // 10%的年化预期增长率
  simulationYears: 3,
  simulationCount: 100,
};

// 运行分析示例
// const analysisReport = runExpectedReturnsAnalysis(sampleParams);
// console.log(analysisReport);

// const result = compareVolatilityScenarios(sampleParams);
// console.log(result);

// 导出函数
export {
  ExpectedReturnParams,
  simulatePricePath,
  calculateStrategyReturns,
  analyzeExpectedReturns,
  runExpectedReturnsAnalysis,
  compareVolatilityScenarios,
};
