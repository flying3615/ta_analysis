import { analyzeMultiTimeframePatterns } from '../analysis/basic/patterns/analyzeMultiTimeframePatterns.js';
import { enhancePatternWithTrendReversal } from '../analysis/analyzer/trendReversal/multiTimeFrameTrendReversal.js';
import { formatAndPrintEnhancedPatternAnalysis } from '../analysis/analyzer/trendReversal/formatReport.js';
import { getStockDataForTimeframe } from '../util/util.js';

const symbol = process.argv[2] || 'COIN';

async function main() {
  console.log(`\n======== ${symbol} - 趋势逆转(小时→日线) 分析 ========`);

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

  const base = analyzeMultiTimeframePatterns(weeklyData, dailyData, hourlyData);
  const enhanced = enhancePatternWithTrendReversal(
    base,
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
}

main().catch(err => {
  console.error('run-mtf-trendreversal failed:', err);
  process.exit(1);
});
