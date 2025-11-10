// Merkle utility tests
import { describe, it, expect } from 'vitest';
import { hashLeaf } from './merkle';

describe('hashLeaf', () => {
  it('should return a hex string starting with 0x', () => {
    const result = hashLeaf(0, 1, '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');

    expect(result).toMatch(/^0x[0-9a-f]{64}$/);
  });

  it('should produce consistent hash for same inputs', () => {
    const salt = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    const hash1 = hashLeaf(5, 3, salt);
    const hash2 = hashLeaf(5, 3, salt);

    expect(hash1).toBe(hash2);
  });

  it('should produce different hashes for different cellIds', () => {
    const salt = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    const hash1 = hashLeaf(0, 1, salt);
    const hash2 = hashLeaf(1, 1, salt);

    expect(hash1).not.toBe(hash2);
  });

  it('should produce different hashes for different tiers', () => {
    const salt = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    const hash1 = hashLeaf(0, 1, salt);
    const hash2 = hashLeaf(0, 2, salt);

    expect(hash1).not.toBe(hash2);
  });

  it('should produce different hashes for different salts', () => {
    const salt1 = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    const salt2 = '0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321';
    const hash1 = hashLeaf(0, 1, salt1);
    const hash2 = hashLeaf(0, 1, salt2);

    expect(hash1).not.toBe(hash2);
  });
});
