import { Candle } from '../../../types.js';
import { analyzeTrendlinesAndChannels } from '../../analyzer/trendline/trendlineDetector.js';
import type { Strategy, Signal } from '../Backtester.js';

export function TrendlineBreakoutStrategy(
  symbol: string,
  timeframe: 'weekly' | 'daily' | '1hour'
): Strategy {
  return {
    name: 'TrendlineBreakout',
    generateSignal(history: Candle[], i: number): Signal | null {
      if (i < 80) return null;
      const window = history.slice(Math.max(0, i - 200), i + 1);
      const res = analyzeTrendlinesAndChannels(symbol, window, timeframe);
      if (res.breakoutRetest && res.breakoutRetest.retested) {
        return {
          timestamp: history[i].timestamp,
          direction: res.breakoutRetest.direction === 'up' ? 'long' : 'short',
          strength: res.breakoutRetest.qualityScore,
          reason: 'Trendline breakout + retest confirmed',
        };
      }
      return null;
    },
  };
}
