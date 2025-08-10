import type { Candle } from '../../types.js';
import { getStockDataForTimeframe } from '../../util/util.js';
import { checkBullBearNearSupportResistance } from './BullBearOnSupportResistAnalysis.js';
import type { MultiTimeFrameBBSRAnalysisResult } from './srTypes.js';
import { formatAndPrintSrAnalysis } from './formatSrAnalysis.js';

const multiTimeBBSRAnalysis = (
  symbol: string,
  dailyCandles: Candle[],
  weeklyCandles: Candle[]
): MultiTimeFrameBBSRAnalysisResult => {
  const weeklyBBSRResult = checkBullBearNearSupportResistance(
    symbol,
    weeklyCandles
  );
  const dailyBBSRResult = checkBullBearNearSupportResistance(
    symbol,
    dailyCandles
  );

  return { weeklyBBSRResult, dailyBBSRResult };
};

export { multiTimeBBSRAnalysis };

export const main = async (symbol: string) => {
  const today = new Date();
  const startDate = new Date();
  startDate.setDate(today.getDate() - 365);

  const [weeklyData, dailyData] = await Promise.all([
    getStockDataForTimeframe(symbol, startDate, today, 'weekly'),
    getStockDataForTimeframe(symbol, startDate, today, 'daily'),
  ]);

  const result = multiTimeBBSRAnalysis(symbol, dailyData, weeklyData);
  formatAndPrintSrAnalysis(result, symbol);
  return result;
};
