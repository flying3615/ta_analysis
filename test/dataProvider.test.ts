import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/util/util.js', async importOriginal => {
  const orig = await importOriginal<typeof import('../src/util/util.js')>();
  return { ...orig, getStockDataForTimeframe: vi.fn(async () => []) };
});

import { getStockDataForTimeframe } from '../src/util/util.js';
import { DataProvider } from '../src/data/DataProvider.js';
import { BinanceProvider } from '../src/analysis/integration/BinanceProvider.js';
import { DEFAULT_INTEGRATION_CONFIG } from '../src/analysis/integration/IntegrationConfig.js';

const fetchMock = vi.mocked(getStockDataForTimeframe);

describe('DataProvider cache', () => {
  beforeEach(() => {
    fetchMock.mockClear();
  });

  it('reuses data for the same symbol and day range', async () => {
    const provider = new DataProvider();
    const start = new Date('2024-01-01T10:00:00.000Z');

    await provider.getCachedStockData(
      'T',
      start,
      new Date('2024-06-01T10:00:00.000Z'),
      'daily'
    );
    await provider.getCachedStockData(
      'T',
      new Date(start.getTime() + 5),
      new Date('2024-06-01T10:00:00.007Z'),
      'daily'
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('fetches again for a different timeframe', async () => {
    const provider = new DataProvider();
    const start = new Date('2024-01-01T10:00:00.000Z');
    const end = new Date('2024-06-01T10:00:00.000Z');

    await provider.getCachedStockData('T', start, end, 'daily');
    await provider.getCachedStockData('T', start, end, 'weekly');

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('fetches again once the cached entry expires', async () => {
    vi.useFakeTimers();
    try {
      const provider = new DataProvider();
      const start = new Date('2024-01-01T10:00:00.000Z');
      const end = new Date('2024-06-01T10:00:00.000Z');

      await provider.getCachedStockData('T', start, end, '1hour');
      vi.advanceTimersByTime(60 * 60 * 1000);
      await provider.getCachedStockData('T', start, end, '1hour');

      expect(fetchMock).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('DataProvider.getMultiTimeframeData', () => {
  const config = DEFAULT_INTEGRATION_CONFIG;
  const bar = {
    symbol: 'T',
    open: 1,
    high: 1,
    low: 1,
    close: 1,
    volume: 1,
    timestamp: new Date('2024-01-02'),
  };

  beforeEach(() => {
    fetchMock.mockReset();
  });

  it('returns empty hourly data when only the hourly fetch fails', async () => {
    fetchMock.mockImplementation(async (_s, _a, _b, tf) => {
      if (tf === '1hour') throw new Error('hourly unavailable');
      return [bar];
    });

    const res = await new DataProvider().getMultiTimeframeData('T', config);

    expect(res.dailyData).toHaveLength(1);
    expect(res.weeklyData).toHaveLength(1);
    expect(res.hourlyData).toEqual([]);
  });

  it('rejects when the daily fetch fails', async () => {
    fetchMock.mockImplementation(async (_s, _a, _b, tf) => {
      if (tf === 'daily') throw new Error('daily unavailable');
      return [bar];
    });

    await expect(
      new DataProvider().getMultiTimeframeData('T', config)
    ).rejects.toThrow(/daily unavailable/);
  });
});

describe('DataProvider symbol routing', () => {
  const config = DEFAULT_INTEGRATION_CONFIG;

  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue([]);
    vi.restoreAllMocks();
  });

  const spyKlines = () =>
    vi.spyOn(BinanceProvider.prototype, 'getKlines').mockResolvedValue([]);

  it.each(['BTC-USD', 'BTCUSD', 'BTCUSDT', 'btc/usdt'])(
    'sends crypto symbol %s to Binance as BTCUSDT',
    async symbol => {
      const klines = spyKlines();

      await new DataProvider().getMultiTimeframeData(symbol, config);

      expect(klines).toHaveBeenCalled();
      expect(new Set(klines.mock.calls.map(c => c[0]))).toEqual(
        new Set(['BTCUSDT'])
      );
      expect(fetchMock).not.toHaveBeenCalled();
    }
  );

  it('sends the crypto entry point to Binance too', async () => {
    const klines = spyKlines();

    await new DataProvider().getMultiTimeframeCryptoData('BTC-USD', config);

    expect(new Set(klines.mock.calls.map(c => c[0]))).toEqual(
      new Set(['BTCUSDT'])
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sends stock symbols to Yahoo', async () => {
    const klines = spyKlines();

    await new DataProvider().getMultiTimeframeData('AAPL', config);

    expect(klines).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
