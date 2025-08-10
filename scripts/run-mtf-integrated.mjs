import { executeIntegratedAnalysisV2, formatTradePlanOutput, buildMachineReadableSummary } from '../dist/index.js';

const symbol = process.argv[2] || 'COIN';

async function main() {
  console.log(`\n======== ${symbol} - 综合整合分析 ========`);
  const plan = await executeIntegratedAnalysisV2(symbol);
  // 使用格式化函数输出结果
  const formattedOutput = formatTradePlanOutput(plan);
  console.log(formattedOutput);
  console.log(buildMachineReadableSummary(plan));
}

main().catch(err => {
  console.error('run-mtf-integrated failed:', err);
  process.exit(1);
});


