import {
  getStockDataForTimeframe,
  analyzeMultiTimeframePatterns,
  formatAndPrintPatternAnalysis,
  multiTimeFrameChipDistAnalysis,
  formatAndPrintChipAnalysis,
  multiTimeCandleAnalysis,
  formatAndPrintCandleAnalysis,
} from '../dist/index.js';

const symbol = process.argv[2] || 'COIN';

// 统一在 main 中调用三种分析，保持风格一致

async function main() {
  // 统一一次性获取数据，并在三个分析中复用
  const today = new Date();
  const startDateWeekly = new Date(today);
  startDateWeekly.setDate(today.getDate() - 365);
  const startDateDaily = new Date(today);
  startDateDaily.setDate(today.getDate() - 120);
  const startDateHourly = new Date(today);
  startDateHourly.setDate(today.getDate() - 30);

  const [weeklyData, dailyData, hourlyData] = await Promise.all([
    getStockDataForTimeframe(symbol, startDateWeekly, today, 'weekly'),
    getStockDataForTimeframe(symbol, startDateDaily, today, 'daily'),
    getStockDataForTimeframe(symbol, startDateHourly, today, '1hour'),
  ]);

  console.log(`\n======== ${symbol} - 筹码分析 ========`);
  const chipResult = multiTimeFrameChipDistAnalysis(
    symbol,
    'daily',
    ['weekly', 'daily', '1hour'],
    { weekly: 0.3, daily: 0.5, '1hour': 0.2 },
    weeklyData,
    dailyData,
    hourlyData
  );
  formatAndPrintChipAnalysis(chipResult, symbol);

  console.log(`\n======== ${symbol} - 蜡烛形态分析 ========`);
  const candlePlan = await multiTimeCandleAnalysis(symbol, dailyData, weeklyData);
  formatAndPrintCandleAnalysis(candlePlan, symbol);

  console.log(`\n======== ${symbol} - 形态分析 ========`);
  const patternResult = analyzeMultiTimeframePatterns(
    weeklyData,
    dailyData,
    hourlyData,
  );
  formatAndPrintPatternAnalysis(patternResult, symbol);
}

main().catch(err => {
  console.error('run-mtf-all failed:', err);
  process.exit(1);
});


