import { describe, it, expect } from 'vitest';
import { lineConvergenceIndex } from '../src/analysis/basic/patterns/findWedges.js';

describe('lineConvergenceIndex', () => {
  it('finds where two lines starting at the same index meet', () => {
    // 上沿 110 斜率 0.5，下沿 100 斜率 1：在 x = 20 相交（价格 120）
    const x = lineConvergenceIndex(
      { index: 0, price: 110 },
      0.5,
      { index: 0, price: 100 },
      1
    );
    expect(x).toBeCloseTo(20, 10);
  });

  it('handles lines anchored at different indices', () => {
    // 上沿过 (10,110) 斜率 0.5；下沿过 (15,100) 斜率 0.75 → x = 65
    const x = lineConvergenceIndex(
      { index: 10, price: 110 },
      0.5,
      { index: 15, price: 100 },
      0.75
    );
    expect(x).toBeCloseTo(65, 10);
    expect(110 + 0.5 * (x - 10)).toBeCloseTo(100 + 0.75 * (x - 15), 10);
  });

  it('returns the upper anchor index for parallel lines', () => {
    const x = lineConvergenceIndex(
      { index: 7, price: 110 },
      1,
      { index: 3, price: 100 },
      1
    );
    expect(x).toBe(7);
  });
});
