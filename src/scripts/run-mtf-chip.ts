import { getStockDataForTimeframe } from '../util/util.js';
import {
  multiTimeFrameChipDistAnalysis,
  formatAndPrintChipAnalysis,
} from '../analysis/analyzer/chip/multiTimeFrameChipDistributionAnalysis.js';

const symbol = process.argv[2] || 'COIN';
const today = new Date();

const startDateWeekly = new Date(today);
startDateWeekly.setDate(today.getDate() - 365);

const startDateDaily = new Date(today);
startDateDaily.setDate(today.getDate() - 90);

const startDateHourly = new Date(today);
startDateHourly.setDate(today.getDate() - 30);

async function main() {
  const weeklyData = await getStockDataForTimeframe(
    symbol,
    startDateWeekly,
    today,
    'weekly'
  );
  const dailyData = await getStockDataForTimeframe(
    symbol,
    startDateDaily,
    today,
    'daily'
  );
  const hourlyData = await getStockDataForTimeframe(
    symbol,
    startDateHourly,
    today,
    '1hour'
  );

  const result = multiTimeFrameChipDistAnalysis(
    symbol,
    'daily',
    ['weekly', 'daily', '1hour'],
    { weekly: 0.3, daily: 0.5, '1hour': 0.2 },
    weeklyData,
    dailyData,
    hourlyData
  );

  formatAndPrintChipAnalysis(result, symbol);
}

main().catch(err => {
  console.error('run-mtf-chip failed:', err);
  process.exit(1);
});
