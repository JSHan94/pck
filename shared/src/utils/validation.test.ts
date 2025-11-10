// Validation utility tests
import { describe, it, expect } from 'vitest';
import { isValidTier, isValidCellId } from './validation';

describe('isValidTier', () => {
  it('should return true for valid tiers (1-6)', () => {
    expect(isValidTier(1)).toBe(true);
    expect(isValidTier(2)).toBe(true);
    expect(isValidTier(3)).toBe(true);
    expect(isValidTier(4)).toBe(true);
    expect(isValidTier(5)).toBe(true);
    expect(isValidTier(6)).toBe(true);
  });

  it('should return false for tier below 1', () => {
    expect(isValidTier(0)).toBe(false);
    expect(isValidTier(-1)).toBe(false);
  });

  it('should return false for tier above 6', () => {
    expect(isValidTier(7)).toBe(false);
    expect(isValidTier(100)).toBe(false);
  });
});

describe('isValidCellId', () => {
  it('should return true for valid cellIds (0-48)', () => {
    expect(isValidCellId(0)).toBe(true);
    expect(isValidCellId(24)).toBe(true);
    expect(isValidCellId(48)).toBe(true);
  });

  it('should return false for cellId below 0', () => {
    expect(isValidCellId(-1)).toBe(false);
    expect(isValidCellId(-10)).toBe(false);
  });

  it('should return false for cellId above 48', () => {
    expect(isValidCellId(49)).toBe(false);
    expect(isValidCellId(100)).toBe(false);
  });
});
