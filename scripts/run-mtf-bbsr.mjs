import { runBBSRAnalysis } from '../dist/index.js';

const symbol = process.argv[2] || 'COIN';

async function main() {
  console.log(`\n======== ${symbol} - 支撑/阻力(BBSR) 分析 ========`);
  await runBBSRAnalysis(symbol);
}

main().catch(err => {
  console.error('run-mtf-bbsr failed:', err);
  process.exit(1);
});


