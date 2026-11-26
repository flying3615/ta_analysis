import { describe, it, expect } from 'vitest';
import type { Candle } from '../src/types.js';
import { formatTradePlanOutput } from '../src/analysis/FormatTradePlan.js';
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

describe('IntegratedOrchestrator config handling', () => {
  const daily = makeDaily(260);
  const weekly = aggregateDailyToWeekly(daily);

  it('keeps the other weights after a partial updateConfig', async () => {
    const orchestrator = new IntegratedOrchestrator();
    orchestrator.updateConfig({ weights: { chip: 1 } } as any);

    const res = await orchestrator.executeOfflineAnalysis(
      'T',
      daily,
      weekly,
      []
    );

    expect(Number.isFinite(res.tradePlan.confidenceScore)).toBe(true);
  });

  it('scores with the thresholds passed in customConfig', async () => {
    const orchestrator = new IntegratedOrchestrator();
    const baseline = await orchestrator.executeOfflineAnalysis(
      'T',
      daily,
      weekly,
      []
    );
    // 前提：默认配置下这组数据给出方向性信号
    expect(baseline.tradePlan.direction).not.toBe('neutral');

    const res = await orchestrator.executeOfflineAnalysis(
      'T',
      daily,
      weekly,
      [],
      {
        thresholds: { scoreLong: 1e9, scoreShort: -1e9 },
      } as any
    );

    expect(res.tradePlan.direction).toBe('neutral');
  });
});

describe('IntegratedOrchestrator per-call options', () => {
  it('rethrows module errors when customConfig disables the fallback', async () => {
    const orchestrator = new IntegratedOrchestrator();

    await expect(
      orchestrator.executeOfflineAnalysis('T', [], [], [], {
        options: { enableFallbackStrategy: false },
      } as any)
    ).rejects.toThrow();
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

describe('trade plan analysis breakdown', () => {
  it('reports the normalized weights of all eight modules', async () => {
    const daily = makeDaily(260);
    const weekly = aggregateDailyToWeekly(daily);

    const { tradePlan: p } =
      await new IntegratedOrchestrator().executeOfflineAnalysis(
        'T',
        daily,
        weekly,
        []
      );

    const weights = [
      p.chipAnalysisWeight,
      p.patternAnalysisWeight,
      p.volumeAnalysisWeight,
      p.bbsrAnalysisWeight,
      p.structureAnalysisWeight ?? 0,
      p.supplyDemandAnalysisWeight ?? 0,
      p.rangeAnalysisWeight ?? 0,
      p.trendlineAnalysisWeight ?? 0,
    ];
    expect(weights.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
    // 默认权重合计 1.5，形态 0.5 → 约 33%
    expect(p.patternAnalysisWeight).toBeCloseTo(0.5 / 1.5, 10);

    const text = formatTradePlanOutput(p);
    expect(text).toContain('形态分析: 33%');
    expect(text).toContain('结构分析:');
    expect(text).toContain('趋势线分析:');
    // 得分带方向，例如 "看多 92.2/100" / "看空 65.0/100" / "中性"
    expect(text).toMatch(/形态分析: 33% \(((看多|看空) \d+\.\d\/100|中性)\)/);
    expect(text).not.toMatch(/得分:-/);
  });
});
