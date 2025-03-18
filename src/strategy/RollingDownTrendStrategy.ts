import { getStockDataForTimeframe } from '../util/util.js';

interface ShortExpectedReturnParams {
  symbol: string; // 股票代码
  initialShortShares: number; // 初始做空数量
  feePerTrade: number; // 每次交易手续费
  upPercent: number; // 上涨做空触发百分比
  downPercent: number; // 下跌平仓触发百分比
  tradingRatio: number; // 用于交易的股票比例
  stopLossPercent: number; // 止损百分比，当股价上涨超过此百分比时平仓止损
  volatility?: number; // 添加可选的波动率参数
}

/**
 * 模拟特定波动率下的股价路径
 * @returns 每日股价数组
 * @param symbol
 */
async function simulatePricePath(symbol: string): Promise<number[]> {
  const today = new Date();
  console.log('正在获取数据与分析筹码分布...');

  const startDate = new Date();
  startDate.setDate(today.getDate() - 365); // 获取一年的数据

  try {
    const dailyData = await getStockDataForTimeframe(
      symbol,
      startDate,
      today,
      'daily'
    ); // 获取日线数据

    return dailyData.map(c => c.close);
  } catch (error) {
    console.error('获取股票数据失败:', error);
    throw new Error(`获取${symbol}的股票数据失败`);
  }
}

/**
 * 计算在特定价格路径下做空滚仓策略的收益
 * @param pricePath 价格路径数组
 * @param params 策略参数
 * @returns 策略收益结果
 */
function calculateShortStrategyReturns(
  pricePath: number[],
  params: ShortExpectedReturnParams
) {
  const {
    initialShortShares,
    feePerTrade,
    upPercent,
    downPercent,
    tradingRatio,
    stopLossPercent,
  } = params;

  const initialPrice = pricePath[0];

  // 初始化状态
  let currentShortShares = initialShortShares;
  let avgShortPrice = initialPrice; // 做空的平均价格
  let cashBalance = initialShortShares * initialPrice; // 做空得到的现金
  let totalFees = 0;
  const tradingPosition = Math.floor(initialShortShares * tradingRatio);

  // 跟踪做空状态
  let hasShorted = false;
  let lastShortPrice = 0;
  let lastTradeDay = 0;

  // 跟踪止损状态
  let stopLossCount = 0;
  let lastStopLossDay = 0;

  const trades = [];

  // 遍历价格路径
  for (let day = 1; day < pricePath.length; day++) {
    const currentPrice = pricePath[day];

    // 修复: 动态止损，基于平均做空价格而不是初始价格
    if (
      currentShortShares > 0 &&
      currentPrice >= avgShortPrice * (1 + stopLossPercent)
    ) {
      // 执行平仓止损
      const coverValue = currentShortShares * currentPrice;
      const coverFee = feePerTrade;

      cashBalance -= coverValue + coverFee;
      totalFees += coverFee;

      // 记录交易
      const stopLossTrade = {
        day,
        type: 'stopLoss',
        price: currentPrice,
        shares: currentShortShares,
        value: coverValue,
        fee: coverFee,
        newShortShares: 0,
        newAvgShortPrice: 0,
        cycleProfitLoss:
          currentShortShares * avgShortPrice - coverValue - coverFee,
      };
      trades.push(stopLossTrade);

      // 更新状态
      currentShortShares = 0;
      avgShortPrice = 0;
      hasShorted = false;
      lastTradeDay = day;
      lastStopLossDay = day;
      stopLossCount++;

      continue;
    }

    // 如果未做空状态，检查是否满足做空条件
    if (!hasShorted) {
      // 价格上涨达到触发条件
      if (currentPrice >= pricePath[lastTradeDay] * (1 + upPercent)) {
        // 执行做空
        const shortValue = tradingPosition * currentPrice;
        const shortFee = feePerTrade;

        cashBalance += shortValue - shortFee;
        totalFees += shortFee;

        // 更新持仓和成本
        currentShortShares += tradingPosition;

        // 修复: 正确计算平均做空价格
        avgShortPrice =
          (avgShortPrice * (currentShortShares - tradingPosition) +
            currentPrice * tradingPosition) /
          currentShortShares;

        // 记录交易
        const shortTrade = {
          day,
          type: 'short',
          price: currentPrice,
          shares: tradingPosition,
          value: shortValue,
          fee: shortFee,
          newShortShares: currentShortShares,
          newAvgShortPrice: avgShortPrice,
        };
        trades.push(shortTrade);

        // 更新状态
        hasShorted = true;
        lastShortPrice = currentPrice;
        lastTradeDay = day;
      }
    }
    // 如果已做空状态，检查是否满足平仓条件
    else {
      // 价格下跌达到触发条件
      if (currentPrice <= lastShortPrice * (1 - downPercent)) {
        // 执行平仓
        const coverValue = tradingPosition * currentPrice;
        const coverFee = feePerTrade;

        cashBalance -= coverValue + coverFee;
        totalFees += coverFee;

        // 更新持仓和成本（保持平均做空价格不变，因为我们是按比例平仓）
        currentShortShares -= tradingPosition;

        // 修复: 仅当所有持仓都平仓时重置avgShortPrice
        if (currentShortShares <= 0) {
          currentShortShares = 0;
          avgShortPrice = 0;
        }

        // 计算单次循环利润
        const cycleProfitLoss =
          tradingPosition * lastShortPrice - coverValue - feePerTrade * 2;

        // 记录交易
        const coverTrade = {
          day,
          type: 'cover',
          price: currentPrice,
          shares: tradingPosition,
          value: coverValue,
          fee: coverFee,
          newShortShares: currentShortShares,
          newAvgShortPrice: avgShortPrice,
          cycleProfitLoss,
        };
        trades.push(coverTrade);

        // 更新状态
        if (currentShortShares === 0) {
          hasShorted = false;
        }
        lastTradeDay = day;
      }
    }
  }

  // 计算最终结果
  const finalPrice = pricePath[pricePath.length - 1];
  const finalShortLiability =
    currentShortShares > 0 ? currentShortShares * finalPrice : 0;
  const totalReturn = cashBalance - finalShortLiability;
  const returnRate = (totalReturn / (initialShortShares * initialPrice)) * 100;

  return {
    initialInvestment: initialShortShares * initialPrice,
    finalShortShares: currentShortShares,
    finalAvgShortPrice: avgShortPrice,
    finalShortLiability,
    cashBalance,
    totalFees,
    totalTrades: trades.length,
    totalReturn,
    returnRate,
    breakevenDropNeeded:
      currentShortShares > 0 ? (finalPrice / avgShortPrice - 1) * 100 : 0,
    trades,
    stopLossCount,
  };
}

/**
 * 分析做空滚仓策略在多种市场情景下的预期收益
 * @param params 策略和模拟参数
 * @returns 综合分析结果
 */
async function analyzeShortExpectedReturns(params: ShortExpectedReturnParams) {
  try {
    const pricePath = await simulatePricePath(params.symbol);

    // 计算策略收益
    const result = calculateShortStrategyReturns(pricePath, params);

    // 修复: 添加成功率计算
    const successfulTrades = result.trades.filter(
      trade => trade.type === 'cover' && trade.cycleProfitLoss > 0
    ).length;
    const totalCloseTrades = result.trades.filter(
      trade => trade.type === 'cover' || trade.type === 'stopLoss'
    ).length;
    const successRate =
      totalCloseTrades > 0 ? (successfulTrades / totalCloseTrades) * 100 : 0;

    return {
      simulationParams: {
        initialPrice: pricePath[0],
        currentPrice: pricePath[pricePath.length - 1],
        stopLossPercent: params.stopLossPercent,
        volatility: params.volatility, // 添加波动率参数
      },
      averageResults: {
        averageTotalReturn: result.totalReturn,
        averageReturnRate: result.returnRate,
        averageTrades: result.trades.length,
        averageFinalShortPrice: result.finalAvgShortPrice,
        stopLossCount: result.stopLossCount,
        successRate: successRate, // 添加成功率
      },
      allResults: result,
    };
  } catch (error) {
    console.error('分析失败:', error);
    throw new Error('做空滚仓策略分析失败');
  }
}

/**
 * 格式化分析结果输出
 * @param analysis 分析结果
 * @returns 格式化的字符串输出
 */
function formatShortAnalysisResult(analysis: any): string {
  const { simulationParams, averageResults } = analysis;

  let output = `# 做空滚仓策略预期收益分析报告\n\n`;

  output += `## 模拟参数\n`;
  output += `- 初始价格: ${simulationParams.initialPrice.toFixed(2)}元\n`;
  output += `- 当前价格: ${simulationParams.currentPrice.toFixed(2)}元\n`;
  output += `- 止损设置: ${(simulationParams.stopLossPercent * 100).toFixed(2)}%\n`;
  if (simulationParams.volatility) {
    output += `- 波动率: ${(simulationParams.volatility * 100).toFixed(2)}%\n`;
  }

  output += `## 平均预期结果\n`;
  output += `- 平均总收益: ${averageResults.averageTotalReturn.toFixed(2)}元\n`;
  output += `- 平均收益率: ${averageResults.averageReturnRate.toFixed(2)}%\n`;
  output += `- 止损触发次数: ${averageResults.stopLossCount}\n`;
  if (averageResults.successRate !== undefined) {
    output += `- 交易成功率: ${averageResults.successRate.toFixed(2)}%\n`;
  }

  if (averageResults.averageFinalShortPrice) {
    output += `- 平均做空价格: ${averageResults.averageFinalShortPrice.toFixed(2)}元\n`;

    if (averageResults.averageFinalShortPrice > simulationParams.initialPrice) {
      const priceImprovement =
        (averageResults.averageFinalShortPrice / simulationParams.initialPrice -
          1) *
        100;
      output += `- 策略平均可提高做空价格${priceImprovement.toFixed(2)}%，增强了盈利潜力。\n`;
    }
  } else {
    output += `- 最终状态: 已全部平仓\n`;
  }

  // 修复: 仅输出摘要而不是完整交易记录
  output += `- 总交易次数: ${averageResults.averageTrades}\n`;

  return output;
}

/**
 * 运行做空滚仓策略的期待收益分析
 * @param params 分析参数
 * @returns 格式化的分析结果
 */
async function runShortExpectedReturnsAnalysis(
  params: ShortExpectedReturnParams
): Promise<string> {
  try {
    const analysis = await analyzeShortExpectedReturns(params);
    return formatShortAnalysisResult(analysis);
  } catch (error) {
    console.error('运行分析失败:', error);
    return `分析失败: ${error.message}`;
  }
}

// 比较不同波动率下的期望收益
async function compareShortVolatilityScenarios(
  baseParams: ShortExpectedReturnParams
): Promise<string> {
  let output = `# 不同波动率下的做空滚仓策略比较\n\n`;

  const volatilities = [0.01, 0.02, 0.03, 0.05, 0.08];
  const results = [];

  try {
    for (const vol of volatilities) {
      // 修复: 正确传递波动率参数
      const params = { ...baseParams, volatility: vol };
      const analysis = await analyzeShortExpectedReturns(params);
      results.push({
        volatility: vol,
        ...analysis.averageResults,
      });
    }

    output += `## 比较结果\n\n`;
    output += `| 波动率 | 平均收益率 | 平均交易次数 | 成功率 | 平均做空价格 | 止损触发次数 |\n`;
    output += `| ------ | ---------- | ------------ | ------ | ------------ | ------------ |\n`;

    for (const result of results) {
      output += `| ${(result.volatility * 100).toFixed(1)}% | ${result.averageReturnRate.toFixed(2)}% | ${result.averageTrades} | ${result.successRate ? result.successRate.toFixed(2) : 'N/A'}% | ${result.averageFinalShortPrice ? result.averageFinalShortPrice.toFixed(2) : 'N/A'} | ${result.stopLossCount} |\n`;
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
    if (highVolTrades && lowVolTrades) {
      output += `- 高波动率(${(volatilities[volatilities.length - 1] * 100).toFixed(1)}%)股票的平均交易次数(${highVolTrades})是低波动率(${(volatilities[0] * 100).toFixed(1)}%)股票(${lowVolTrades})的${(highVolTrades / lowVolTrades).toFixed(1)}倍。\n`;
    }

    // 比较成功率
    if (results.some(r => r.successRate)) {
      const successRates = results.map(r => r.successRate || 0);
      const maxSuccessRate = Math.max(...successRates);
      const optimalVolIndex = successRates.indexOf(maxSuccessRate);
      output += `- 最高成功率${maxSuccessRate.toFixed(2)}%出现在波动率为${(volatilities[optimalVolIndex] * 100).toFixed(1)}%的情况下。\n`;
    }

    return output;
  } catch (error) {
    console.error('比较不同波动率场景失败:', error);
    return `比较失败: ${error.message}`;
  }
}

// 使用示例
const sampleShortParams: ShortExpectedReturnParams = {
  symbol: 'TSLA',
  initialShortShares: 1000,
  feePerTrade: 5,
  upPercent: 0.05, // 价格上涨10%时做空
  downPercent: 0.1, // 价格下跌15%时平仓
  tradingRatio: 0.3,
  stopLossPercent: 0.2, // 20%止损线，价格上涨超过20%时强制平仓
};

const result = await runShortExpectedReturnsAnalysis(sampleShortParams);
console.log(result);

// 导出函数
export {
  ShortExpectedReturnParams,
  simulatePricePath,
  calculateShortStrategyReturns,
  analyzeShortExpectedReturns,
  runShortExpectedReturnsAnalysis,
  compareShortVolatilityScenarios,
};
