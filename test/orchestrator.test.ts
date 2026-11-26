import { describe, it, expect } from 'vitest';
import type { Candle } from '../src/types.js';
import { IntegratedOrchestrator } from '../src/analysis/integration/IntegratedOrchestrator.js';
import { multiTimeFrameChipDistAnalysis } from '../src/analysis/analyzer/chip/multiTimeFrameChipDistributionAnalysis.js';
import { aggregateDailyToWeekly } from '../src/util/util.js';

/** 生成带轻微波动的上升趋势日线 */
function makeDaily(n: number): Candle[] {
  const out: Candle[] = [];
  const t0 = new Date('2023-01-02T00:00:00Z').getTime();
  let price = 100;
  for (let i = 0; i < n; i++) {
    price += 0.3 + Math.sin(i / 3) * 1.2;
    const open = price - 0.5;
    const close = price + 0.5;
    out.push({
      symbol: 'T',
      open,
      high: close + 1,
      low: open - 1,
      close,
      volume: 1_000_000 + (i % 7) * 50_000,
      timestamp: new Date(t0 + i * 86400000),
    });
  }
  return out;
}

describe('IntegratedOrchestrator offline analysis', () => {
  it('uses the latest daily close when hourly data is empty', async () => {
    const daily = makeDaily(260);
    const weekly = aggregateDailyToWeekly(daily);
    const orchestrator = new IntegratedOrchestrator();

    const res = await orchestrator.executeOfflineAnalysis(
      'T',
      daily,
      weekly,
      []
    );

    const lastClose = daily[daily.length - 1].close;
    expect(res.tradePlan.currentPrice).toBeCloseTo(lastClose, 8);
  });
});

describe('multiTimeFrameChipDistAnalysis', () => {
  it('skips a timeframe that has no candles', () => {
    const daily = makeDaily(260);
    const weekly = aggregateDailyToWeekly(daily);

    const res = multiTimeFrameChipDistAnalysis(
      'T',
      'daily',
      ['weekly', 'daily', '1hour'],
      { weekly: 0.3, daily: 0.5, '1hour': 0.2 },
      weekly,
      daily,
      []
    );

    expect(res.currentPrice).toBeCloseTo(daily[daily.length - 1].close, 8);
    expect(res.timeframes.map(t => t.timeframe)).toEqual(['weekly', 'daily']);
  });
});
