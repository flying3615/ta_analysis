#!/usr/bin/env node
/**
 * 从 Nasdaq 公开历史行情接口抓取日线，输出 backtest CLI 可直接读取的 bars.csv。
 * 用法: node scripts/fetch-nasdaq-bars.mjs --symbols-file bars-symbols.txt --out bars.csv
 *       [--cache .bars-cache] [--start 2015-01-01] [--delay 500]
 *
 * 说明:
 * - 接口每次最多返回 10 年，按日期倒序。
 * - 价格是拆股调整后、不含分红调整；因此 adjusted_close 写入与 close 相同的值，
 *   回测里 --adjust 相当于无操作（不会进行分红调整）。
 * - 逐只抓取，带重试与限速；已抓过的股票缓存在 --cache 目录，可断点续跑。
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

function parseArgs(argv) {
  const opts = {
    symbolsFile: 'bars-symbols.txt',
    out: 'bars.csv',
    cache: '.bars-cache',
    start: '2015-01-01',
    delay: 500,
    assetclass: 'stocks',
  };
  for (let i = 0; i < argv.length; i++) {
    const v = argv[i];
    const val = () => argv[++i];
    if (v === '--symbols-file') opts.symbolsFile = val();
    else if (v === '--out') opts.out = val();
    else if (v === '--cache') opts.cache = val();
    else if (v === '--start') opts.start = val();
    else if (v === '--delay') opts.delay = Number(val());
    else if (v === '--end') opts.end = val();
    else if (v === '--assetclass') opts.assetclass = val();
  }
  return opts;
}

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const sleep = ms => new Promise(r => setTimeout(r, ms));

const toNumber = text => {
  if (text === null || text === undefined) return null;
  const cleaned = String(text).replace(/[$,\s]/g, '');
  if (!cleaned || cleaned === 'N/A' || cleaned === '--') return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
};

const toIso = usDate => {
  const [m, d, y] = String(usDate).split('/');
  if (!m || !d || !y) return null;
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
};

async function fetchSymbol(symbol, start, end, assetclass) {
  const url =
    `https://api.nasdaq.com/api/quote/${encodeURIComponent(symbol)}/historical` +
    `?assetclass=${assetclass}&fromdate=${start}&todate=${end}&limit=9999`;
  let lastError;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': UA,
          Accept: 'application/json, text/plain, */*',
          Referer: 'https://www.nasdaq.com/',
        },
        signal: AbortSignal.timeout(20000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json();
      const rows = body?.data?.tradesTable?.rows ?? [];
      const out = [];
      for (const row of rows) {
        const date = toIso(row.date);
        const open = toNumber(row.open);
        const high = toNumber(row.high);
        const low = toNumber(row.low);
        const close = toNumber(row.close);
        const volume = toNumber(row.volume);
        if (!date || close === null) continue;
        out.push({
          date,
          open: open ?? close,
          high: high ?? close,
          low: low ?? close,
          close,
          volume: volume ?? 0,
        });
      }
      out.sort((a, b) => a.date.localeCompare(b.date));
      return out;
    } catch (error) {
      lastError = error;
      const wait = attempt === 1 ? 3000 : attempt * 6000;
      process.stderr.write(
        `  ${symbol} 第 ${attempt} 次失败 (${error.message})，${wait}ms 后重试\n`
      );
      await sleep(wait);
    }
  }
  throw lastError;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const end = opts.end ?? new Date().toISOString().slice(0, 10);
  const symbols = readFileSync(opts.symbolsFile, 'utf8')
    .split(/\r?\n/)
    .map(s => s.trim().toUpperCase())
    .filter(Boolean);
  mkdirSync(opts.cache, { recursive: true });

  const all = [];
  let done = 0;
  const failures = [];
  const started = Date.now();

  for (const symbol of symbols) {
    const cacheFile = join(opts.cache, `${symbol}.json`);
    let bars;
    if (existsSync(cacheFile)) {
      bars = JSON.parse(readFileSync(cacheFile, 'utf8'));
    } else {
      try {
        bars = await fetchSymbol(symbol, opts.start, end, opts.assetclass);
        writeFileSync(cacheFile, JSON.stringify(bars));
      } catch (error) {
        failures.push({ symbol, error: error.message });
        bars = [];
      }
      await sleep(opts.delay + Math.floor(Math.random() * 250));
    }
    for (const b of bars) {
      all.push({ symbol, ...b });
    }
    done++;
    if (done % 25 === 0) {
      const elapsed = ((Date.now() - started) / 1000).toFixed(0);
      process.stderr.write(
        `进度 ${done}/${symbols.length}，失败 ${failures.length}，已用 ${elapsed}s\n`
      );
    }
  }

  all.sort((a, b) =>
    a.symbol === b.symbol ? a.date.localeCompare(b.date) : a.symbol.localeCompare(b.symbol)
  );

  const header =
    'symbol,trading_date,source,open,high,low,close,volume,adjusted_close,is_complete,missing_reason';
  const lines = all.map(
    b =>
      `${b.symbol},${b.date},nasdaq,${b.open},${b.high},${b.low},${b.close},${b.volume},${b.close},1,`
  );
  writeFileSync(opts.out, `${header}\n${lines.join('\n')}\n`);

  const bySymbol = new Map();
  for (const b of all) bySymbol.set(b.symbol, (bySymbol.get(b.symbol) ?? 0) + 1);
  const counts = [...bySymbol.values()];
  const dates = all.map(b => b.date).sort();

  process.stderr.write(
    `\n完成: ${bySymbol.size}/${symbols.length} 只有数据，${all.length} 行，` +
      `日期 ${dates[0] ?? '-'} ~ ${dates.at(-1) ?? '-'}，` +
      `最少 ${Math.min(...counts)} 根 / 最多 ${Math.max(...counts)} 根\n`
  );
  if (failures.length) {
    writeFileSync('bars-failures.json', JSON.stringify(failures, null, 2));
    process.stderr.write(
      `失败 ${failures.length} 只，已写入 bars-failures.json: ${failures
        .slice(0, 10)
        .map(f => f.symbol)
        .join(', ')}\n`
    );
  }
}

main().catch(error => {
  console.error('抓取失败:', error);
  process.exit(1);
});
