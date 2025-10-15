import {
  getStockDataForTimeframe,
  analyzeMultiTimeframePatterns,
  multiTimeFrameChipDistAnalysis,
  formatAndPrintChipAnalysis,
  multiTimeCandleAnalysis,
  formatAndPrintCandleAnalysis,
  analyzeMultiTimeBBSR,
  formatAndPrintSrAnalysis,
  enhancePatternWithTrendReversal,
  formatAndPrintEnhancedPatternAnalysis,
  analyzeVolumeVolatilityCombined,
} from '../index.js';

const symbol = process.argv[2] || 'BMNR';

async function main() {
  const today = new Date();
  const startDateWeekly = new Date(today);
  startDateWeekly.setDate(today.getDate() - 365);
  const startDateDaily = new Date(today);
  startDateDaily.setDate(today.getDate() - 120);
  const startDateHourly = new Date(today);
  startDateHourly.setDate(today.getDate() - 30);

  const [weeklyData, dailyData, hourlyData] = await Promise.all([
    getStockDataForTimeframe(symbol, startDateWeekly, today, 'weekly'),
    getStockDataForTimeframe(symbol, startDateDaily, today, 'daily'),
    getStockDataForTimeframe(symbol, startDateHourly, today, '1hour'),
  ]);

  console.log(`\n======== ${symbol} - 筹码分析 ========`);
  const chipResult = multiTimeFrameChipDistAnalysis(
    symbol,
    'daily',
    ['weekly', 'daily', '1hour'],
    { weekly: 0.3, daily: 0.5, '1hour': 0.2 },
    weeklyData,
    dailyData,
    hourlyData
  );
  formatAndPrintChipAnalysis(chipResult, symbol);

  console.log(`\n======== ${symbol} - 蜡烛形态分析 ========`);
  const candlePlan = await multiTimeCandleAnalysis(
    symbol,
    dailyData,
    weeklyData
  );
  formatAndPrintCandleAnalysis(candlePlan as any, symbol);

  const patternResult = analyzeMultiTimeframePatterns(
    weeklyData,
    dailyData,
    hourlyData
  );

  console.log(`\n======== ${symbol} - 支撑/阻力(BBSR) 分析 ========`);
  const bbsrResult = analyzeMultiTimeBBSR(symbol, dailyData, weeklyData);
  formatAndPrintSrAnalysis(bbsrResult, symbol);

  console.log(`\n======== ${symbol} - 趋势逆转(小时→日线) 分析 ========`);
  const enhanced = enhancePatternWithTrendReversal(
    patternResult,
    weeklyData,
    dailyData,
    hourlyData
  );
  formatAndPrintEnhancedPatternAnalysis(
    enhanced,
    symbol,
    hourlyData,
    dailyData
  );

  console.log(`\n======== ${symbol} - 波动率/量能 分析 ========`);
  const vv = analyzeVolumeVolatilityCombined(hourlyData);
  console.log(vv.volatilityAnalysisReason);
  console.log(vv.volumeAnalysisReason);
  console.log(vv.combinedAnalysisSummary);
}

main().catch(err => {
  console.error('run-mtf-all failed:', err);
  process.exit(1);
});
