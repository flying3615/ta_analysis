import type { AnalyzerPlugin, AnalysisInputData, DirectionConversionResult, IntegrationContext } from '../IntegrationTypes.js';
import { TradeDirection } from '../../../types.js';

function clamp(value: number, min = 0, max = 100) { return Math.max(min, Math.min(max, value)); }

export function createStructurePlugin(): AnalyzerPlugin {
  return {
    id: 'structure',
    category: 'additional',
    extract(input: AnalysisInputData, _context: IntegrationContext): DirectionConversionResult {
      const s: any = input.analyses.structure;
      let direction: TradeDirection = TradeDirection.Neutral;
      let confidence = 50;
      if (s.trend === 'up') { direction = TradeDirection.Long; confidence = 65; }
      else if (s.trend === 'down') { direction = TradeDirection.Short; confidence = 65; }
      const evt = s.lastEvent as any;
      if (evt) {
        if (evt.type === 'CHOCH') { confidence += 25; if (evt.direction === 'bullish') direction = TradeDirection.Long; else if (evt.direction === 'bearish') direction = TradeDirection.Short; }
        else if (evt.type === 'BOS') { confidence += 15; if (evt.direction === 'bullish') direction = TradeDirection.Long; else if (evt.direction === 'bearish') direction = TradeDirection.Short; }
        else confidence -= 10;
        if (evt.timeframe === 'daily') confidence += 5;
      }
      return { direction, confidence: clamp(confidence), source: 'structure' };
    },
    summarize(input: AnalysisInputData): string {
      const s: any = input.analyses.structure;
      return `结构趋势:${s.trend} 关键位数:${s.keyLevels?.length ?? 0}`;
    },
  };
}


