import { runGridSearch, formatMetricsPanel } from './GridSearch.js';
import { DataProvider } from '../../data/DataProvider.js';
import { DEFAULT_INTEGRATION_CONFIG } from '../integration/IntegrationConfig.js';
import { Backtester } from './Backtester.js';
import type { Candle } from '../../types.js';
import { TrendlineBreakoutStrategy } from './strategies/TrendlineBreakoutStrategy.js';
import { RangeBreakoutStrategy } from './strategies/RangeBreakoutStrategy.js';

/**
 * This script demonstrates how to use the GridSearch functionality to find
 * optimal parameters for a given backtesting strategy.
 */
async function main() {
  const symbol = 'MSTR'; // Example stock for backtesting
  const timeframe = 'daily';

  // 1. Fetch historical data for the backtest
  const dataProvider = new DataProvider();
  console.log(`Fetching ${timeframe} data for ${symbol}...`);
  const allData = await dataProvider.getMultiTimeframeData(
    symbol,
    DEFAULT_INTEGRATION_CONFIG
  );
  const candles: Candle[] = allData.dailyData;

  if (!candles || candles.length === 0) {
    console.error('Failed to fetch candle data.');
    return;
  }
  console.log(`Data fetched. Total candles: ${candles.length}`);

  // 2. Define the parameter grid to search
  // These parameters are specific to the chosen strategy (RangeBreakoutStrategy)
  const paramGrid = {};
  console.log('--- Parameter Grid for Search ---');
  console.log(paramGrid);
  console.log('---------------------------------');

  // 3. Define the Strategy Factory function
  // This function takes a set of parameters and returns a strategy instance.
  const strategyFactory = (params: Record<string, any>) => {
    // return IntegrationSignalStrategy(symbol, timeframe, params);
    // return TrendlineBreakoutStrategy(symbol, timeframe);
    return RangeBreakoutStrategy(symbol, timeframe, params);
  };

  // 4. Configure the Backtester with exit parameters
  const backtester = new Backtester({
    initialCapital: 100000,
    commissionPerTrade: 5,
    slippageBps: 5,
    exitParams: {
      // takeProfitPercent: 15, // 15% 止盈
      stopLossPercent: 7, // 7% 止损
      trailingStopPercent: 7, // 7% 追踪止损
    },
  });

  // 5. Run the Grid Search
  console.log(
    '\nStarting Grid Search... This may take a while depending on the grid size.'
  );
  const gridSearchResult = await runGridSearch(
    candles,
    paramGrid,
    strategyFactory,
    backtester // Pass the configured backtester to the grid search
  );
  console.log(
    `Grid Search completed. Total runs: ${gridSearchResult.runs.length}`
  );

  // 5. Print the summary of best results
  console.log('\n--- Grid Search Summary --- ');
  if (gridSearchResult.summary.bestByTotalPnL) {
    console.log('\n=> Best by Total PnL');
    console.log(formatMetricsPanel(gridSearchResult.summary.bestByTotalPnL));
  }
  if (gridSearchResult.summary.bestBySharpe) {
    console.log('\n=> Best by Sharpe Ratio');
    console.log(formatMetricsPanel(gridSearchResult.summary.bestBySharpe));
  }
  if (gridSearchResult.summary.bestByMaxDrawdown) {
    console.log('\n=> Best by Lowest Max Drawdown');
    console.log(formatMetricsPanel(gridSearchResult.summary.bestByMaxDrawdown));
  }

  // 6. Optionally, print all results, sorted by a metric
  console.log('\n--- All Run Results (sorted by Sharpe Ratio) ---');
  gridSearchResult.runs
    .sort((a, b) => b.result.metrics.sharpe - a.result.metrics.sharpe) // Sort by Sharpe for display
    .forEach(run => {
      console.log(formatMetricsPanel(run));
      // If trades exist for this run, print them
      if (run.result.trades.length > 0) {
        console.log('  └─ Trades:');
        run.result.trades.forEach(trade => {
          const entryDate = new Date(
            candles[trade.entryIdx].timestamp
          ).toLocaleDateString();
          console.log(
            `    - Date: ${entryDate}, Direction: ${trade.direction}, Entry: ${trade.entryPrice.toFixed(2)}, Exit: ${trade.exitPrice.toFixed(2)}, PnL: ${trade.pnl.toFixed(2)}`
          );
        });
      }
    });
}

main().catch(console.error);
