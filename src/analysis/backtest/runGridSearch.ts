import { runGridSearch, formatMetricsPanel, type ParamGrid, type StrategyFactory } from './GridSearch.js';
import { DataProvider } from '../../data/DataProvider.js';
import { DEFAULT_INTEGRATION_CONFIG, updateIntegrationConfig } from '../integration/IntegrationConfig.js';
import { Backtester } from './Backtester.js';
import type { Candle } from '../../types.js';
import { TrendlineBreakoutStrategy } from './strategies/TrendlineBreakoutStrategy.js';
import { RangeBreakoutStrategy } from './strategies/RangeBreakoutStrategy.js';
import { StructureBreakoutStrategy } from './strategies/StructureBreakoutStrategy.js';
import { SupplyDemandRetestStrategy } from './strategies/SupplyDemandRetestStrategy.js';
import { PatternConsensusStrategy } from './strategies/PatternConsensusStrategy.js';
import { IntegrationSignalStrategy } from './strategies/IntegrationSignalStrategy.js';

/**
 * This script demonstrates how to use the GridSearch functionality to find
 * optimal parameters for a given backtesting strategy.
 */
async function main() {
  const symbol = 'NVDA'; // Example stock for backtesting
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

  // 2. Configure the Backtester with exit parameters (shared for all runs)
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

  // 3. Define multiple strategies and their parameter grids
  const strategies: { name: string; grid: ParamGrid; factory: StrategyFactory }[] = [
    {
      name: 'RangeBreakout',
      grid: {
        requireRetest: [true, false],
        minQuality: [60, 75, 85],
      },
      factory: (params: Record<string, any>) =>
        RangeBreakoutStrategy(symbol, timeframe, params),
    },
    {
      name: 'TrendlineBreakout',
      grid: {},
      factory: () => TrendlineBreakoutStrategy(symbol, timeframe),
    },
    {
      name: 'StructureBreakout',
      grid: {
        preferEvent: ['BOS', 'CHOCH', 'any'],
        confirmTrend: [true, false],
        coolDownBars: [5, 10],
      },
      factory: (params: Record<string, any>) =>
        StructureBreakoutStrategy(symbol, timeframe, params),
    },
    {
      name: 'SupplyDemandRetest',
      grid: {
        requireTested: [true, false],
        allowFreshEntry: [false, true],
        minZoneWidthPercent: [0.015, 0.02, 0.03],
      },
      factory: (params: Record<string, any>) =>
        SupplyDemandRetestStrategy(symbol, timeframe, params),
    },
    {
      name: 'PatternConsensus',
      grid: {
        minSignalStrength: [55, 60, 65],
        requireAllAligned: [false, true],
        coolDownBars: [10],
      },
      factory: (params: Record<string, any>) =>
        PatternConsensusStrategy(symbol, 'daily', params),
    },
    {
      name: 'IntegrationSignal',
      grid: {
        // 可在此扩展：例如不同 logLevel/weights 的组合，但通常通过 updateIntegrationConfig 调整
      },
      factory: () => {
        const tuned = updateIntegrationConfig({
          weights: {
            ...DEFAULT_INTEGRATION_CONFIG.weights,
            // 提高区间与结构的贡献度（相较默认值）
            range: 0.2,
            structure: 0.2,
          },
          options: {
            ...DEFAULT_INTEGRATION_CONFIG.options,
            logLevel: 'silent',
          },
        });
        return IntegrationSignalStrategy(symbol, timeframe, tuned);
      },
    },
  ];

  type SummaryRow = {
    strategy: string;
    bestSharpe: number;
    bestPnL: number;
    maxDrawdown: number;
    tradeCount: number;
  };
  const summaryRows: SummaryRow[] = [];

  for (const s of strategies) {
    console.log(`\n================ ${s.name} =================`);
    console.log('Parameter Grid:');
    console.log(s.grid);

    const result = await runGridSearch(candles, s.grid, s.factory, backtester);
    console.log(`Completed. Total runs: ${result.runs.length}`);

    // Print bests
    if (result.summary.bestBySharpe) {
      console.log('\n=> Best by Sharpe Ratio');
      console.log(formatMetricsPanel(result.summary.bestBySharpe));
    }
    if (result.summary.bestByTotalPnL) {
      console.log('\n=> Best by Total PnL');
      console.log(formatMetricsPanel(result.summary.bestByTotalPnL));
    }
    if (result.summary.bestByMaxDrawdown) {
      console.log('\n=> Best by Lowest Max Drawdown');
      console.log(formatMetricsPanel(result.summary.bestByMaxDrawdown));
    }

    const bestSharpeRun = result.summary.bestBySharpe ?? null;
    if (bestSharpeRun) {
      summaryRows.push({
        strategy: s.name,
        bestSharpe: bestSharpeRun.result.metrics.sharpe,
        bestPnL: bestSharpeRun.result.totalPnL,
        maxDrawdown: bestSharpeRun.result.metrics.maxDrawdown,
        tradeCount: bestSharpeRun.result.metrics.tradeCount,
      });
    }
  }

  // 4. Cross-strategy summary
  console.log('\n===== Cross-Strategy Summary (sorted by Sharpe) =====');
  summaryRows
    .sort((a, b) => b.bestSharpe - a.bestSharpe)
    .forEach(r => {
      console.log(
        `${r.strategy.padEnd(22)} | Sharpe: ${r.bestSharpe.toFixed(2)} | PnL: ${r.bestPnL.toFixed(2)} | MaxDD: ${(r.maxDrawdown * 100).toFixed(2)}% | Trades: ${r.tradeCount}`
      );
    });
}

main().catch(console.error);
