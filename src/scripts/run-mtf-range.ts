import {
  analyzeRange,
  formatAndPrintRange,
  getStockDataForTimeframe,
} from '../index.js';

const symbol = process.argv[2] || 'TSLA';

async function main() {
  console.log(`\n======== ${symbol} - 区间/突破 分析 ========`);
  const today = new Date();
  const startDaily = new Date(today);
  startDaily.setDate(startDaily.getDate() - 120);
  const startHourly = new Date(today);
  startHourly.setDate(startHourly.getDate() - 45);

  const [daily, hourly] = await Promise.all([
    getStockDataForTimeframe(symbol, startDaily, today, 'daily'),
    getStockDataForTimeframe(symbol, startHourly, today, '1hour'),
  ]);

  const dailyResult = analyzeRange(symbol, daily, 'daily');
  const hourlyResult = analyzeRange(symbol, hourly, '1hour');

  formatAndPrintRange(dailyResult);
  formatAndPrintRange(hourlyResult);
}

main().catch(err => {
  console.error('run-mtf-range failed:', err);
  process.exit(1);
});
