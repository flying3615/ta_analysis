import type { Candle } from '../../types.js';
import {
  Backtester,
  type BacktestResult,
  type Strategy,
} from './Backtester.js';

export type ParamGrid = Record<string, number[] | string[] | boolean[]>;

export interface GridSearchConfig {
  initialCapital?: number;
  positionSizing?: number;
  maxConcurrentPositions?: number;
  commissionPerTrade?: number;
  slippageBps?: number;
  allowShort?: boolean;
}

export interface GridSearchResultItem {
  params: Record<string, any>;
  result: BacktestResult;
}

export interface GridSearchSummaryMetrics {
  bestByTotalPnL: GridSearchResultItem | null;
  bestBySharpe: GridSearchResultItem | null;
  bestByMaxDrawdown: GridSearchResultItem | null; // lowest dd
}

export interface GridSearchOutput {
  runs: GridSearchResultItem[];
  summary: GridSearchSummaryMetrics;
}

function cartesianProduct<T>(arrays: T[][]): T[][] {
  return arrays.reduce<T[][]>(
    (acc, arr) => {
      const next: T[][] = [];
      for (const a of acc) {
        for (const b of arr) {
          next.push([...a, b]);
        }
      }
      return next;
    },
    [[]]
  );
}

function buildParamCombos(grid: ParamGrid): Record<string, any>[] {
  const keys = Object.keys(grid);
  if (keys.length === 0) return [{}];
  const values = keys.map(k => grid[k] as any[]);
  const combos = cartesianProduct(values);
  return combos.map(vals => {
    const obj: Record<string, any> = {};
    vals.forEach((v, idx) => (obj[keys[idx]] = v));
    return obj;
  });
}

export type StrategyFactory = (params: Record<string, any>) => Strategy;

export async function runGridSearch(
  candles: Candle[],
  grid: ParamGrid,
  strategyFactory: StrategyFactory,
  backtesterInstance?: Backtester // Allow passing a pre-configured backtester
): Promise<GridSearchOutput> {
  const paramCombos = buildParamCombos(grid);
  const runs: GridSearchResultItem[] = [];

  for (const params of paramCombos) {
    const strategy = strategyFactory(params);
    const backtester = backtesterInstance ?? new Backtester(); // Use provided instance or create a default one
    const result = await backtester.run(candles, strategy);
    runs.push({ params, result });
  }

  const bestByTotalPnL = runs.length
    ? runs.reduce((a, b) => (a.result.totalPnL > b.result.totalPnL ? a : b))
    : null;
  const bestBySharpe = runs.length
    ? runs.reduce((a, b) =>
        a.result.metrics.sharpe > b.result.metrics.sharpe ? a : b
      )
    : null;
  const bestByMaxDrawdown = runs.length
    ? runs.reduce((a, b) =>
        a.result.metrics.maxDrawdown < b.result.metrics.maxDrawdown ? a : b
      )
    : null;

  return { runs, summary: { bestByTotalPnL, bestBySharpe, bestByMaxDrawdown } };
}

export function formatMetricsPanel(run: GridSearchResultItem): string {
  const m = run.result.metrics;
  return [
    `PnL: ${run.result.totalPnL.toFixed(2)}`,
    `WinRate: ${(m.winRate * 100).toFixed(2)}%`,
    `AvgWin: ${m.avgWin.toFixed(2)}`,
    `AvgLoss: ${m.avgLoss.toFixed(2)}`,
    `MaxDD: ${(m.maxDrawdown * 100).toFixed(2)}%`,
    `Sharpe: ${m.sharpe.toFixed(2)}`,
    `Trades: ${m.tradeCount}`,
  ].join(' | ');
}
