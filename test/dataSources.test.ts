import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('yahoo-finance2', () => ({ default: { chart: vi.fn() } }));

import yahooFinance from 'yahoo-finance2';
import { getStockData, getStockDataForTimeframe } from '../src/util/util.js';
import { BinanceProvider } from '../src/analysis/integration/BinanceProvider.js';

const chart = vi.mocked(yahooFinance.chart as any);

const quote = (date: string, close: number, volume: number | null) => ({
  date: new Date(date),
  open: close,
  high: close,
  low: close,
  close,
  volume,
});

describe('Yahoo data helpers', () => {
  beforeEach(() => {
    chart.mockReset();
  });

  it('fetches daily data once per call', async () => {
    chart.mockResolvedValue({ quotes: [quote('2024-01-02', 10, 100)] });

    await getStockDataForTimeframe(
      'T',
      new Date('2024-01-01'),
      new Date('2024-02-01'),
      'daily'
    );

    expect(chart).toHaveBeenCalledTimes(1);
  });

  it('drops quotes whose volume is null', async () => {
    chart.mockResolvedValue({
      quotes: [quote('2024-01-02', 10, 100), quote('2024-01-03', 11, null)],
    });

    const candles = await getStockData(
      'T',
      new Date('2024-01-01'),
      new Date('2024-02-01')
    );

    expect(candles.map(c => c.close)).toEqual([10]);
  });

  it('rejects when Yahoo fails instead of returning an empty list', async () => {
    chart.mockImplementation(async () => {
      throw new Error('429 Too Many Requests');
    });

    await expect(
      getStockData('T', new Date('2024-01-01'), new Date('2024-02-01'))
    ).rejects.toThrow(/T.*429/);
  });
});

describe('BinanceProvider.getKlines', () => {
  const realFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  const row = (t: number) => [t, '1', '2', '0.5', '1.5', '10'];

  it('rejects with the HTTP status when the first request fails', async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: false,
      status: 451,
      text: async () => 'restricted location',
    })) as any;

    await expect(
      new BinanceProvider().getKlines(
        'BTCUSDT',
        '1h',
        new Date('2024-01-01T00:00:00Z'),
        new Date('2024-01-02T00:00:00Z')
      )
    ).rejects.toThrow(/451/);
  });

  it('rejects instead of returning partial data when a later page fails', async () => {
    const start = Date.parse('2024-01-01T00:00:00Z');
    const fullPage = Array.from({ length: 1000 }, (_, i) =>
      row(start + i * 3600000)
    );
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => fullPage,
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: async () => 'too many requests',
      }) as any;

    await expect(
      new BinanceProvider().getKlines(
        'BTCUSDT',
        '1h',
        new Date(start),
        new Date(start + 1500 * 3600000)
      )
    ).rejects.toThrow(/429/);
  });
});
