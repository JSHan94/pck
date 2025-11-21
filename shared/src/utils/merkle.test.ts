// Merkle utility tests
import { describe, it, expect } from 'vitest';
import { hashLeaf, verifyMerkleProof, generateMerkleProof } from './merkle';
import { concatHex, keccak256 } from 'viem';

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

describe('verifyMerkleProof', () => {
  const saltA = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
  const saltB = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

  const leafA = hashLeaf(0, 1, saltA) as `0x${string}`;
  const leafB = hashLeaf(1, 2, saltB) as `0x${string}`;

  const hashPair = (left: `0x${string}`, right: `0x${string}`) => {
    const [a, b] = [left, right].sort();
    return keccak256(concatHex([a, b]));
  };

  const root = hashPair(leafA, leafB);

  it('returns true for a valid proof', () => {
    const proof = [leafB];

    expect(verifyMerkleProof(leafA, proof, root)).toBe(true);
  });

  it('returns false for an invalid proof', () => {
    const invalidProof = ['0x9999999999999999999999999999999999999999999999999999999999999999' as `0x${string}`];

    expect(verifyMerkleProof(leafA, invalidProof, root)).toBe(false);
  });
});

describe('generateMerkleProof', () => {
  const cells = [
    { cellId: 0, tier: 4, salt: '0x' + 'aa'.repeat(32) },
    { cellId: 1, tier: 5, salt: '0x' + 'bb'.repeat(32) },
    { cellId: 2, tier: 6, salt: '0x' + 'cc'.repeat(32) },
    { cellId: 3, tier: 3, salt: '0x' + 'dd'.repeat(32) },
  ];

  it('creates a proof that verifies against the generated root', () => {
    const targetCell = cells[2];
    const { proof, root } = generateMerkleProof(cells, targetCell.cellId);
    const leaf = hashLeaf(targetCell.cellId, targetCell.tier, targetCell.salt) as `0x${string}`;

    expect(proof.length).toBeGreaterThan(0);
    expect(verifyMerkleProof(leaf, proof, root)).toBe(true);
  });

  it('throws when the requested cell does not exist', () => {
    expect(() => generateMerkleProof(cells, 99)).toThrow('CELL_NOT_FOUND');
  });
});
