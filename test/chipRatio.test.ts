import { describe, it, expect } from 'vitest';
import {
  calculateBullBearRatio,
  identifyChipPeaks,
  identifyKeyPriceLevels,
} from '../src/util/chipUtils.js';
import { chipConfig } from '../src/analysis/analyzer/chip/chipConfig.js';

/** 当前价 100，低价筹码在 90，高价筹码在 110（两侧距离相同） */
function split(below: number, above: number) {
  return [
    { price: 90, weight: below, percentage: below },
    { price: 110, weight: above, percentage: above },
  ];
}

describe('calculateBullBearRatio', () => {
  it('is neutral (1) when both sides hold the same chips', () => {
    expect(calculateBullBearRatio(split(50, 50), 100)).toBeCloseTo(1, 8);
  });

  it('reaches the strong-bull threshold when low-price chips dominate 4:1', () => {
    const ratio = calculateBullBearRatio(split(80, 20), 100);
    expect(ratio).toBeGreaterThan(chipConfig.buy.bullBear.strongBullRatio);
  });

  it('falls below the strong-bear threshold when high-price chips dominate 1:4', () => {
    const ratio = calculateBullBearRatio(split(20, 80), 100);
    expect(ratio).toBeLessThan(chipConfig.buy.bullBear.strongBearRatio);
  });

  it('never exceeds 10', () => {
    expect(calculateBullBearRatio(split(99.9, 0.1), 100)).toBeLessThanOrEqual(
      10
    );
  });
});

describe('identifyKeyPriceLevels', () => {
  it('merges nearby levels even when another level sits between them by density', () => {
    // 当前价 150。99/100/101 彼此相距 1（< 1.5 的合并容差），120 远离它们
    const dist = [
      // 局部密度：100 → 25，120 → 20，101 → 19，99 → 18
      // 按密度排序时 120 夹在 100 和 101 之间
      { price: 99, weight: 6, percentage: 6 },
      { price: 100, weight: 12, percentage: 12 },
      { price: 101, weight: 7, percentage: 7 },
      { price: 120, weight: 20, percentage: 20 },
    ];

    const res = identifyKeyPriceLevels(dist, 150, 0);
    const supports = [...res.strongSupports, ...res.moderateSupports].sort(
      (a, b) => a - b
    );

    expect(supports).toEqual([100, 120]);
  });
});

describe('identifyChipPeaks', () => {
  it('finds a peak in the highest price bin', () => {
    const dist = Array.from({ length: 30 }, (_, i) => {
      const pct = i === 29 ? 20 : 1 + (i % 3) * 0.1;
      return { price: 90 + i, weight: pct, percentage: pct };
    });

    const peaks = identifyChipPeaks(dist, 100);

    expect(peaks.map(p => p.price)).toContain(119);
  });

  it('finds a peak in the lowest price bin', () => {
    const dist = Array.from({ length: 30 }, (_, i) => {
      const pct = i === 0 ? 20 : 1 + (i % 3) * 0.1;
      return { price: 90 + i, weight: pct, percentage: pct };
    });

    const peaks = identifyChipPeaks(dist, 100);

    expect(peaks.map(p => p.price)).toContain(90);
  });
});
