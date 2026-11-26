import { describe, it, expect } from 'vitest';
import type { Candle } from '../src/types.js';
import {
  checkBullOrBearRecently,
  detectBullOrBear,
} from '../src/analysis/basic/candle/BullOrBearDetector.js';

const t0 = new Date('2024-01-01T00:00:00Z').getTime();

type Ohlc = [number, number, number, number];

/** 小幅下跌的前置K线，后接三根长阳线（红三兵） */
function withThreeWhiteSoldiers(trailing: Ohlc[] = []): Candle[] {
  const bars: Ohlc[] = [];
  for (let i = 0; i < 10; i++) {
    const o = 110 - i;
    bars.push([o, o + 0.3, o - 1.3, o - 1]);
  }
  bars.push([100, 104.2, 99.8, 104]);
  bars.push([102, 106.6, 101.8, 106.5]);
  bars.push([104.5, 109.1, 104.3, 109]);
  bars.push(...trailing);
  return bars.map(([open, high, low, close], i) => ({
    symbol: 'T',
    open,
    high,
    low,
    close,
    volume: 1000,
    timestamp: new Date(t0 + i * 86400000),
  }));
}

const names = (c: Candle[], idx: number) =>
  detectBullOrBear(c)
    .bullishPatterns.filter(
      p => p.date.getTime() === c[idx].timestamp.getTime()
    )
    .flatMap(p => p.patternNames);

describe('detectBullOrBear', () => {
  it('finds three white soldiers in the middle of the series', () => {
    const candles = withThreeWhiteSoldiers([
      [109, 109.5, 108.5, 109.2],
      [109.2, 109.6, 108.8, 109],
      [109, 109.4, 108.6, 109.1],
    ]);
    expect(names(candles, 12)).toContain('三只白兵');
  });

  it('finds three white soldiers on the latest bars', () => {
    const candles = withThreeWhiteSoldiers();
    expect(names(candles, candles.length - 1)).toContain('三只白兵');
  });
});

describe('checkBullOrBearRecently', () => {
  it('measures "recent" from the last candle, not the wall clock', () => {
    // K线日期在 2024 年，与运行测试的日期无关
    const candles = withThreeWhiteSoldiers();
    const last = candles[candles.length - 1].timestamp.getTime();

    const res = checkBullOrBearRecently(candles, 5, 0);

    expect(res.bullishPatternsDetails.map(p => p.date.getTime())).toContain(
      last
    );
  });

  it('drops patterns older than the look-back window', () => {
    const candles = withThreeWhiteSoldiers();
    const last = candles[candles.length - 1].timestamp.getTime();
    const cutoff = last - 5 * 86400000;

    const res = checkBullOrBearRecently(candles, 5, 0);

    for (const p of [
      ...res.bullishPatternsDetails,
      ...res.bearishPatternsDetails,
    ]) {
      expect(p.date.getTime()).toBeGreaterThanOrEqual(cutoff);
    }
  });
});

describe('downside tasuki gap', () => {
  /** 两根阴线向下跳空，第三根阳线收在缺口内、没有回补缺口 */
  function tasukiGap(): Candle[] {
    const bars: Ohlc[] = [];
    for (let i = 0; i < 6; i++) {
      const o = 120 - i;
      bars.push([o, o + 0.3, o - 1.3, o - 1]);
    }
    bars.push([110, 110.2, 106.8, 107]); // 阴线 1
    bars.push([105, 105.2, 101.8, 102]); // 跳空向下的阴线 2（高点 105.2 < 低点 106.8）
    bars.push([103, 106, 102.8, 105.5]); // 阳线：开在阴线 2 实体内，收在缺口内（< 107）
    return bars.map(([open, high, low, close], i) => ({
      symbol: 'T',
      open,
      high,
      low,
      close,
      volume: 1000,
      timestamp: new Date(t0 + i * 86400000),
    }));
  }

  it('is reported as a bearish continuation pattern, not a bullish one', () => {
    const candles = tasukiGap();
    const last = candles[candles.length - 1].timestamp.getTime();
    const res = detectBullOrBear(candles);
    const at = (list: typeof res.bullishPatterns) =>
      list.filter(p => p.date.getTime() === last).flatMap(p => p.patternNames);

    expect(at(res.bearishPatterns)).toContain('下降跳空并列线');
    expect(at(res.bullishPatterns)).not.toContain('下降跳空缺口');
  });
});
