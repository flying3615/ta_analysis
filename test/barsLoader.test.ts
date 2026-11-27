import { describe, it, expect } from 'vitest';
import {
  buildCandles,
  parseBars,
} from '../src/analysis/backtest/barsLoader.js';

const header =
  'symbol,trading_date,source,open,high,low,close,volume,adjusted_close,is_complete,missing_reason';

describe('parseBars', () => {
  it('reads sqlite3 -header -csv output', () => {
    const rows = parseBars(
      [header, 'AAPL,2024-01-02,yahoo,10,11,9,10.5,1000,10.4,1,', ''].join('\n')
    );
    expect(rows).toEqual([
      {
        symbol: 'AAPL',
        trading_date: '2024-01-02',
        source: 'yahoo',
        open: 10,
        high: 11,
        low: 9,
        close: 10.5,
        volume: 1000,
        adjusted_close: 10.4,
        is_complete: 1,
        missing_reason: null,
      },
    ]);
  });

  it('reads quoted CSV fields', () => {
    const rows = parseBars(
      [
        header,
        '"AAPL","2024-01-02","yahoo",10,11,9,10.5,1000,,1,"gap, provider"',
      ].join('\n')
    );
    expect(rows[0].adjusted_close).toBeNull();
    expect(rows[0].missing_reason).toBe('gap, provider');
  });

  it('reads sqlite3 .mode json output', () => {
    const rows = parseBars(
      JSON.stringify([
        {
          symbol: 'MSFT',
          trading_date: '2024-01-02',
          source: 'polygon',
          open: 1,
          high: 2,
          low: 0.5,
          close: 1.5,
          volume: 10,
          adjusted_close: null,
          is_complete: 1,
          missing_reason: null,
        },
      ])
    );
    expect(rows[0].symbol).toBe('MSFT');
    expect(rows[0].source).toBe('polygon');
  });
});

function row(
  symbol: string,
  date: string,
  close: number,
  extra: Partial<Record<string, unknown>> = {}
) {
  return {
    symbol,
    trading_date: date,
    source: 'yahoo',
    open: close,
    high: close + 1,
    low: close - 1,
    close,
    volume: 1000,
    adjusted_close: null,
    is_complete: 1,
    missing_reason: null,
    ...extra,
  } as any;
}

describe('buildCandles', () => {
  it('sorts by date and parses dates as UTC midnight', () => {
    const { dataBySymbol } = buildCandles([
      row('A', '2024-01-03', 11),
      row('A', '2024-01-02', 10),
    ]);
    expect(dataBySymbol.A.map(c => c.timestamp.toISOString())).toEqual([
      '2024-01-02T00:00:00.000Z',
      '2024-01-03T00:00:00.000Z',
    ]);
  });

  it('prefers Yahoo and fills only missing dates from other sources', () => {
    const { dataBySymbol, report } = buildCandles([
      row('A', '2024-01-02', 10, { source: 'polygon' }),
      row('A', '2024-01-02', 20), // yahoo 优先
      row('A', '2024-01-03', 30, { source: 'polygon' }), // 只有 polygon
    ]);
    expect(dataBySymbol.A.map(c => c.close)).toEqual([20, 30]);
    expect(report.filledFromOtherSource).toBe(1);
  });

  it('skips incomplete rows', () => {
    const { dataBySymbol, report } = buildCandles([
      row('A', '2024-01-02', 10),
      row('A', '2024-01-03', 11, { is_complete: 0 }),
      row('A', '2024-01-04', 12, { missing_reason: 'NULL_PAYLOAD_ROW' }),
    ]);
    expect(dataBySymbol.A).toHaveLength(1);
    expect(report.skippedIncomplete).toBe(2);
  });

  it('flags one-day moves larger than 30% as possible splits', () => {
    const { report } = buildCandles([
      row('A', '2024-01-02', 100),
      row('A', '2024-01-03', 50), // −50%：可能是未复权的 2:1 拆股
      row('A', '2024-01-04', 51),
    ]);
    expect(report.largeMoves).toEqual([
      { symbol: 'A', date: '2024-01-03', changePct: -50 },
    ]);
  });

  it('scales OHLC by adjusted_close / close when asked', () => {
    const { dataBySymbol } = buildCandles(
      [
        row('A', '2024-01-02', 100, {
          adjusted_close: 50,
          open: 98,
          high: 102,
          low: 96,
        }),
      ],
      { adjust: true }
    );
    const c = dataBySymbol.A[0];
    expect([c.open, c.high, c.low, c.close]).toEqual([49, 51, 48, 50]);
  });

  it('counts symbols and rows', () => {
    const { report } = buildCandles([
      row('A', '2024-01-02', 10),
      row('B', '2024-01-02', 10),
      row('B', '2024-01-03', 10),
    ]);
    expect(report.rowsRead).toBe(3);
    expect(report.symbols).toBe(2);
    expect(report.firstDate).toBe('2024-01-02');
    expect(report.lastDate).toBe('2024-01-03');
  });

  it('reports gaps of more than 7 calendar days between bars', () => {
    const { report } = buildCandles([
      row('A', '2024-01-02', 10),
      row('A', '2024-01-05', 10), // 3 天：正常（含周末也不超过 7 天）
      row('A', '2024-02-01', 10), // 27 天：缺口
    ]);
    expect(report.gaps).toEqual([
      { symbol: 'A', from: '2024-01-05', to: '2024-02-01', days: 27 },
    ]);
  });
});
