/**
 * 读取 stock-scanner-tauri 的 daily_bars 导出数据（sqlite3 -csv 或 .mode json），
 * 转成回测用的 Candle 序列。纯函数，不读写文件、不访问网络。
 *
 * daily_bars 以 (symbol, trading_date, source) 为唯一键，同一天可能有多个来源：
 * 优先使用 yahoo，yahoo 缺失的日期才用其他来源。
 */
import type { Candle } from '../../types.js';

export interface BarRow {
  symbol: string;
  trading_date: string; // YYYY-MM-DD
  source: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjusted_close: number | null;
  is_complete: number;
  missing_reason: string | null;
}

const NUMERIC = ['open', 'high', 'low', 'close', 'volume'] as const;

/** 解析一行 CSV，支持双引号包裹的字段（字段内的 "" 表示一个引号） */
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ',') {
      out.push(field);
      field = '';
    } else {
      field += ch;
    }
  }
  out.push(field);
  return out;
}

function toRow(raw: Record<string, unknown>): BarRow {
  const text = (v: unknown) =>
    v === null || v === undefined || v === '' ? null : String(v);
  const num = (v: unknown) => {
    const t = text(v);
    return t === null ? null : Number(t);
  };
  const row: BarRow = {
    symbol: String(raw.symbol ?? '').trim(),
    trading_date: String(raw.trading_date ?? '').trim(),
    source: String(raw.source ?? 'unknown').trim(),
    open: Number(raw.open),
    high: Number(raw.high),
    low: Number(raw.low),
    close: Number(raw.close),
    volume: Number(raw.volume),
    adjusted_close: num(raw.adjusted_close),
    is_complete: num(raw.is_complete) ?? 1,
    missing_reason: text(raw.missing_reason),
  };
  for (const key of NUMERIC) {
    if (!Number.isFinite(row[key])) {
      throw new Error(
        `${row.symbol} ${row.trading_date}: ${key} 不是有效数字 (${String(raw[key])})`
      );
    }
  }
  return row;
}

/** 解析 CSV（带表头）或 JSON 数组文本 */
export function parseBars(text: string): BarRow[] {
  const trimmed = text.trim();
  if (trimmed.startsWith('[')) {
    return (JSON.parse(trimmed) as Record<string, unknown>[]).map(toRow);
  }
  const lines = trimmed.split(/\r?\n/).filter(l => l.length > 0);
  if (lines.length === 0) return [];
  const header = splitCsvLine(lines[0]).map(h => h.trim());
  return lines.slice(1).map(line => {
    const values = splitCsvLine(line);
    const raw: Record<string, unknown> = {};
    header.forEach((h, k) => (raw[h] = values[k]));
    return toRow(raw);
  });
}

export interface LoadReport {
  rowsRead: number;
  symbols: number;
  firstDate?: string;
  lastDate?: string;
  skippedIncomplete: number; // is_complete = 0 或有 missing_reason
  /** 某只股票有首选来源（yahoo）的数据、但某天缺失、用其他来源补上的天数 */
  filledFromOtherSource: number;
  sources: Record<string, number>; // 最终采用的K线按来源计数
  /** 单日涨跌超过 30% 的K线：可能是未复权的拆股，需要人工检查 */
  largeMoves: { symbol: string; date: string; changePct: number }[];
  /** 相邻两根K线相隔超过 7 个自然日的缺口：跨缺口计算的通道和 ATR 不可靠 */
  gaps: { symbol: string; from: string; to: string; days: number }[];
}

export interface BuildOptions {
  preferSource?: string; // 默认 yahoo
  adjust?: boolean; // 按 adjusted_close / close 缩放 OHLC
  largeMovePct?: number; // 默认 30
}

export function buildCandles(
  rows: BarRow[],
  options: BuildOptions = {}
): { dataBySymbol: Record<string, Candle[]>; report: LoadReport } {
  const prefer = (options.preferSource ?? 'yahoo').toLowerCase();
  const largeMovePct = options.largeMovePct ?? 30;

  const report: LoadReport = {
    rowsRead: rows.length,
    symbols: 0,
    skippedIncomplete: 0,
    filledFromOtherSource: 0,
    sources: {},
    largeMoves: [],
    gaps: [],
  };

  // symbol → date → 选中的行
  const chosen = new Map<string, Map<string, BarRow>>();
  for (const row of rows) {
    if (row.is_complete === 0 || row.missing_reason) {
      report.skippedIncomplete++;
      continue;
    }
    const byDate = chosen.get(row.symbol) ?? new Map<string, BarRow>();
    chosen.set(row.symbol, byDate);
    const existing = byDate.get(row.trading_date);
    const isPreferred = row.source.toLowerCase() === prefer;
    if (
      !existing ||
      (isPreferred && existing.source.toLowerCase() !== prefer)
    ) {
      byDate.set(row.trading_date, row);
    }
  }

  const dataBySymbol: Record<string, Candle[]> = {};
  for (const [symbol, byDate] of chosen) {
    const dates = [...byDate.keys()].sort();
    const candles: Candle[] = [];
    // 只有这只股票确实有首选来源的数据时，其他来源的行才算"补齐"
    const hasPreferred = [...byDate.values()].some(
      r => r.source.toLowerCase() === prefer
    );
    for (const date of dates) {
      const r = byDate.get(date)!;
      if (hasPreferred && r.source.toLowerCase() !== prefer) {
        report.filledFromOtherSource++;
      }
      report.sources[r.source] = (report.sources[r.source] ?? 0) + 1;
      const factor =
        options.adjust &&
        r.adjusted_close &&
        r.adjusted_close > 0 &&
        r.close > 0
          ? r.adjusted_close / r.close
          : 1;
      const candle: Candle = {
        symbol,
        open: r.open * factor,
        high: r.high * factor,
        low: r.low * factor,
        close: r.close * factor,
        volume: r.volume,
        timestamp: new Date(`${date}T00:00:00Z`),
      };
      const prev = candles[candles.length - 1];
      if (prev) {
        const days = Math.round(
          (candle.timestamp.getTime() - prev.timestamp.getTime()) / 86400000
        );
        if (days > 7) {
          report.gaps.push({
            symbol,
            from: prev.timestamp.toISOString().slice(0, 10),
            to: date,
            days,
          });
        }
      }
      if (prev && prev.close > 0) {
        const changePct = (candle.close / prev.close - 1) * 100;
        if (Math.abs(changePct) > largeMovePct) {
          report.largeMoves.push({
            symbol,
            date,
            changePct: Math.round(changePct * 10) / 10,
          });
        }
      }
      candles.push(candle);
    }
    dataBySymbol[symbol] = candles;
    report.firstDate =
      !report.firstDate || dates[0] < report.firstDate
        ? dates[0]
        : report.firstDate;
    const last = dates[dates.length - 1];
    report.lastDate =
      !report.lastDate || last > report.lastDate ? last : report.lastDate;
  }
  report.symbols = Object.keys(dataBySymbol).length;
  return { dataBySymbol, report };
}
