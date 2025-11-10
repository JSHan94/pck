import { TIER_DISTRIBUTION, hashLeaf } from '@pck/shared'
import { MerkleTree } from 'merkletreejs'
import { keccak256 } from 'viem'
import { Buffer } from 'buffer'

interface Cell {
  cellId: number
  tier: number
  salt: string
}

interface Board {
  boardId: string
  prizeLayout: Cell[]
  merkleRoot: string
  proofs: Record<number, string[]>
}

/**
 * Generate random hex string for salt (browser-compatible)
 */
function generateSalt(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return '0x' + Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Convert hex string to Uint8Array (browser-compatible)
 */
function hexToUint8Array(hex: string): Uint8Array {
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex
  const bytes = new Uint8Array(cleanHex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleanHex.slice(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

/**
 * Convert Uint8Array to hex string (browser-compatible)
 */
function uint8ArrayToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Create a mock board with tier distribution and merkle root
 * Ports backend B3 createBoard logic
 */
export function createBoard(): Board {
  // Generate cells based on tier distribution
  const cells: Cell[] = []
  let cellId = 0

  for (const [tier, count] of Object.entries(TIER_DISTRIBUTION)) {
    for (let i = 0; i < count; i++) {
      cells.push({
        cellId: cellId++,
        tier: Number(tier),
        salt: generateSalt(),
      })
    }
  }

  // Shuffle cells using Fisher-Yates algorithm
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[cells[i], cells[j]] = [cells[j], cells[i]]
  }

  // Reassign cellIds after shuffle to maintain 0-48 order
  cells.forEach((cell, index) => {
    cell.cellId = index
  })

  // Create merkle tree
  const leaves = cells.map((cell) => {
    const hash = hashLeaf(cell.cellId, cell.tier, cell.salt)
    return Buffer.from(hexToUint8Array(hash))
  })

  const hashFn = (data: Buffer): Buffer => {
    const hash = keccak256(new Uint8Array(data))
    return Buffer.from(hexToUint8Array(hash))
  }

  const tree = new MerkleTree(leaves, hashFn, { sortPairs: true })
  const merkleRoot = '0x' + uint8ArrayToHex(tree.getRoot())
  const proofs: Record<number, string[]> = {}

  cells.forEach((cell, index) => {
    const proofNodes = tree.getProof(leaves[index], index)
    proofs[cell.cellId] = proofNodes.map((node) => '0x' + node.data.toString('hex'))
  })

  return {
    boardId: 'mock-board-' + Date.now(),
    prizeLayout: cells,
    merkleRoot,
    proofs,
  }
}
