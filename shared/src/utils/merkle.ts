// Merkle utility functions
import { keccak256, encodePacked } from 'viem';

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
