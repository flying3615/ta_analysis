// ESM runner for integrated crypto analysis
import {
  executeIntegratedCryptoAnalysisV2,
  buildMachineReadableSummary,
  formatTradePlanOutput,
} from '../index.js';

const symbol = process.env.SYMBOL || 'BTC-USD';

(async () => {
  try {
    console.log(
      `[run-crypto] Running integrated crypto analysis for ${symbol}...`
    );
    const plan = await executeIntegratedCryptoAnalysisV2(symbol);
    const formattedOutput = formatTradePlanOutput(plan);
    console.log(formattedOutput);
    console.log(buildMachineReadableSummary(plan));
  } catch (err) {
    console.error('[run-crypto] Failed:', err);
    process.exit(1);
  }
})();
