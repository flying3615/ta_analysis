import { Candle } from '../../../types.js';
import { analyzeRange } from '../../analyzer/range/rangeDetector.js';
import type { Strategy, Signal } from '../Backtester.js';

export interface RangeBreakoutParams {
  minQuality?: number; // 0-100
  requireRetest?: boolean;
}

export function RangeBreakoutStrategy(
  symbol: string,
  timeframe: 'weekly' | 'daily' | '1hour',
  params: RangeBreakoutParams = {}
): Strategy {
  const { minQuality = 60, requireRetest = true } = params;

  return {
    name: 'RangeBreakout',
    generateSignal(history: Candle[], i: number): Signal | null {
      if (i < 60) return null;
      const window = history.slice(Math.max(0, i - 200), i + 1);
      const res = analyzeRange(symbol, window, timeframe);
      if (!res.breakout) return null;
      if (requireRetest && !res.breakout.retested) return null;
      if ((res.breakout.qualityScore ?? 0) < minQuality) return null;
      return {
        timestamp: history[i].timestamp,
        direction: res.breakout.direction === 'up' ? 'long' : 'short',
        strength: res.breakout.qualityScore,
        reason: 'Range breakout' + (requireRetest ? ' with retest' : ''),
      };
    },
  };
}
