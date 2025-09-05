import { multiTimeSupplyDemand } from '../analysis/analyzer/supplyDemand/multiTimeSupplyDemand.js';
import { formatAndPrintSupplyDemand } from '../analysis/analyzer/supplyDemand/formatSupplyDemand.js';
import { getStockDataForTimeframe } from '../util/util.js';

const symbol = process.argv[2] || 'COIN';

async function main() {
  console.log(`\n======== ${symbol} - 供需区/订单块 分析 ========`);
  const today = new Date();
  const startW = new Date(today);
  startW.setDate(today.getDate() - 365);
  const startD = new Date(today);
  startD.setDate(today.getDate() - 120);
  const startH = new Date(today);
  startH.setDate(today.getDate() - 60);

  const [weekly, daily, hourly] = await Promise.all([
    getStockDataForTimeframe(symbol, startW, today, 'weekly'),
    getStockDataForTimeframe(symbol, startD, today, 'daily'),
    getStockDataForTimeframe(symbol, startH, today, '1hour'),
  ]);

  const res = await multiTimeSupplyDemand(symbol, weekly, daily, hourly);
  res.results.forEach(r => formatAndPrintSupplyDemand(r));
  if (res.overlaps.length) {
    console.log('\n----- 跨周期重叠区 -----');
    res.overlaps.forEach(z =>
      console.log(
        `${z.type === 'demand' ? '需求区' : '供应区'} ${z.low.toFixed(2)} - ${z.high.toFixed(2)} | 状态: ${z.status}`
      )
    );
  }
}

main().catch(err => {
  console.error('run-mtf-supply-demand failed:', err);
  process.exit(1);
});
