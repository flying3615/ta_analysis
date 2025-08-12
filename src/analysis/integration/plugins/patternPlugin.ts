import type {
  AnalyzerPlugin,
  AnalysisInputData,
  DirectionConversionResult,
  IntegrationContext,
} from '../IntegrationTypes.js';
import { TradeDirection } from '../../../types.js';
import { PatternDirection } from '../../basic/patterns/analyzeMultiTimeframePatterns.js';

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

export function createPatternPlugin(): AnalyzerPlugin {
  return {
    id: 'pattern',
    category: 'main',
    extract(
      input: AnalysisInputData,
      _context: IntegrationContext
    ): DirectionConversionResult {
      const p = input.analyses.pattern as any;
      const dir = p.combinedSignal as PatternDirection;
      const direction =
        dir === PatternDirection.Bullish
          ? TradeDirection.Long
          : dir === PatternDirection.Bearish
            ? TradeDirection.Short
            : TradeDirection.Neutral;
      const tfWeights: Record<'weekly' | 'daily' | '1hour', number> = {
        weekly: 0.4,
        daily: 0.4,
        '1hour': 0.2,
      };
      let statusAdj = 0;
      for (const tf of p.timeframeAnalyses ?? []) {
        const w = tfWeights[tf.timeframe] ?? 0.2;
        const st = tf.dominantPattern?.status;
        if (st === 'confirmed') statusAdj += 20 * w;
        else if (st === 'completed') statusAdj += 10 * w;
        else if (st === 'forming') statusAdj += -10 * w;
        else if (st === 'failed') statusAdj += -20 * w;
      }
      const confidence = Math.abs(p.signalStrength ?? 0) + statusAdj;
      return { direction, confidence: clamp(confidence), source: 'pattern' };
    },
    summarize(input: AnalysisInputData): string {
      const pattern: any = input.analyses.pattern;
      return `形态综合方向:${pattern.combinedSignal} 强度:${pattern.signalStrength?.toFixed?.(1) ?? pattern.signalStrength}`;
    },
  };
}
