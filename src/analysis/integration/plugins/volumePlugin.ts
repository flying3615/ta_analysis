import type {
  AnalyzerPlugin,
  AnalysisInputData,
  DirectionConversionResult,
  IntegrationContext,
} from '../IntegrationTypes.js';
import { TradeDirection } from '../../../types.js';

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

export function createVolumePlugin(): AnalyzerPlugin {
  return {
    id: 'volume',
    category: 'main',
    extract(
      input: AnalysisInputData,
      _context: IntegrationContext
    ): DirectionConversionResult {
      const v = (input.analyses.volatility as any).volumeAnalysis
        .volumeAnalysis;
      let direction: TradeDirection = TradeDirection.Neutral;
      if (v.adTrend === 'bullish') direction = TradeDirection.Long;
      else if (v.adTrend === 'bearish') direction = TradeDirection.Short;
      if (
        v.divergence?.type === 'bullish' ||
        v.divergence?.type === 'hidden_bullish'
      )
        direction = TradeDirection.Long;
      if (
        v.divergence?.type === 'bearish' ||
        v.divergence?.type === 'hidden_bearish'
      )
        direction = TradeDirection.Short;

      let confidence = 50;
      confidence += v.volumePriceConfirmation ? 15 : -10;
      confidence += Math.min(
        25,
        Math.max(0, Math.abs(v.volumeForce ?? 0) * 0.5)
      );
      confidence += Math.min(15, Math.abs(v.obvSlope ?? 0) * 50);
      confidence += Math.min(
        10,
        Math.max(0, v.divergence?.strength ?? 0) * 0.2
      );
      if (typeof v.moneyFlowIndex === 'number') {
        if (v.moneyFlowIndex > 80) confidence -= 5;
        else if (v.moneyFlowIndex < 20) confidence += 5;
      }
      return { direction, confidence: clamp(confidence), source: 'volume' };
    },
    summarize(input: AnalysisInputData): string {
      const vv: any = input.analyses.volatility;
      const regime =
        vv.volatilityAnalysis?.volatilityAnalysis?.volatilityRegime ?? 'low';
      const atrp = vv.volatilityAnalysis?.volatilityAnalysis?.atrPercent ?? 0;
      const volConfirm = vv.volumeAnalysis?.volumeAnalysis
        ?.volumePriceConfirmation
        ? '确认'
        : '未确认';
      return `波动率:${regime} ATR%:${typeof atrp?.toFixed === 'function' ? atrp.toFixed(2) : atrp} 成交量确认:${volConfirm}`;
    },
  };
}
