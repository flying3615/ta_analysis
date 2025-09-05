import {
  analyzeMultiTimeBBSR,
  formatAndPrintSrAnalysis,
  getStockDataForTimeframe,
} from '../index.js';

const symbol = process.argv[2] || 'COIN';

async function main() {
  console.log(`\n======== ${symbol} - 支撑/阻力(BBSR) 分析 ========`);
  const today = new Date();
  const startWeekly = new Date(today);
  startWeekly.setDate(today.getDate() - 365);
  const startDaily = new Date(today);
  startDaily.setDate(today.getDate() - 120);

  const [dailyData, weeklyData] = await Promise.all([
    getStockDataForTimeframe(symbol, startDaily, today, 'daily'),
    getStockDataForTimeframe(symbol, startWeekly, today, 'weekly'),
  ]);

  const res = analyzeMultiTimeBBSR(symbol, dailyData, weeklyData);
  formatAndPrintSrAnalysis(res, symbol);
}

main().catch(err => {
  console.error('run-mtf-bbsr failed:', err);
  process.exit(1);
});
