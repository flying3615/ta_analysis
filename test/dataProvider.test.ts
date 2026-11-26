import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/util/util.js', async importOriginal => {
  const orig = await importOriginal<typeof import('../src/util/util.js')>();
  return { ...orig, getStockDataForTimeframe: vi.fn(async () => []) };
});

import { getStockDataForTimeframe } from '../src/util/util.js';
import { DataProvider } from '../src/data/DataProvider.js';

const fetchMock = vi.mocked(getStockDataForTimeframe);

describe('DataProvider cache', () => {
  beforeEach(() => fetchMock.mockClear());

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
