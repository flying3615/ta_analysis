/**
 * 多股票回测与按 R 统计的指标。
 *
 * - 每只股票各自独立回测（各自的初始资金），互不影响；
 * - 所有交易汇总后按 R 倍数统计，所以结论不受仓位大小影响；
 * - 累计 R 曲线按出场日期排列，没有考虑同时持仓，因此最大回撤只是近似值。
 */
import type { Candle } from '../../types.js';
import {
  Backtester,
  type BacktestConfig,
  type Strategy,
  type Trade,
} from './Backtester.js';

export interface SymbolTrade extends Trade {
  symbol: string;
}

export interface RMetrics {
  tradeCount: number; // 全部交易
  rTradeCount: number; // 有风险单位、参与 R 统计的交易
  winRate: number; // R > 0 的比例
  avgR: number; // 平均 R（每笔交易的期望值）
  medianR: number;
  totalR: number;
  profitFactor: number; // 盈利 R 之和 ÷ 亏损 R 之和的绝对值；没有亏损时为 Infinity
  maxConsecutiveLosses: number; // 按出场日期排列的最长连亏次数
  maxDrawdownR: number; // 累计 R 曲线（按出场日期）的最大回撤，近似值
  avgHoldingBars: number;
}

export function computeRMetrics(trades: SymbolTrade[]): RMetrics {
  const ordered = [...trades].sort(
    (a, b) => a.exitDate.getTime() - b.exitDate.getTime()
  );
  const rs = ordered
    .map(t => t.rMultiple)
    .filter((r): r is number => r !== undefined && Number.isFinite(r));

  const empty: RMetrics = {
    tradeCount: trades.length,
    rTradeCount: 0,
    winRate: 0,
    avgR: 0,
    medianR: 0,
    totalR: 0,
    profitFactor: 0,
    maxConsecutiveLosses: 0,
    maxDrawdownR: 0,
    avgHoldingBars: trades.length
      ? trades.reduce((s, t) => s + t.holdingBars, 0) / trades.length
      : 0,
  };
  if (rs.length === 0) return empty;

  const totalR = rs.reduce((s, r) => s + r, 0);
  const gains = rs.filter(r => r > 0).reduce((s, r) => s + r, 0);
  const losses = -rs.filter(r => r < 0).reduce((s, r) => s + r, 0);
  const sorted = [...rs].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const medianR =
    sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

  let streak = 0;
  let maxStreak = 0;
  let cumulative = 0;
  let peak = 0;
  let maxDrawdownR = 0;
  for (const r of rs) {
    streak = r < 0 ? streak + 1 : 0;
    maxStreak = Math.max(maxStreak, streak);
    cumulative += r;
    peak = Math.max(peak, cumulative);
    maxDrawdownR = Math.max(maxDrawdownR, peak - cumulative);
  }

  return {
    ...empty,
    rTradeCount: rs.length,
    winRate: rs.filter(r => r > 0).length / rs.length,
    avgR: totalR / rs.length,
    medianR,
    totalR,
    profitFactor: losses > 0 ? gains / losses : gains > 0 ? Infinity : 0,
    maxConsecutiveLosses: maxStreak,
    maxDrawdownR,
  };
}

export interface PortfolioConfig extends Partial<BacktestConfig> {
  /** 按入场日期切分：之前为样本内，之后（含当天）为样本外 */
  splitDate?: Date;
}

export interface PortfolioResult {
  trades: SymbolTrade[];
  overall: RMetrics;
  bySymbol: Record<string, RMetrics & { bars: number }>;
  inSample?: RMetrics;
  outOfSample?: RMetrics;
  skipped: { symbol: string; reason: string }[];
}

/**
 * 对每只股票分别回测，再汇总。strategyFactory 会为每只股票创建新的策略实例，
 * 避免策略的内部状态在股票之间串用。
 */
export async function runPortfolioBacktest(
  dataBySymbol: Record<string, Candle[]>,
  // eslint-disable-next-line no-unused-vars -- 函数类型参数名的误报
  strategyFactory: (symbol: string) => Strategy,
  config: PortfolioConfig = {}
): Promise<PortfolioResult> {
  const { splitDate, ...backtestConfig } = config;
  const backtester = new Backtester(backtestConfig);
  const minBars = (backtestConfig.warmupBars ?? 50) + 2;

  const trades: SymbolTrade[] = [];
  const bySymbol: PortfolioResult['bySymbol'] = {};
  const skipped: PortfolioResult['skipped'] = [];

  for (const symbol of Object.keys(dataBySymbol).sort()) {
    const candles = dataBySymbol[symbol];
    if (candles.length < minBars) {
      skipped.push({
        symbol,
        reason: `只有 ${candles.length} 根K线，至少需要 ${minBars} 根`,
      });
      continue;
    }
    const result = await backtester.run(candles, strategyFactory(symbol));
    const symbolTrades = result.trades.map(t => ({ ...t, symbol }));
    trades.push(...symbolTrades);
    bySymbol[symbol] = {
      ...computeRMetrics(symbolTrades),
      bars: candles.length,
    };
  }

  const out: PortfolioResult = {
    trades,
    overall: computeRMetrics(trades),
    bySymbol,
    skipped,
  };
  if (splitDate) {
    const cut = splitDate.getTime();
    out.inSample = computeRMetrics(
      trades.filter(t => t.entryDate.getTime() < cut)
    );
    out.outOfSample = computeRMetrics(
      trades.filter(t => t.entryDate.getTime() >= cut)
    );
  }
  return out;
}
