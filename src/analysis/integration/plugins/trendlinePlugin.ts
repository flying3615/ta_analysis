import type { AnalyzerPlugin, AnalysisInputData, DirectionConversionResult, IntegrationContext } from '../IntegrationTypes.js';
import { TradeDirection } from '../../../types.js';

function clamp(value: number, min = 0, max = 100) { return Math.max(min, Math.min(max, value)); }

export function createTrendlinePlugin(): AnalyzerPlugin {
  return {
    id: 'trendline',
    category: 'additional',
    extract(input: AnalysisInputData, _context: IntegrationContext): DirectionConversionResult {
      const tl: any = input.analyses.trendline;
      let direction: TradeDirection = TradeDirection.Neutral;
      let confidence = 50;
      if (tl.channel) {
        if (tl.channel.slope > 0) direction = TradeDirection.Long; else if (tl.channel.slope < 0) direction = TradeDirection.Short;
        confidence = 55 + Math.min(15, Math.abs(tl.channel.slope) * 1e4 * 0.5);
        const touches = (tl.channel.touchesUpper ?? 0) + (tl.channel.touchesLower ?? 0);
        confidence += Math.min(10, touches * 1.5);
      }
      if (tl.breakoutRetest) {
        direction = tl.breakoutRetest.direction === 'up' ? TradeDirection.Long : TradeDirection.Short;
        confidence = Math.max(confidence, tl.breakoutRetest.qualityScore ?? 65);
        if (tl.breakoutRetest.retested) confidence += 20;
      }
      return { direction, confidence: clamp(confidence), source: 'trendline' };
    },
  };
}


