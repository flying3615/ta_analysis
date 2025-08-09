/*
  Pretty printer for candle multi-timeframe analysis results produced by
  multiTImeFrameCandleAnalysis.ts → multiTimeCandleAnalysis/main.
*/

type PatternDetail = {
  date: string;
  patterns: string[];
  strength: number;
  price: number;
};

type CandleAnalysisPrint = {
  symbol: string;
  currentPrice: number;
  hasSignal: boolean;
  direction: string;
  signalStrength: number;
  entryPrice: number | null;
  stopLossPrice: number | null;
  targetPrice: number | null;
  reasoning: string;
  riskReward: {
    potentialProfit: number;
    potentialLoss: number;
    profitPercentage: number;
    lossPercentage: number;
    riskRewardRatio: number;
  };
  patterns: {
    daily: { bullish: PatternDetail[]; bearish: PatternDetail[] };
    weekly: { bullish: PatternDetail[]; bearish: PatternDetail[] };
  };
};

function padRight(str: string, len: number) {
  if (str.length >= len) return str;
  return str + ' '.repeat(len - str.length);
}

export function formatAndPrintCandleAnalysis(
  analysis: CandleAnalysisPrint,
  symbol: string = ''
) {
  console.log(`\n${symbol ? '===== ' + symbol + ' ' : '====='}蜡烛多时间周期分析 =====`);
  console.log(`股票代码: ${analysis.symbol}`);
  console.log(`当前价格: ${analysis.currentPrice.toFixed(2)}`);

  console.log('\n----- 信号 -----');
  console.log(`是否有信号: ${analysis.hasSignal ? '是' : '否'}`);
  console.log(`方向: ${analysis.direction}`);
  console.log(`信号强度: ${analysis.signalStrength.toFixed(2)}`);

  console.log('\n----- 计划 -----');
  console.log(`入场价: ${analysis.entryPrice ?? '无'}`);
  console.log(`止损价: ${analysis.stopLossPrice ?? '无'}`);
  console.log(`目标价: ${analysis.targetPrice ?? '无'}`);

  console.log('\n----- 风险/收益 -----');
  console.log(`潜在收益: ${analysis.riskReward.potentialProfit}`);
  console.log(`潜在亏损: ${analysis.riskReward.potentialLoss}`);
  console.log(`收益百分比: ${analysis.riskReward.profitPercentage}%`);
  console.log(`亏损百分比: ${analysis.riskReward.lossPercentage}%`);
  console.log(`风险回报比: ${analysis.riskReward.riskRewardRatio}`);

  console.log('\n----- 理由 -----');
  console.log(analysis.reasoning || '无');

  const printPatternBlock = (title: string, list: PatternDetail[]) => {
    console.log(`\n${title}`);
    if (!list || list.length === 0) {
      console.log('  (none)');
      return;
    }
    console.log('  ' + padRight('日期', 24) + padRight('形态', 24) + padRight('强度', 10) + '价格');
    for (const p of list.slice(-10)) {
      const date = padRight(p.date, 24);
      const names = padRight(p.patterns.join(','), 24);
      const strength = padRight(String(p.strength), 10);
      const price = p.price.toFixed(2);
      console.log(`  ${date}${names}${strength}${price}`);
    }
  };

  console.log('\n===== 日线形态 =====');
  printPatternBlock('日线看涨', analysis.patterns.daily.bullish);
  printPatternBlock('日线看跌', analysis.patterns.daily.bearish);

  console.log('\n===== 周线形态 =====');
  printPatternBlock('周线看涨', analysis.patterns.weekly.bullish);
  printPatternBlock('周线看跌', analysis.patterns.weekly.bearish);
}


