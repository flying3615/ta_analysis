import { getStockDataForTimeframe } from '../dist/util/util.js';
import { main as runMTFCandle } from '../dist/analysis/candle/multiTImeFrameCandleAnalysis.js';

const symbol = process.argv[2] || 'COIN';

async function main() {
  // multiTImeFrameCandleAnalysis main() 自行拉取数据
  await runMTFCandle(symbol);
}

main().catch(err => {
  console.error('run-mtf-candle failed:', err);
  process.exit(1);
});


