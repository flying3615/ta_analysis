// ESM runner for integrated crypto analysis
import { executeIntegratedCryptoAnalysisV2 } from '../dist/index.js';

const symbol = process.env.SYMBOL || 'BTC-USD';
const apiKey = process.env.TM_API_KEY;

if (!apiKey) {
  console.error('[run-crypto] Missing TM_API_KEY in environment.');
  console.error('Usage: TM_API_KEY=xxxx SYMBOL=BTC-USD node scripts/run-crypto.mjs');
  process.exit(1);
}

(async () => {
  try {
    console.log(`[run-crypto] Running integrated crypto analysis for ${symbol}...`);
    const tradePlan = await executeIntegratedCryptoAnalysisV2(symbol, apiKey);
    console.log('[run-crypto] Trade Plan Summary:');
    console.log({
      symbol: tradePlan.symbol,
      direction: tradePlan.direction,
      signalStrength: tradePlan.signalStrength,
      confidenceScore: tradePlan.confidenceScore,
      primaryTimeframe: tradePlan.primaryTimeframe,
      timeframeConsistency: tradePlan.timeframeConsistency,
    });
  } catch (err) {
    console.error('[run-crypto] Failed:', err);
    process.exit(1);
  }
})();
