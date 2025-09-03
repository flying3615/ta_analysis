import { getStockDataForTimeframe, multiTimeTrendlines, formatAndPrintTrendlines } from '../index.js';

const symbol = process.argv[2] || 'TSLA';

async function main() {
  console.log(`\n======== ${symbol} - 趋势线/通道 分析 ========`);
  const today = new Date();
  const startDaily = new Date(today);
  startDaily.setDate(startDaily.getDate() - 200);
  const startHourly = new Date(today);
  startHourly.setDate(startHourly.getDate() - 60);

  const [daily, hourly] = await Promise.all([
    getStockDataForTimeframe(symbol, startDaily, today, 'daily'),
    getStockDataForTimeframe(symbol, startHourly, today, '1hour'),
  ]);

  const res = multiTimeTrendlines(symbol, daily, hourly);
  formatAndPrintTrendlines(res.daily);
  formatAndPrintTrendlines(res.hourly);
  console.log(`\n汇总: ${res.summary}`);
}

main().catch(err => {
  console.error('run-mtf-trendlines failed:', err);
  process.exit(1);
});


