/**
 * 离线回测命令行：读取 daily_bars 导出文件，运行唐奇安策略，按 R 输出报告。
 * 文件读写通过 io 参数注入，便于在测试中完全在内存中运行；本模块不访问网络。
 */
import { buildCandles, parseBars, type LoadReport } from './barsLoader.js';
import { DonchianStrategy } from './strategies/DonchianStrategy.js';
import {
  runPortfolioBacktest,
  type PortfolioResult,
  type RMetrics,
  type SymbolTrade,
} from './Portfolio.js';

export interface CliOptions {
  data: string;
  strategy: 'donchian' | 'donchian-plan';
  longOnly: boolean;
  commission: number;
  slippageBps: number;
  riskAtr: number;
  adjust: boolean;
  splitDate?: string;
  symbols?: string[];
  out?: string;
}

export const CLI_USAGE = `用法: node dist/scripts/run-backtest.js --data <bars.csv|bars.json> [选项]

  --strategy donchian|donchian-plan  唐奇安突破，或突破 + 入场计划（默认 donchian）
  --long-only                        只做多
  --commission <n>                   每次开仓/平仓的固定手续费（默认 0）
  --slippage-bps <n>                 滑点，基点（默认 5）
  --risk-atr <n>                     风险单位 = n × ATR，只用于计算 R（默认 2）
  --split-date YYYY-MM-DD            按入场日期切分样本内/样本外
  --adjust                           按 adjusted_close / close 缩放价格
  --symbols A,B,C                    只回测这些股票
  --out trades.csv                   导出每笔交易`;

export function parseCliArgs(argv: string[]): CliOptions {
  const opts: Partial<CliOptions> = {
    strategy: 'donchian',
    longOnly: false,
    commission: 0,
    slippageBps: 5,
    riskAtr: 2,
    adjust: false,
  };
  const value = (i: number, flag: string) => {
    const v = argv[i + 1];
    if (v === undefined || v.startsWith('--')) {
      throw new Error(`${flag} 需要一个值`);
    }
    return v;
  };
  const number = (i: number, flag: string) => {
    const v = Number(value(i, flag));
    if (!Number.isFinite(v)) throw new Error(`${flag} 需要一个数字`);
    return v;
  };

  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    switch (flag) {
      case '--data':
        opts.data = value(i++, flag);
        break;
      case '--strategy': {
        const s = value(i++, flag);
        if (s !== 'donchian' && s !== 'donchian-plan') {
          throw new Error(`未知策略 ${s}，可选 donchian 或 donchian-plan`);
        }
        opts.strategy = s;
        break;
      }
      case '--long-only':
        opts.longOnly = true;
        break;
      case '--adjust':
        opts.adjust = true;
        break;
      case '--commission':
        opts.commission = number(i++, flag);
        break;
      case '--slippage-bps':
        opts.slippageBps = number(i++, flag);
        break;
      case '--risk-atr':
        opts.riskAtr = number(i++, flag);
        break;
      case '--split-date': {
        const d = value(i++, flag);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) {
          throw new Error(`${flag} 的格式应为 YYYY-MM-DD`);
        }
        opts.splitDate = d;
        break;
      }
      case '--symbols':
        opts.symbols = value(i++, flag)
          .split(',')
          .map(s => s.trim().toUpperCase())
          .filter(Boolean);
        break;
      case '--out':
        opts.out = value(i++, flag);
        break;
      default:
        throw new Error(`未知选项 ${flag}\n\n${CLI_USAGE}`);
    }
  }
  if (!opts.data) throw new Error(`缺少 --data\n\n${CLI_USAGE}`);
  return opts as CliOptions;
}

const fmt = (v: number, digits = 2) =>
  Number.isFinite(v) ? v.toFixed(digits) : v > 0 ? '∞' : '-';

function metricsTable(m: RMetrics): string {
  const rows: [string, string][] = [
    ['交易数', String(m.tradeCount)],
    ['参与 R 统计', String(m.rTradeCount)],
    ['胜率', `${fmt(m.winRate * 100, 1)}%`],
    ['平均 R（期望值）', fmt(m.avgR, 3)],
    ['R 中位数', fmt(m.medianR, 3)],
    ['累计 R', fmt(m.totalR)],
    ['盈亏比（R）', fmt(m.profitFactor)],
    ['最长连亏', String(m.maxConsecutiveLosses)],
    ['最大回撤（R，近似）', fmt(m.maxDrawdownR)],
    ['平均持有K线数', fmt(m.avgHoldingBars, 1)],
  ];
  return [
    '| 指标 | 数值 |',
    '|---|---|',
    ...rows.map(([k, v]) => `| ${k} | ${v} |`),
  ].join('\n');
}

function loadSection(report: LoadReport): string {
  const lines = [
    '## 数据',
    `股票数: ${report.symbols}`,
    `日期范围: ${report.firstDate ?? '-'} ~ ${report.lastDate ?? '-'}`,
    `读取行数: ${report.rowsRead}`,
    `跳过的不完整行: ${report.skippedIncomplete}`,
    `由其他数据源补齐的天数: ${report.filledFromOtherSource}`,
  ];
  if (report.largeMoves.length > 0) {
    lines.push(
      '',
      `⚠️ 单日涨跌超过 30% 的K线 ${report.largeMoves.length} 根（可能是未复权的拆股，请检查，必要时使用 --adjust）:`,
      ...report.largeMoves
        .slice(0, 20)
        .map(m => `  ${m.symbol} ${m.date} ${m.changePct}%`)
    );
    if (report.largeMoves.length > 20) {
      lines.push(`  …… 共 ${report.largeMoves.length} 根`);
    }
  }
  return lines.join('\n');
}

function bySymbolTable(result: PortfolioResult): string {
  const rows = Object.entries(result.bySymbol).sort(
    ([, a], [, b]) => b.totalR - a.totalR
  );
  return [
    '| 股票 | K线数 | 交易数 | 胜率 | 平均 R | 累计 R |',
    '|---|---|---|---|---|---|',
    ...rows.map(
      ([symbol, m]) =>
        `| ${symbol} | ${m.bars} | ${m.tradeCount} | ${fmt(m.winRate * 100, 1)}% | ${fmt(m.avgR, 3)} | ${fmt(m.totalR)} |`
    ),
  ].join('\n');
}

export function tradesToCsv(trades: SymbolTrade[]): string {
  const day = (d: Date) => d.toISOString().slice(0, 10);
  const lines = [
    'symbol,direction,entryDate,exitDate,holdingBars,entryPrice,exitPrice,netPnl,riskPerShare,rMultiple',
    ...[...trades]
      .sort((a, b) => a.entryDate.getTime() - b.entryDate.getTime())
      .map(t =>
        [
          t.symbol,
          t.direction,
          day(t.entryDate),
          day(t.exitDate),
          t.holdingBars,
          t.entryPrice.toFixed(4),
          t.exitPrice.toFixed(4),
          t.netPnl.toFixed(2),
          t.riskPerShare?.toFixed(4) ?? '',
          t.rMultiple?.toFixed(4) ?? '',
        ].join(',')
      ),
  ];
  return lines.join('\n') + '\n';
}

export interface CliIo {
  // eslint-disable-next-line no-unused-vars -- 函数类型参数名的误报
  readFile: (path: string) => string;
  // eslint-disable-next-line no-unused-vars -- 函数类型参数名的误报
  writeFile: (path: string, text: string) => void;
}

export async function runBacktestCli(
  argv: string[],
  io: CliIo
): Promise<string> {
  const opts = parseCliArgs(argv);
  const rows = parseBars(io.readFile(opts.data)).filter(
    r => !opts.symbols || opts.symbols.includes(r.symbol.toUpperCase())
  );
  const { dataBySymbol, report } = buildCandles(rows, { adjust: opts.adjust });

  const mode = opts.strategy === 'donchian-plan' ? 'entryPlan' : 'breakout';
  const result = await runPortfolioBacktest(
    dataBySymbol,
    () =>
      DonchianStrategy({
        mode,
        longOnly: opts.longOnly,
        riskAtrMultiple: opts.riskAtr,
      }),
    {
      commissionPerTrade: opts.commission,
      slippageBps: opts.slippageBps,
      allowShort: !opts.longOnly,
      warmupBars: 56,
      splitDate: opts.splitDate
        ? new Date(`${opts.splitDate}T00:00:00Z`)
        : undefined,
    }
  );
  const strategyName =
    mode === 'entryPlan' ? 'DonchianEntryPlan' : 'DonchianBreakout';

  const sections = [
    `# 回测报告：${strategyName}${opts.longOnly ? '（只做多）' : ''}`,
    loadSection(report),
    `## 全部交易\n\n${metricsTable(result.overall)}`,
  ];
  if (result.inSample && result.outOfSample) {
    sections.push(
      `## 样本内（入场日 < ${opts.splitDate}）\n\n${metricsTable(result.inSample)}`,
      `## 样本外（入场日 ≥ ${opts.splitDate}）\n\n${metricsTable(result.outOfSample)}`
    );
  }
  sections.push(`## 各股票\n\n${bySymbolTable(result)}`);
  if (result.skipped.length > 0) {
    sections.push(
      `## 跳过的股票\n\n${result.skipped.map(s => `- ${s.symbol}: ${s.reason}`).join('\n')}`
    );
  }
  sections.push(
    'R = 净盈亏 ÷ (风险单位 × 股数)，风险单位为 ' +
      `${opts.riskAtr} × ATR，只用于换算，不是实际执行的止损。` +
      '最大回撤按出场日期累计 R 计算，没有考虑同时持仓。'
  );

  if (opts.out) {
    io.writeFile(opts.out, tradesToCsv(result.trades));
    sections.push(`已导出 ${result.trades.length} 笔交易到 ${opts.out}`);
  }
  return sections.join('\n\n') + '\n';
}
