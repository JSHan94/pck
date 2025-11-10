// Merkle utility functions
import { keccak256, encodePacked, concatHex } from 'viem';

/**
 * Hash a leaf node for Merkle tree
 * Must match Solidity: keccak256(abi.encodePacked(uint8(_cellId), uint8(_prizeTier), bytes32(_salt)))
 *
 * @param cellId - Cell ID (0-48)
 * @param tier - Prize tier (1-6)
 * @param salt - 32-byte hex string (0x...)
 * @returns Keccak256 hash as hex string
 */
export function hashLeaf(cellId: number, tier: number, salt: string): string {
  return keccak256(
    encodePacked(
      ['uint8', 'uint8', 'bytes32'],
      [cellId, tier, salt as `0x${string}`]
    )
  );
}

/**
 * Verify a Merkle proof for a given leaf/root.
 * Matches Solidity's `MerkleProof.verify` with sorted pair hashing.
 */
export function verifyMerkleProof(
  leaf: `0x${string}`,
  proof: string[],
  root: `0x${string}`,
): boolean {
  let computedHash = leaf.toLowerCase() as `0x${string}`;

  for (const proofElement of proof) {
    const sibling = proofElement.toLowerCase() as `0x${string}`;
    const pair = [computedHash, sibling].sort() as [`0x${string}`, `0x${string}`];
    computedHash = keccak256(concatHex(pair));
  }

  return computedHash === root.toLowerCase();
}
