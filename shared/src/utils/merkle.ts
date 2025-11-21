// Merkle utility functions
import { keccak256, encodePacked, concatHex } from 'viem';
import type { Cell } from '../types/database.ts';

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

type Hex = `0x${string}`;

function buildMerkleLayers(leaves: Hex[]): Hex[][] {
  if (leaves.length === 0) {
    throw new Error('EMPTY_LEAVES');
  }

  const layers: Hex[][] = [leaves];
  while (layers[layers.length - 1].length > 1) {
    const previous = layers[layers.length - 1];
    const nextLayer: Hex[] = [];

    for (let i = 0; i < previous.length; i += 2) {
      const left = previous[i];
      const right = previous[i + 1] ?? left;
      const [a, b] = [left, right].sort() as [Hex, Hex];
      nextLayer.push(keccak256(concatHex([a, b])) as Hex);
    }

    layers.push(nextLayer);
  }

  return layers;
}

function buildProof(layers: Hex[][], index: number): Hex[] {
  const proof: Hex[] = [];
  let currentIndex = index;

  for (let level = 0; level < layers.length - 1; level++) {
    const layer = layers[level];
    const isRightNode = currentIndex % 2 === 1;
    const pairIndex = isRightNode ? currentIndex - 1 : currentIndex + 1;
    const sibling = layer[pairIndex];
    if (sibling) {
      proof.push(sibling);
    }
    currentIndex = Math.floor(currentIndex / 2);
  }

  return proof;
}

/**
 * Generate a Merkle proof for a given cell ID.
 * Cells must include `cellId`, `tier`, and `salt`.
 */
export function generateMerkleProof(
  cells: Cell[],
  targetCellId: number,
): { proof: Hex[]; root: Hex } {
  if (!Array.isArray(cells) || cells.length === 0) {
    throw new Error('NO_CELLS');
  }

  const sortedCells = [...cells].sort((a, b) => a.cellId - b.cellId);
  const targetIndex = sortedCells.findIndex((cell) => cell.cellId === targetCellId);
  if (targetIndex === -1) {
    throw new Error('CELL_NOT_FOUND');
  }

  const leaves = sortedCells.map((cell) => hashLeaf(cell.cellId, cell.tier, cell.salt) as Hex);
  const layers = buildMerkleLayers(leaves);
  const proof = buildProof(layers, targetIndex);
  const root = layers[layers.length - 1][0];

  return { proof, root };
}
