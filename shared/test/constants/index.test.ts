import { describe, it, expect } from 'vitest';
import { TIER_DISTRIBUTION } from '../../src/constants/index.js';

describe('Constants', () => {
  describe('TIER_DISTRIBUTION', () => {
    it('should be defined', () => {
      expect(TIER_DISTRIBUTION).toBeDefined();
    });

    it('should have correct tier 1 distribution', () => {
      expect(TIER_DISTRIBUTION[1]).toBe(1);
    });

    it('should have correct tier 2 distribution', () => {
      expect(TIER_DISTRIBUTION[2]).toBe(2);
    });

    it('should have correct tier 3 distribution', () => {
      expect(TIER_DISTRIBUTION[3]).toBe(6);
    });

    it('should have correct tier 4 distribution', () => {
      expect(TIER_DISTRIBUTION[4]).toBe(10);
    });

    it('should have correct tier 5 distribution', () => {
      expect(TIER_DISTRIBUTION[5]).toBe(18);
    });

    it('should have correct tier 6 distribution', () => {
      expect(TIER_DISTRIBUTION[6]).toBe(12);
    });

    it('should have exactly 6 tiers', () => {
      const keys = Object.keys(TIER_DISTRIBUTION);
      expect(keys).toHaveLength(6);
    });

    it('should sum to 49 total cells', () => {
      const total = Object.values(TIER_DISTRIBUTION).reduce((sum, count) => sum + count, 0);
      expect(total).toBe(49);
    });
  });
});
