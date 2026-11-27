import { describe, it, expect } from 'vitest';
import { parseCliArgs, runBacktestCli } from '../src/analysis/backtest/cli.js';

describe('parseCliArgs', () => {
  it('applies defaults', () => {
    expect(parseCliArgs(['--data', 'bars.csv'])).toEqual({
      data: 'bars.csv',
      strategy: 'donchian',
      longOnly: false,
      commission: 0,
      slippageBps: 5,
      riskAtr: 2,
      adjust: false,
    });
  });

  it('reads every option', () => {
    const o = parseCliArgs([
      '--data',
      'b.json',
      '--strategy',
      'donchian-plan',
      '--long-only',
      '--commission',
      '1.5',
      '--slippage-bps',
      '10',
      '--risk-atr',
      '3',
      '--split-date',
      '2023-01-01',
      '--adjust',
      '--symbols',
      'aapl, MSFT',
      '--out',
      'trades.csv',
    ]);
    expect(o).toMatchObject({
      data: 'b.json',
      strategy: 'donchian-plan',
      longOnly: true,
      commission: 1.5,
      slippageBps: 10,
      riskAtr: 3,
      splitDate: '2023-01-01',
      adjust: true,
      symbols: ['AAPL', 'MSFT'],
      out: 'trades.csv',
    });
  });

  it('rejects a missing --data, an unknown option and a bad number', () => {
    expect(() => parseCliArgs([])).toThrow(/--data/);
    expect(() => parseCliArgs(['--data', 'x', '--bogus'])).toThrow(/--bogus/);
    expect(() => parseCliArgs(['--data', 'x', '--risk-atr', 'abc'])).toThrow(
      /--risk-atr/
    );
    expect(() => parseCliArgs(['--data', 'x', '--strategy', 'nope'])).toThrow(
      /nope/
    );
  });
});

/** 一只股票：56 根平稳K线后突破上涨，再回落跌破 20 日低点 */
function csvFor(symbol: string): string[] {
  const rows: string[] = [];
  const day = (i: number) =>
    new Date(Date.UTC(2020, 0, 1) + i * 86400000).toISOString().slice(0, 10);
  const closes: number[] = new Array(56).fill(105);
  for (let k = 0; k < 10; k++) closes.push(112 + 3 * k);
  for (let k = 0; k < 25; k++) closes.push(110 - k);
  closes.forEach((c, i) => {
    const [h, l] = i < 56 ? [110, 100] : [c + 1, c - 1];
    rows.push(`${symbol},${day(i)},yahoo,${c},${h},${l},${c},1000000,,1,`);
  });
  return rows;
}

function memoryIo(files: Record<string, string>) {
  const written: Record<string, string> = {};
  return {
    written,
    io: {
      readFile: (path: string) => {
        if (!(path in files)) throw new Error(`no such file ${path}`);
        return files[path];
      },
      writeFile: (path: string, text: string) => {
        written[path] = text;
      },
    },
  };
}

const header =
  'symbol,trading_date,source,open,high,low,close,volume,adjusted_close,is_complete,missing_reason';

describe('runBacktestCli', () => {
  const csv = [header, ...csvFor('AAA'), ...csvFor('BBB')].join('\n');

  it('prints the data report and the R metrics', async () => {
    const { io } = memoryIo({ 'bars.csv': csv });
    const text = await runBacktestCli(
      ['--data', 'bars.csv', '--long-only'],
      io
    );

    expect(text).toContain('股票数: 2');
    expect(text).toContain('DonchianBreakout');
    expect(text).toMatch(/交易数\s*\|\s*2/);
    expect(text).toContain('AAA');
    expect(text).toContain('BBB');
  });

  it('writes the trades as CSV when --out is given', async () => {
    const { io, written } = memoryIo({ 'bars.csv': csv });
    await runBacktestCli(
      ['--data', 'bars.csv', '--long-only', '--out', 't.csv'],
      io
    );

    const lines = written['t.csv'].trim().split('\n');
    expect(lines[0]).toBe(
      'symbol,direction,entryDate,exitDate,holdingBars,entryPrice,exitPrice,netPnl,riskPerShare,rMultiple'
    );
    expect(lines).toHaveLength(3);
    expect(lines[1]).toMatch(/^AAA,long,2020-02-27,/);
  });

  it('limits the run to --symbols', async () => {
    const { io } = memoryIo({ 'bars.csv': csv });
    const text = await runBacktestCli(
      ['--data', 'bars.csv', '--long-only', '--symbols', 'bbb'],
      io
    );
    expect(text).toContain('股票数: 1');
    expect(text).not.toMatch(/^\|\s*AAA/m);
  });

  it('reports in-sample and out-of-sample results with --split-date', async () => {
    const { io } = memoryIo({ 'bars.csv': csv });
    const text = await runBacktestCli(
      ['--data', 'bars.csv', '--long-only', '--split-date', '2020-03-01'],
      io
    );
    expect(text).toContain('样本内');
    expect(text).toContain('样本外');
  });
});
