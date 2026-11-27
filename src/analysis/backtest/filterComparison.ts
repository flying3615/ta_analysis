/**
 * 过滤器对比：把基准回测的交易按"信号日能否通过过滤器"拆成两组，比较两组的 R。
 *
 * 为什么不直接比较"加了过滤器的回测"：过滤器拒绝一次突破后策略保持空仓，
 * 之后可能做一笔基准当时因为持仓而错过的交易，所以那不是基准交易的子集。
 * 拆分基准自己的交易，比较的才是同一批交易里"过滤器选中的"和"被排除的"。
 *
 * 无法判断（undecided）的交易归入通过组，与回测时的处理一致，并单独计数。
 */
import type { Candle } from '../../types.js';
import type { SymbolTrade } from './Portfolio.js';
import type { BreakoutFilter } from './donchianFilters.js';

export interface GroupStats {
  count: number;
  avgR: number;
  winRate: number;
  profitFactor: number;
  sdR: number; // R 的样本标准差（n − 1）
}

export interface FilterSplit {
  pass: GroupStats; // 含无法判断的交易
  fail: GroupStats;
  undecided: number;
  keptFraction: number; // 通过组交易数 ÷ 总交易数
  diffR?: number; // 通过组平均 R − 不通过组平均 R；任一组没有交易时为 undefined
  se?: number; // Welch 标准误：√(s₁²/n₁ + s₂²/n₂)
  t?: number; // diffR ÷ se；任一组少于 2 笔交易时为 undefined
}

function groupStats(rs: number[]): GroupStats {
  const n = rs.length;
  if (n === 0) {
    return { count: 0, avgR: 0, winRate: 0, profitFactor: 0, sdR: 0 };
  }
  const mean = rs.reduce((s, r) => s + r, 0) / n;
  const variance =
    n > 1 ? rs.reduce((s, r) => s + (r - mean) ** 2, 0) / (n - 1) : 0;
  const gains = rs.filter(r => r > 0).reduce((s, r) => s + r, 0);
  const losses = -rs.filter(r => r < 0).reduce((s, r) => s + r, 0);
  return {
    count: n,
    avgR: mean,
    winRate: rs.filter(r => r > 0).length / n,
    profitFactor: losses > 0 ? gains / losses : gains > 0 ? Infinity : 0,
    sdR: Math.sqrt(variance),
  };
}

function compare(
  passRs: number[],
  failRs: number[],
  undecided: number
): FilterSplit {
  const pass = groupStats(passRs);
  const fail = groupStats(failRs);
  const total = pass.count + fail.count;
  const split: FilterSplit = {
    pass,
    fail,
    undecided,
    keptFraction: total > 0 ? pass.count / total : 0,
    diffR: pass.count > 0 && fail.count > 0 ? pass.avgR - fail.avgR : undefined,
  };
  if (pass.count >= 2 && fail.count >= 2) {
    const se = Math.sqrt(
      pass.sdR ** 2 / pass.count + fail.sdR ** 2 / fail.count
    );
    split.se = se;
    split.t =
      se > 0 && split.diffR !== undefined ? split.diffR / se : undefined;
  }
  return split;
}

export interface FilterComparison {
  all: FilterSplit;
  inSample?: FilterSplit;
  outOfSample?: FilterSplit;
}

/**
 * @param trades 基准回测的交易（需要 signalIdx 和 rMultiple）
 * @param dataBySymbol 回测使用的K线，过滤器只会看到信号日及之前的部分
 * @param splitDate 按入场日期切分样本内/样本外
 */
export function splitTradesByFilter(
  trades: SymbolTrade[],
  dataBySymbol: Record<string, Candle[]>,
  filter: BreakoutFilter,
  splitDate?: Date
): FilterComparison {
  type Row = {
    r: number;
    verdict: 'pass' | 'fail' | 'undecided';
    entry: number;
  };
  const rows: Row[] = [];
  for (const t of trades) {
    if (t.rMultiple === undefined || !Number.isFinite(t.rMultiple)) continue;
    const candles = dataBySymbol[t.symbol];
    if (!candles) continue;
    const history = candles.slice(0, t.signalIdx + 1);
    rows.push({
      r: t.rMultiple,
      verdict: filter.evaluate(history, t.signalIdx, t.direction),
      entry: t.entryDate.getTime(),
    });
  }

  const build = (subset: Row[]) =>
    compare(
      subset.filter(x => x.verdict !== 'fail').map(x => x.r),
      subset.filter(x => x.verdict === 'fail').map(x => x.r),
      subset.filter(x => x.verdict === 'undecided').length
    );

  const result: FilterComparison = { all: build(rows) };
  if (splitDate) {
    const cut = splitDate.getTime();
    result.inSample = build(rows.filter(x => x.entry < cut));
    result.outOfSample = build(rows.filter(x => x.entry >= cut));
  }
  return result;
}
