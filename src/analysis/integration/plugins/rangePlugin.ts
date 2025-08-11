import type { AnalyzerPlugin, AnalysisInputData, DirectionConversionResult, IntegrationContext } from '../IntegrationTypes.js';
import { TradeDirection } from '../../../types.js';

function clamp(value: number, min = 0, max = 100) { return Math.max(min, Math.min(max, value)); }

export function createRangePlugin(): AnalyzerPlugin {
  return {
    id: 'range',
    category: 'additional',
    extract(input: AnalysisInputData, _context: IntegrationContext): DirectionConversionResult {
      const r: any = input.analyses.range;
      let direction: TradeDirection = TradeDirection.Neutral;
      let confidence = 50;
      if (r.breakout) {
        direction = r.breakout.direction === 'up' ? TradeDirection.Long : TradeDirection.Short;
        confidence = r.breakout.qualityScore ?? 60;
        if (r.breakout.volumeExpansion) confidence += 10;
        if (r.breakout.followThrough) confidence += 10;
        if (r.breakout.retested) confidence += 10;
      } else if (r.compressionScore > 70) {
        confidence = 35;
      }
      return { direction, confidence: clamp(confidence), source: 'range' };
    },
    summarize(input: AnalysisInputData): string {
      const r: any = input.analyses.range;
      const comp = r.compressionScore;
      const br = r.breakout ? `${r.breakout.direction}/${r.breakout.qualityScore}` : '无突破';
      return `压缩:${comp} 突破:${br}`;
    },
  };
}


