import { PatternDirection } from '../patterns/analyzeMultiTimeframePatterns.js';
import type { Candle } from '../../types.js';
import { candleConfig } from './candleConfig.js';

export type TradePlan = {
  symbol: string;
  hasSignal: boolean;
  direction: PatternDirection | 'bullish' | 'bearish' | 'neutral';
  signalStrength: number;
  currentPrice: number;
  entryPrice: number | null;
  stopLossPrice: number | null;
  takeProfitPrice: number | null;
  signalDate: Date;
  reasoning: string;
  dailySignals: any;
  weeklySignals: any;
};

export function computeRiskReward(params: {
  direction: 'bullish' | 'bearish';
  currentPrice: number;
  stopLossPrice: number;
}) {
  const { direction, currentPrice, stopLossPrice } = params;
  let potentialProfit = 0;
  let potentialLoss = 0;
  let rr = 0;
  let profitPct = 0;
  let lossPct = 0;

  if (direction === 'bullish') {
    potentialLoss = currentPrice - stopLossPrice;
    potentialProfit = potentialLoss * candleConfig.risk.bullishRiskReward;
  } else {
    potentialLoss = stopLossPrice - currentPrice;
    potentialProfit = potentialLoss * candleConfig.risk.bearishRiskReward;
  }

  rr = potentialLoss ? potentialProfit / potentialLoss : 0;
  profitPct = (potentialProfit / currentPrice) * 100;
  lossPct = (potentialLoss / currentPrice) * 100;

  return {
    potentialProfit: round2(potentialProfit),
    potentialLoss: round2(potentialLoss),
    riskRewardRatio: round2(rr),
    profitPercentage: round2(profitPct),
    lossPercentage: round2(lossPct),
  };
}

export function calcEntryStopTake(params: {
  direction: 'bullish' | 'bearish';
  currentPrice: number;
  signalStrength: number; // 0-100
  recentCandles: Candle[];
}) {
  const { direction, currentPrice, signalStrength, recentCandles } = params;

  const minPct = candleConfig.risk.minStopLossPct;
  const maxPct = candleConfig.risk.maxStopLossPct;
  const dynamicPct = minPct + (1 - signalStrength / 100) * (maxPct - minPct);

  const entryPrice = round2(currentPrice);

  if (direction === 'bullish') {
    const lows = recentCandles.map(c => c.low);
    const support = Math.min(...lows);
    let stopLoss = round2(currentPrice * (1 - dynamicPct));
    if (stopLoss < support) stopLoss = round2(support);
    const risk = currentPrice - stopLoss;
    const takeProfit = round2(currentPrice + risk * candleConfig.risk.bullishRiskReward);
    return { entryPrice, stopLossPrice: stopLoss, takeProfitPrice: takeProfit };
  } else {
    const highs = recentCandles.map(c => c.high);
    const resistance = Math.max(...highs);
    let stopLoss = round2(currentPrice * (1 + dynamicPct));
    if (stopLoss > resistance) stopLoss = round2(resistance);
    const risk = stopLoss - currentPrice;
    const takeProfit = round2(currentPrice - risk * candleConfig.risk.bearishRiskReward);
    return { entryPrice, stopLossPrice: stopLoss, takeProfitPrice: takeProfit };
  }
}

export function round2(n: number) {
  return Math.round(n * 100) / 100;
}


