import { multiTimeCandleAnalysis } from '../analysis/basic/candle/multiTimeCandleAnalysis.js';
import { getStockDataForTimeframe } from '../util/util.js';
import { formatAndPrintCandleAnalysis } from '../analysis/basic/candle/formatCandleAnalysis.js';

const symbol = process.argv[2] || 'COIN';

async function main() {
  const today = new Date();
  const startD = new Date(today);
  startD.setDate(today.getDate() - 120);
  const startW = new Date(today);
  startW.setDate(today.getDate() - 365);

  const [daily, weekly] = await Promise.all([
    getStockDataForTimeframe(symbol, startD, today, 'daily'),
    getStockDataForTimeframe(symbol, startW, today, 'weekly'),
  ]);

  const plan = await multiTimeCandleAnalysis(symbol, daily, weekly);
  formatAndPrintCandleAnalysis(plan as any, symbol);
}

main().catch(err => {
  console.error('run-mtf-candle failed:', err);
  process.exit(1);
});
