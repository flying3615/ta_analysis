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
  bestByMaxDrawdown: GridSearchResultItem | null; // lowest dd among runs with trades
  /** 设置 testRatio 时：上面三个最优参数在样本外数据上的回测结果 */
  outOfSample?: {
    byTotalPnL: GridSearchResultItem | null;
    bySharpe: GridSearchResultItem | null;
    byMaxDrawdown: GridSearchResultItem | null;
  };
}

export interface GridSearchOptions {
  /**
   * 样本外比例（0-1）。设置后，前 (1 − testRatio) 的数据用于调参，
   * 最优参数再在剩余数据上回测，结果见 summary.outOfSample。
   */
  testRatio?: number;
}

/** Backtester 从第 50 根K线开始交易，样本外数据前需要这么多预热K线 */
const WARMUP_BARS = 50;

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
  backtesterInstance?: Backtester, // Allow passing a pre-configured backtester
  options: GridSearchOptions = {}
): Promise<GridSearchOutput> {
  const testRatio = options.testRatio ?? 0;
  if (testRatio < 0 || testRatio >= 1) {
    throw new Error(`testRatio 必须在 [0, 1) 之间，当前为 ${testRatio}`);
  }
  const split =
    testRatio > 0
      ? Math.floor(candles.length * (1 - testRatio))
      : candles.length;
  const trainCandles = candles.slice(0, split);
  // 样本外数据带上预热K线，使交易只发生在切分点之后
  const testCandles = candles.slice(Math.max(0, split - WARMUP_BARS));

  const backtester = backtesterInstance ?? new Backtester(); // Use provided instance or create a default one
  const paramCombos = buildParamCombos(grid);
  const runs: GridSearchResultItem[] = [];

  for (const params of paramCombos) {
    const strategy = strategyFactory(params);
    const result = await backtester.run(trainCandles, strategy);
    runs.push({ params, result });
  }

  const traded = runs.filter(r => r.result.metrics.tradeCount > 0);
  const bestByTotalPnL = runs.length
    ? runs.reduce((a, b) => (a.result.totalPnL > b.result.totalPnL ? a : b))
    : null;
  const bestBySharpe = runs.length
    ? runs.reduce((a, b) =>
        a.result.metrics.sharpe > b.result.metrics.sharpe ? a : b
      )
    : null;
  // 不交易的参数回撤为 0，不能算作"回撤最小"
  const bestByMaxDrawdown = traded.length
    ? traded.reduce((a, b) =>
        a.result.metrics.maxDrawdown < b.result.metrics.maxDrawdown ? a : b
      )
    : null;

  const summary: GridSearchSummaryMetrics = {
    bestByTotalPnL,
    bestBySharpe,
    bestByMaxDrawdown,
  };

  if (testRatio > 0) {
    const evaluate = async (
      best: GridSearchResultItem | null
    ): Promise<GridSearchResultItem | null> => {
      if (!best) return null;
      // 用新的策略实例，避免带入调参阶段的内部状态
      const result = await backtester.run(
        testCandles,
        strategyFactory(best.params)
      );
      return { params: best.params, result };
    };
    summary.outOfSample = {
      byTotalPnL: await evaluate(bestByTotalPnL),
      bySharpe: await evaluate(bestBySharpe),
      byMaxDrawdown: await evaluate(bestByMaxDrawdown),
    };
  }

  return { runs, summary };
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
