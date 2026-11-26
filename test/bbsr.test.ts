import { describe, it, expect } from 'vitest';
import { checkBullBearNearSupportResistance } from '../src/analysis/analyzer/sr/BullBearOnSupportResistAnalysis.js';

describe('checkBullBearNearSupportResistance', () => {
  it('returns undefined for empty data instead of throwing', () => {
    expect(checkBullBearNearSupportResistance('T', [])).toBeUndefined();
  });
});
