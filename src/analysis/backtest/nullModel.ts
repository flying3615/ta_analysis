/**
 * 随机入场对照：用相同的出场规则和风险单位、随机的入场，跑多个随机种子，
 * 看基准（唐奇安）的平均 R 落在随机结果分布的什么位置。
 *
 * 入场概率会校准到让随机交易数接近基准交易数：先按"基准交易数 ÷ 可入场K线数"估算，
 * 再用校准专用的种子试跑并按交易数比例调整。
 */
import type { Candle } from '../../types.js';
import type { BacktestConfig } from './Backtester.js';
import {
  computeRMetrics,
  runPortfolioBacktest,
  type PortfolioResult,
  type SymbolTrade,
} from './Portfolio.js';
import { RandomEntryStrategy } from './strategies/RandomEntryStrategy.js';

export interface NullDistribution {
  baseline: number; // 基准的平均 R
  values: number[]; // 每个随机种子的平均 R
  mean: number;
  sd: number; // 样本标准差
  min: number;
  max: number;
  atOrAboveBaseline: number; // 随机结果 ≥ 基准的比例
  z?: number; // (基准 − 随机均值) ÷ 随机标准差
}

export function nullDistribution(
  baseline: number,
  values: number[]
): NullDistribution {
  const n = values.length;
  const mean = n ? values.reduce((s, v) => s + v, 0) / n : 0;
  const sd =
    n > 1
      ? Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / (n - 1))
      : 0;
  return {
    baseline,
    values,
    mean,
    sd,
    min: n ? Math.min(...values) : 0,
    max: n ? Math.max(...values) : 0,
    atOrAboveBaseline: n ? values.filter(v => v >= baseline).length / n : 0,
    z: sd > 0 ? (baseline - mean) / sd : undefined,
  };
}

export interface NullModelOptions {
  seeds: number;
  backtestConfig: Partial<BacktestConfig>;
  splitDate?: Date;
  riskAtrMultiple?: number;
  calibrationRounds?: number; // 默认 2
  // eslint-disable-next-line no-unused-vars -- 函数类型参数名的误报
  onProgress?: (message: string) => void;
}

export interface NullModelResult {
  seeds: number;
  probability: number;
  baselineTrades: number;
  nullTradesMean: number;
  overall: NullDistribution;
  inSample?: NullDistribution;
  outOfSample?: NullDistribution;
  byYear: Record<string, NullDistribution>; // 按入场年份
}

// eslint-disable-next-line no-unused-vars -- 函数类型参数名的误报
type TradePredicate = (trade: SymbolTrade) => boolean;

const avgR = (trades: SymbolTrade[]) => computeRMetrics(trades).avgR;
const year = (t: SymbolTrade) => String(t.entryDate.getUTCFullYear());

/** 校准用的种子与正式种子分开，避免校准结果影响分布 */
const CALIBRATION_SEED_BASE = 1_000_000;

export async function runNullModel(
  dataBySymbol: Record<string, Candle[]>,
  baseline: PortfolioResult,
  options: NullModelOptions
): Promise<NullModelResult> {
  const {
    seeds,
    backtestConfig,
    splitDate,
    riskAtrMultiple = 2,
    calibrationRounds = 2,
    onProgress,
  } = options;
  const config = { ...backtestConfig, allowShort: false };
  const run = (probability: number, seed: number) =>
    runPortfolioBacktest(
      dataBySymbol,
      symbol =>
        RandomEntryStrategy({ probability, seed, symbol, riskAtrMultiple }),
      config
    );

  // 1. 校准入场概率
  const target = baseline.overall.tradeCount;
  const warmup = Math.max(config.warmupBars ?? 50, 55);
  const eligibleBars = Object.values(dataBySymbol).reduce(
    (s, c) => s + Math.max(0, c.length - 1 - warmup),
    0
  );
  let probability = eligibleBars > 0 ? Math.min(1, target / eligibleBars) : 0;
  for (let round = 0; round < calibrationRounds && target > 0; round++) {
    const trial = await run(probability, CALIBRATION_SEED_BASE + round);
    const got = trial.overall.tradeCount;
    onProgress?.(
      `校准 ${round + 1}/${calibrationRounds}：概率 ${probability.toExponential(3)}，交易数 ${got}（目标 ${target}）`
    );
    if (got > 0) probability = Math.min(1, probability * (target / got));
  }

  // 2. 正式运行
  const runs: SymbolTrade[][] = [];
  for (let seed = 1; seed <= seeds; seed++) {
    const result = await run(probability, seed);
    runs.push(result.trades);
    onProgress?.(
      `随机种子 ${seed}/${seeds}：交易数 ${result.overall.tradeCount}，平均 R ${result.overall.avgR.toFixed(3)}`
    );
  }

  // 3. 汇总
  const distribution = (pick: TradePredicate) =>
    nullDistribution(
      avgR(baseline.trades.filter(pick)),
      runs.map(trades => avgR(trades.filter(pick)))
    );

  const result: NullModelResult = {
    seeds,
    probability,
    baselineTrades: target,
    nullTradesMean: runs.reduce((s, r) => s + r.length, 0) / (seeds || 1),
    overall: distribution(() => true),
    byYear: {},
  };
  if (splitDate) {
    const cut = splitDate.getTime();
    result.inSample = distribution(t => t.entryDate.getTime() < cut);
    result.outOfSample = distribution(t => t.entryDate.getTime() >= cut);
  }
  for (const y of [...new Set(baseline.trades.map(year))].sort()) {
    result.byYear[y] = distribution(t => year(t) === y);
  }
  return result;
}
