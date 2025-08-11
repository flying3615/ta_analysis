import type { Candle } from '../../../types.js';
import { checkBullBearNearSupportResistance } from './BullBearOnSupportResistAnalysis.js';
import type { MultiTimeFrameBBSRAnalysisResult } from './srTypes.js';

const analyzeMultiTimeBBSR = (
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

export { analyzeMultiTimeBBSR };
