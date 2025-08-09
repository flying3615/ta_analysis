import { runMultiTimeStructure } from '../dist/index.js';
import { formatAndPrintStructureResult } from '../dist/index.js';

const symbol = process.argv[2] || 'COIN';

async function main() {
  console.log(`\n======== ${symbol} - 结构分析 ========`);
  const res = await runMultiTimeStructure(symbol);
  formatAndPrintStructureResult(res);
}

main().catch(err => {
  console.error('run-mtf-structure failed:', err);
  process.exit(1);
});


