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

export function createBbsrPlugin(): AnalyzerPlugin {
  return {
    id: 'bbsr',
    category: 'main',
    extract(
      input: AnalysisInputData,
      _context: IntegrationContext
    ): DirectionConversionResult {
      const daily: any = (input.analyses.bbsr as any).dailyBBSRResult;
      const weekly: any = (input.analyses.bbsr as any).weeklyBBSRResult;
      const cand = [daily, weekly].filter(Boolean) as any[];
      if (cand.length === 0)
        return {
          direction: TradeDirection.Neutral,
          confidence: 0,
          source: 'bbsr',
        };
      const now = Date.now();
      let best = { direction: TradeDirection.Neutral, score: 0 };
      for (const s of cand) {
        const pt = s.signal?.patternType;
        const dir =
          pt === 'bullish'
            ? TradeDirection.Long
            : pt === 'bearish'
              ? TradeDirection.Short
              : TradeDirection.Neutral;
        const proximityPct =
          (Math.abs(s.currentPrice - s.SRLevel) / Math.max(1e-8, s.SRLevel)) *
          100;
        const proximityScore = Math.max(0, 30 - proximityPct);
        const days = Math.max(
          0,
          (now - new Date(s.signalDate).getTime()) / 86400000
        );
        const recencyScore = Math.max(0, 20 - days * 2);
        const score = clamp(
          0.6 * (s.strength ?? 0) + proximityScore + recencyScore
        );
        if (score > best.score) best = { direction: dir, score };
      }
      if (
        daily?.signal?.patternType &&
        weekly?.signal?.patternType &&
        daily.signal.patternType !== weekly.signal.patternType
      ) {
        best.score = Math.max(0, best.score - 10);
      }
      return {
        direction: best.direction,
        confidence: best.score,
        source: 'bbsr',
      };
    },
    summarize(input: AnalysisInputData): string {
      const b = input.analyses.bbsr;
      const daily = b.dailyBBSRResult?.strength;
      const weekly = b.weeklyBBSRResult?.strength;
      return `BBSR(日/周) 强度:${daily ?? '-'} / ${weekly ?? '-'}`;
    },
  };
}
