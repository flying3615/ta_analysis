import {
  getStockDataForTimeframe,
  analyzeVolumeVolatilityCombined,
} from '../index.js';

const symbol = process.argv[2] || 'COIN';

async function main() {
  console.log(`\n======== ${symbol} - 波动率/量能 分析 ========`);

  const today = new Date();
  const startDateHourly = new Date(today);
  startDateHourly.setDate(today.getDate() - 60);

  const hourlyData = await getStockDataForTimeframe(
    symbol,
    startDateHourly,
    today,
    '1hour'
  );

  const result = analyzeVolumeVolatilityCombined(hourlyData);
  console.log(result.volatilityAnalysisReason);
  console.log(result.volumeAnalysisReason);
  console.log(result.combinedAnalysisSummary);
}

main().catch(err => {
  console.error('run-mtf-volatility failed:', err);
  process.exit(1);
});
