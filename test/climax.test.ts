import { describe, it, expect } from 'vitest';
import type { Candle } from '../src/types.js';
// 先导入 analyzeMultiTimeframePatterns：它与各检测器循环导入，
// 先导入检测器会让 vitest 中的 PATTERN_DETECTORS 拿到未初始化的函数
import {
  analyzeAllPatterns,
  PatternStatus,
  PatternType,
} from '../src/analysis/basic/patterns/analyzeMultiTimeframePatterns.js';
import { findSellingClimax } from '../src/analysis/basic/patterns/findSellingClimax.js';
import { patternConfig } from '../src/analysis/basic/patterns/patternConfig.js';

const t0 = Date.parse('2024-01-01T00:00:00Z');

/** 40 根缓慢下跌的K线，倒数第 3 根是放量长阴线，之后两根反弹 */
function sellingClimaxData(): Candle[] {
  const out: Candle[] = [];
  for (let i = 0; i < 40; i++) {
    const c = 100 - i * 0.1;
    out.push({
      symbol: 'T',
      open: c + 0.2,
      high: c + 0.5,
      low: c - 0.5,
      close: c,
      volume: 1000,
      timestamp: new Date(t0 + i * 86400000),
    });
  }
  out[37] = {
    ...out[37],
    open: 96.5,
    high: 96.7,
    low: 90,
    close: 91,
    volume: 6000,
  };
  out[38] = {
    ...out[38],
    open: 91,
    high: 97.5,
    low: 90.8,
    close: 97,
    volume: 2000,
  };
  out[39] = {
    ...out[39],
    open: 97,
    high: 98,
    low: 96.5,
    close: 97.8,
    volume: 1500,
  };
  return out;
}

describe('climax significance', () => {
  it('uses the same scale as other patterns: reliability × range / price', () => {
    const [climax] = findSellingClimax(sellingClimaxData(), [], 30);

    expect(climax).toBeDefined();
    const range = (96.7 - 90) / 90;
    expect(climax.significance).toBeCloseTo(climax.reliability * range, 6);
  });
});

describe('timeframe match factor', () => {
  it('scales reliability but not significance a second time', () => {
    const data = sellingClimaxData();
    const [raw] = findSellingClimax(data, [], 30);

    // 1 小时周期对短期形态的匹配系数是 1.3
    const res = analyzeAllPatterns(data, '1hour');
    const adjusted = res.patterns.find(
      p => p.patternType === PatternType.SellingClimax
    );
    expect(adjusted).toBeDefined();

    const distance = data.length - 1 - adjusted!.component.endIndex;
    let expected =
      raw.significance *
      Math.exp(-patternConfig.weights.patternDistanceDecay * distance);
    if (adjusted!.status === PatternStatus.Confirmed) {
      expected *= patternConfig.weights.confirmedBoost;
    }

    expect(adjusted!.reliability).toBeCloseTo(
      Math.min(100, raw.reliability * 1.3),
      6
    );
    expect(adjusted!.significance).toBeCloseTo(expected, 6);
  });
});
