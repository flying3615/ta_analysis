import type { Candle } from '../../../types.js';
import type { Strategy, Signal } from '../Backtester.js';
import { IntegratedOrchestrator } from '../../integration/IntegratedOrchestrator.js';
import type { IntegrationConfig } from '../../integration/IntegrationConfig.js';
import { aggregateDailyToWeekly } from '../../../util/util.js';
import { TradeDirection } from '../../../types.js';

/**
 * Strategy that queries the IntegratedOrchestrator on each step using the available history.
 * This version is corrected to use an offline analysis method to prevent lookahead bias.
 */
export function IntegrationSignalStrategy(
  symbol: string,
  timeframe: 'daily', // This strategy is designed to work with daily data slices
  config?: IntegrationConfig
): Strategy {
  // Instantiate the orchestrator once to be reused
  const orchestrator = new IntegratedOrchestrator(config);

  return {
    name: `IntegrationSignalStrategy_${timeframe}`,

    async generateSignal(history: Candle[], i: number): Promise<Signal | null> {
      // We need a sufficient amount of data to perform meaningful analysis
      if (history.length < 60) {
        return null; // Not enough data yet
      }

      // The history slice represents the daily data available at step `i`
      const dailyData = history;

      // Aggregate daily data to weekly data for multi-timeframe analysis
      const weeklyData = aggregateDailyToWeekly(dailyData);

      // Hourly data cannot be derived from daily data, so we pass an empty array.
      // The orchestrator's fallback mechanism will handle missing hourly analysis.
      const hourlyData: Candle[] = [];

      try {
        // Execute the offline analysis to avoid lookahead bias
        const result = await orchestrator.executeOfflineAnalysis(
          symbol,
          dailyData,
          weeklyData,
          hourlyData,
          config
        );

        const direction = result.tradePlan.direction;
        const currentPrice = dailyData[dailyData.length - 1].close;

        // Create a signal based on the trade plan's direction
        const signal: Signal = {
          timestamp: new Date(history[i].timestamp),
          direction: 'flat', // Default to flat
          reason: result.tradePlan.summary,
          entry: currentPrice,
          stop: result.tradePlan.exitStrategy.stopLossLevels[0]?.price,
          targets: result.tradePlan.exitStrategy.takeProfitLevels.map(
            l => l.price
          ),
        };

        if (direction === TradeDirection.Long) {
          signal.direction = 'long';
        } else if (direction === TradeDirection.Short) {
          signal.direction = 'short';
        } else {
          signal.direction = 'flat';
        }

        return signal;
      } catch (error) {
        console.error(
          `Error in IntegrationSignalStrategy at step ${i}:`,
          error
        );
        return null; // Return no signal on error
      }
    },
  };
}
