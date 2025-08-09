import { executeIntegratedAnalysis } from '../dist/index.js';

const symbol = process.argv[2] || 'COIN';

async function main() {
  console.log(`\n======== ${symbol} - 综合整合分析 ========`);
  await executeIntegratedAnalysis(symbol);
}

main().catch(err => {
  console.error('run-mtf-integrated failed:', err);
  process.exit(1);
});


