import type { Candle, SRSignal } from '../../types.js';

export interface MultiTimeFrameBBSRAnalysisResult {
  weeklyBBSRResult?: SRSignal;
  dailyBBSRResult?: SRSignal;
}

export type BBSRAnalyzer = (
  symbol: string,
  dailyCandles: Candle[],
  weeklyCandles: Candle[]
) => MultiTimeFrameBBSRAnalysisResult;


