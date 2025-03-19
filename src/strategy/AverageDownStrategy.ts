interface InitState {
  initialShares: number; // 初始持股数量
  initialPrice: number; // 初始买入价格
  currentPrice: number; // 当前市场价格
  feePerTrade: number; // 每次交易的手续费
  downPercent: number; // 下跌买入触发百分比
  upPercent: number; // 上涨卖出触发百分比
  volatility: number; // 股票波动率
  tradingRatio: number; // 用于交易的股票比例
  maxCycles: number; // 最大循环次数
}

/**
 * 模拟股票滚仓策略，计算降低成本所需的循环次数
 * 该策略通过在价格下跌时买入，上涨时卖出，逐步降低持仓成本
 * @param initState 初始参数设置
 * @returns 滚仓策略模拟结果
 */
function simulateStockTrading(initState: InitState) {
  const {
    initialShares,
    initialPrice,
    currentPrice,
    feePerTrade,
    downPercent,
    upPercent,
    tradingRatio,
    maxCycles,
    volatility,
  } = initState;

  // 初始状态计算
  let totalInvestment = initialShares * initialPrice;
  const tradingPosition = Math.floor(initialShares * tradingRatio);
  const fixedPosition = initialShares - tradingPosition;

  // 当前状态
  let currentShares = initialShares;
  let avgCost = totalInvestment / currentShares;
  let totalFees = 0;
  let cashBalance = 0;

  // 结果数据存储
  let cycles = 0;
  let price = currentPrice;
  const tradeHistory = [];

  // 输出初始情况
  const initialState = {
    initialShares,
    initialPrice,
    currentPrice,
    totalInvestment,
    currentMarketValue: currentShares * currentPrice,
    avgCost,
    tradingPosition,
    fixedPosition,
    feePerTrade,
  };

  // 模拟滚仓过程
  while (avgCost > currentPrice && cycles < maxCycles) {
    cycles++;

    // 下跌买入
    const buyPrice = price * (1 - downPercent);
    const buyValue = tradingPosition * buyPrice;
    const buyFee = feePerTrade;

    cashBalance -= buyValue + buyFee;
    totalFees += buyFee;

    // 计算新的持股和成本
    currentShares += tradingPosition;
    totalInvestment += buyValue + buyFee;
    avgCost = totalInvestment / currentShares;

    // 记录买入交易
    const buyTrade = {
      type: 'buy',
      cycle: cycles,
      price: buyPrice,
      shares: tradingPosition,
      value: buyValue,
      fee: buyFee,
      newShares: currentShares,
      newAvgCost: avgCost,
    };

    // 上涨卖出
    const sellPrice = buyPrice * (1 + upPercent);
    const sellValue = tradingPosition * sellPrice;
    const sellFee = feePerTrade;

    cashBalance += sellValue - sellFee;
    totalFees += sellFee;

    // 计算新的持股和成本
    currentShares -= tradingPosition;
    // 此处修正：卖出的股票按平均成本计算对总投资的影响
    totalInvestment -= tradingPosition * avgCost;
    avgCost = totalInvestment / currentShares;

    // 计算单次循环利润
    const cycleProfitLoss = sellValue - buyValue - buyFee - sellFee;

    // 记录卖出交易
    const sellTrade = {
      type: 'sell',
      cycle: cycles,
      price: sellPrice,
      shares: tradingPosition,
      value: sellValue,
      fee: sellFee,
      newShares: currentShares,
      newAvgCost: avgCost,
      cycleProfitLoss,
    };

    // 保存交易记录
    tradeHistory.push(buyTrade, sellTrade);

    const lastPrice = price;
    // 更新价格基准，假设长期趋势稳定在初始的当前价格附近
    price = lastPrice * (1 + (Math.random() * 2 - 1) * volatility);
  }

  // 计算回本所需涨幅
  const breakEvenGrowth = (avgCost / currentPrice - 1) * 100;

  // 返回分析结果
  return {
    initialState,
    finalState: {
      cycles,
      finalShares: currentShares,
      finalAvgCost: avgCost,
      costReductionPercent: (1 - avgCost / initialPrice) * 100,
      totalFees,
      cashBalance,
      breakEvenPrice: avgCost,
      breakEvenGrowth,
    },
    tradeHistory,
    parameterSettings: {
      downPercent,
      upPercent,
      tradingRatio,
      feePerTrade,
    },
  };
}

/**
 * 运行滚仓模拟并格式化输出结果
 * @param initState 初始参数
 * @param printDetails 是否打印详细交易历史
 * @returns 格式化的输出结果
 */
function runAvgDownSimulation(initState: InitState, printDetails: boolean) {
  // 运行模拟
  const result = simulateStockTrading(initState);
  let output = '';

  // 输出结果摘要
  output += '初始情况:\n';
  output += `持股数量: ${result.initialState.initialShares}股\n`;
  output += `初始买入价: ${result.initialState.initialPrice}元\n`;
  output += `当前股价: ${result.initialState.currentPrice}元\n`;
  output += `总投资: ${result.initialState.totalInvestment}元\n`;
  output += `当前市值: ${result.initialState.currentMarketValue}元\n`;
  output += `初始平均成本: ${result.initialState.avgCost}元\n`;
  output += `滚仓交易股数: ${result.initialState.tradingPosition}股\n`;
  output += `固定持有股数: ${result.initialState.fixedPosition}股\n`;
  output += `每次交易手续费: ${result.initialState.feePerTrade}元\n`;
  output += '-------------------------\n';

  output += `总结:\n`;
  output += `完成循环次数: ${result.finalState.cycles}\n`;
  output += `最终平均成本: ${result.finalState.finalAvgCost.toFixed(2)}元\n`;
  output += `成本降低百分比: ${result.finalState.costReductionPercent.toFixed(2)}%\n`;
  output += `累计手续费: ${result.finalState.totalFees}元\n`;
  output += `累计现金收益: ${result.finalState.cashBalance.toFixed(2)}元\n`;
  output += `要回到初始投资，股价需要从当前的${initState.currentPrice}元上涨到${result.finalState.breakEvenPrice.toFixed(2)}元，涨幅${result.finalState.breakEvenGrowth.toFixed(2)}%\n`;

  // 打印详细交易历史可选
  if (printDetails) {
    // 设置为true以显示详细交易历史
    output += '\n交易历史:\n';
    result.tradeHistory.forEach(trade => {
      if (trade.type === 'buy') {
        output += `第${trade.cycle}次买入: 价格${trade.price.toFixed(2)}元，${trade.shares}股，费用${trade.fee}元，新平均成本${trade.newAvgCost.toFixed(2)}元\n`;
      } else {
        output += `第${trade.cycle}次卖出: 价格${trade.price.toFixed(2)}元，${trade.shares}股，费用${trade.fee}元，利润${trade.cycleProfitLoss.toFixed(2)}元，新平均成本${trade.newAvgCost.toFixed(2)}元\n`;
      }
    });
  }

  return output;
}

/**
 * 比较不同参数设置对滚仓策略效果的影响
 * @param initState 基础参数设置
 * @returns 不同参数比较的结果报告
 */
function compareAvgDownParameters(initState: InitState) {
  let output = '';
  output += '\n参数比较分析:\n';

  // 测试不同的下跌买入/上涨卖出百分比
  const scenarios = [
    { name: '保守策略', down: 0.1, up: 0.1 },
    { name: '标准策略', down: 0.2, up: 0.2 },
    { name: '激进策略', down: 0.3, up: 0.3 },
    { name: '非对称策略1', down: 0.15, up: 0.25 },
    { name: '非对称策略2', down: 0.25, up: 0.15 },
  ];

  scenarios.forEach(scenario => {
    // 创建参数副本并应用场景特定参数
    const scenarioState = {
      ...initState,
      downPercent: scenario.down,
      upPercent: scenario.up,
    };

    const result = simulateStockTrading(scenarioState);

    output += `${scenario.name} (下跌${scenario.down * 100}%买入，上涨${scenario.up * 100}%卖出):\n`;
    output += `  循环次数: ${result.finalState.cycles}\n`;
    output += `  最终成本: ${result.finalState.finalAvgCost.toFixed(2)}元\n`;
    output += `  回本涨幅: ${result.finalState.breakEvenGrowth.toFixed(2)}%\n`;
    output += `  现金收益: ${result.finalState.cashBalance.toFixed(2)}元\n`;
  });
  return output;
}

const initState: InitState = {
  initialShares: 100, // 初始持有100股
  initialPrice: 30, // 初始买入价格30元
  currentPrice: 15, // 当前市场价格15元
  feePerTrade: 3, // 每次交易手续费3元
  downPercent: 0.1, // 价格下跌10%触发买入
  upPercent: 0.1, // 价格上涨10%触发卖出
  tradingRatio: 1 / 3, // 使用1/3的股票进行滚仓交易
  maxCycles: 100, // 最多允许100个循环
  volatility: 0.1, // 价格波动率10%
};

// 运行模拟并获取结果
// const result1 = runAvgDownSimulation(initState, true);
// console.log(result1);

// 取消注释下面一行以运行不同参数的比较
// const result2 = compareAvgDownParameters(initState);
// console.log(result2);

export {
  runAvgDownSimulation,
  compareAvgDownParameters,
  simulateStockTrading,
  InitState,
};
