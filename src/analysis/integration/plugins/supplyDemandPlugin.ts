import type { AnalyzerPlugin, AnalysisInputData, DirectionConversionResult, IntegrationContext } from '../IntegrationTypes.js';
import { TradeDirection } from '../../../types.js';

function clamp(value: number, min = 0, max = 100) { return Math.max(min, Math.min(max, value)); }

export function createSupplyDemandPlugin(): AnalyzerPlugin {
  return {
    id: 'supplyDemand',
    category: 'additional',
    extract(input: AnalysisInputData, _context: IntegrationContext): DirectionConversionResult {
      const sd: any = input.analyses.supplyDemand;
      const current = sd.premiumDiscount?.currentPrice ?? NaN;
      const zones = sd.recentEffectiveZones ?? [];
      let direction: TradeDirection = TradeDirection.Neutral;
      let confidence = 50;
      const inZone = zones.find((z: any) => current >= z.low && current <= z.high);
      if (inZone) {
        direction = inZone.type === 'demand' ? TradeDirection.Long : TradeDirection.Short;
        confidence = inZone.status === 'fresh' ? 75 : 65;
        const mid = (inZone.low + inZone.high) / 2;
        const proxPct = Math.abs(current - mid) / Math.max(1e-8, mid) * 100;
        confidence += Math.max(0, 10 - proxPct);
      } else {
        const pos = sd.premiumDiscount?.position ?? 50;
        if (pos < 30) { direction = TradeDirection.Long; confidence = 60 + (30 - pos); }
        else if (pos > 70) { direction = TradeDirection.Short; confidence = 60 + (pos - 70); }
      }
      return { direction, confidence: clamp(confidence), source: 'supplyDemand' };
    },
    summarize(input: AnalysisInputData): string {
      const sd: any = input.analyses.supplyDemand;
      const pos = sd.premiumDiscount?.position ?? 50;
      const zones = sd.recentEffectiveZones?.length ?? 0;
      return `供需位置:${typeof pos?.toFixed === 'function' ? pos.toFixed(1) : pos} 有效区域:${zones}`;
    },
  };
}


