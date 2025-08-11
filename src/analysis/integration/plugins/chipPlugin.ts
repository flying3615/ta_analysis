import type { AnalyzerPlugin, AnalysisInputData, DirectionConversionResult, IntegrationContext } from '../IntegrationTypes.js';
import { TradeDirection } from '../../../types.js';

function clamp(value: number, min = 0, max = 100) { return Math.max(min, Math.min(max, value)); }

export function createChipPlugin(): AnalyzerPlugin {
  return {
    id: 'chip',
    category: 'main',
    extract(input: AnalysisInputData, _context: IntegrationContext): DirectionConversionResult {
      const chip = input.analyses.chip;
      let direction: TradeDirection = TradeDirection.Neutral;
      const buy = chip.combinedBuySignalStrength;
      const sell = chip.combinedShortSignalStrength;
      const diff = buy - sell;
      let confidence = Math.max(buy, sell);
      if (diff > 15) direction = TradeDirection.Long;
      else if (diff < -15) direction = TradeDirection.Short;
      else confidence = confidence * 0.5;
      return { direction, confidence: clamp(confidence), source: 'chip' };
    },
  };
}


