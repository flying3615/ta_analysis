import { multiTimeSupplyDemand } from '../dist/index.js';
import { formatAndPrintSupplyDemand } from '../dist/index.js';

const symbol = process.argv[2] || 'COIN';

async function main() {
  console.log(`\n======== ${symbol} - 供需区/订单块 分析 ========`);
  const res = await multiTimeSupplyDemand(symbol);
  res.results.forEach(r => formatAndPrintSupplyDemand(r));
  if (res.overlaps.length) {
    console.log('\n----- 跨周期重叠区 -----');
    res.overlaps.forEach(z =>
      console.log(`${z.type === 'demand' ? '需求区' : '供应区'} ${z.low.toFixed(2)} - ${z.high.toFixed(2)} | 状态: ${z.status}`)
    );
  }
}

main().catch(err => {
  console.error('run-mtf-supply-demand failed:', err);
  process.exit(1);
});


