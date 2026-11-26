import { describe, it, expect, vi } from 'vitest';
import type { Candle } from '../src/types.js';
import { analyzeMultiTimeBBSR } from '../src/analysis/analyzer/sr/multiTimeFrameBBSRAnalysis.js';
import { IntegratedOrchestrator } from '../src/analysis/integration/IntegratedOrchestrator.js';
import { aggregateDailyToWeekly } from '../src/util/util.js';

// 透传真实实现，只记录调用参数
vi.mock(
  '../src/analysis/analyzer/sr/multiTimeFrameBBSRAnalysis.js',
  async importOriginal => {
    const orig =
      await importOriginal<
        typeof import('../src/analysis/analyzer/sr/multiTimeFrameBBSRAnalysis.js')
      >();
    return { analyzeMultiTimeBBSR: vi.fn(orig.analyzeMultiTimeBBSR) };
  }
);

function makeCandles(n: number, stepMs: number): Candle[] {
  const out: Candle[] = [];
  const t0 = new Date('2023-01-02T00:00:00Z').getTime();
  let price = 100;
  for (let i = 0; i < n; i++) {
    price += 0.3 + Math.sin(i / 3) * 1.2;
    out.push({
      symbol: 'T',
      open: price - 0.5,
      high: price + 1.5,
      low: price - 1.5,
      close: price + 0.5,
      volume: 1_000_000,
      timestamp: new Date(t0 + i * stepMs),
    });
  }
  return out;
}

describe('IntegratedOrchestrator wiring', () => {
  it('passes daily and weekly candles to the BBSR analyzer', async () => {
    const daily = makeCandles(260, 86400000);
    const weekly = aggregateDailyToWeekly(daily);
    const hourly = makeCandles(200, 3600000);

    await new IntegratedOrchestrator().executeOfflineAnalysis(
      'T',
      daily,
      weekly,
      hourly
    );

    const spy = vi.mocked(analyzeMultiTimeBBSR);
    expect(spy).toHaveBeenCalledTimes(1);
    const [, dailyArg, weeklyArg] = spy.mock.calls[0];
    expect(dailyArg).toBe(daily);
    expect(weeklyArg).toBe(weekly);
  });
});
