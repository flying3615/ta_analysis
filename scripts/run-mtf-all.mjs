import {
  getStockDataForTimeframe,
  analyzeMultiTimeframePatterns,
  formatAndPrintPatternAnalysis,
  multiTimeFrameChipDistAnalysis,
  formatAndPrintChipAnalysis,
} from '../dist/index.js';

const symbol = process.argv[2] || 'COIN';

async function runChip(symbol) {
  const today = new Date();

  const startDateWeekly = new Date(today);
  startDateWeekly.setDate(today.getDate() - 365);

  const startDateDaily = new Date(today);
  startDateDaily.setDate(today.getDate() - 90);

  const startDateHourly = new Date(today);
  startDateHourly.setDate(today.getDate() - 30);

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
  const hourlyData = await getStockDataForTimeframe(
    symbol,
    startDateHourly,
    today,
    '1hour'
  );

  const result = multiTimeFrameChipDistAnalysis(
    symbol,
    'daily',
    ['weekly', 'daily', '1hour'],
    { weekly: 0.3, daily: 0.5, '1hour': 0.2 },
    weeklyData,
    dailyData,
    hourlyData
  );

  formatAndPrintChipAnalysis(result, symbol);
}

async function main() {
  console.log(`\n======== ${symbol} - 筹码分析 ========`);
  await runChip(symbol);

  console.log(`\n======== ${symbol} - 形态分析 ========`);
  const today = new Date();
  const startDateWeekly = new Date();
  startDateWeekly.setDate(today.getDate() - 365);
  const startDateDaily = new Date();
  startDateDaily.setDate(today.getDate() - 120);
  const startDateHourly = new Date();
  startDateHourly.setDate(today.getDate() - 30);
  const [weeklyData, dailyData, hourlyData] = await Promise.all([
    getStockDataForTimeframe(symbol, startDateWeekly, today, 'weekly'),
    getStockDataForTimeframe(symbol, startDateDaily, today, 'daily'),
    getStockDataForTimeframe(symbol, startDateHourly, today, '1hour'),
  ]);
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


