import { TIER_DISTRIBUTION, hashLeaf } from '@pck/shared'
import { concatHex, keccak256 } from 'viem'

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

function buildMerkleLayers(leaves: `0x${string}`[]): `0x${string}`[][] {
  const layers: `0x${string}`[][] = [leaves]

  while (layers[layers.length - 1].length > 1) {
    const previousLayer = layers[layers.length - 1]
    const nextLayer: `0x${string}`[] = []

    for (let i = 0; i < previousLayer.length; i += 2) {
      const left = previousLayer[i]
      const right = previousLayer[i + 1] ?? left
      const [a, b] = [left, right].sort() as [`0x${string}`, `0x${string}`]
      nextLayer.push(keccak256(concatHex([a, b])))
    }

    layers.push(nextLayer)
  }

  return layers
}

function getProof(layers: `0x${string}`[][], index: number): `0x${string}`[] {
  const proof: `0x${string}`[] = []

  for (let level = 0; level < layers.length - 1; level++) {
    const layer = layers[level]
    const isRightNode = index % 2 === 1
    const pairIndex = isRightNode ? index - 1 : index + 1
    const sibling = layer[pairIndex]
    if (sibling) {
      proof.push(sibling)
    }
    index = Math.floor(index / 2)
  }

  return proof
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

  const leaves = cells.map((cell) => hashLeaf(cell.cellId, cell.tier, cell.salt) as `0x${string}`)
  const layers = buildMerkleLayers(leaves)
  const merkleRoot = layers[layers.length - 1][0]
  const proofs: Record<number, string[]> = {}

  cells.forEach((cell) => {
    proofs[cell.cellId] = getProof(layers, cell.cellId)
  })

  return {
    boardId: 'mock-board-' + Date.now(),
    prizeLayout: cells,
    merkleRoot,
    proofs,
  }
}
