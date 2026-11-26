import { describe, it, expect } from 'vitest';
import { calculateBullBearRatio } from '../src/util/chipUtils.js';
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
