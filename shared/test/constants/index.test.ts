import { describe, it, expect } from 'vitest';
import { TIER_DISTRIBUTION, GRID_SIZE, TOTAL_CELLS, HINT_INTERVAL } from '../../src/constants/index.js';

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

  describe('GRID_SIZE', () => {
    it('should be defined', () => {
      expect(GRID_SIZE).toBeDefined();
    });

    it('should be 7', () => {
      expect(GRID_SIZE).toBe(7);
    });

    it('should be a number', () => {
      expect(typeof GRID_SIZE).toBe('number');
    });
  });

  describe('TOTAL_CELLS', () => {
    it('should be defined', () => {
      expect(TOTAL_CELLS).toBeDefined();
    });

    it('should be 49', () => {
      expect(TOTAL_CELLS).toBe(49);
    });

    it('should be a number', () => {
      expect(typeof TOTAL_CELLS).toBe('number');
    });

    it('should equal GRID_SIZE squared', () => {
      expect(TOTAL_CELLS).toBe(GRID_SIZE * GRID_SIZE);
    });

    it('should match TIER_DISTRIBUTION total', () => {
      const distributionTotal = Object.values(TIER_DISTRIBUTION).reduce((sum, count) => sum + count, 0);
      expect(TOTAL_CELLS).toBe(distributionTotal);
    });
  });

  describe('HINT_INTERVAL', () => {
    it('should be defined', () => {
      expect(HINT_INTERVAL).toBeDefined();
    });

    it('should be 3', () => {
      expect(HINT_INTERVAL).toBe(3);
    });

    it('should be a number', () => {
      expect(typeof HINT_INTERVAL).toBe('number');
    });

    it('should be positive', () => {
      expect(HINT_INTERVAL).toBeGreaterThan(0);
    });
  });
});
