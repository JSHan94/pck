import { TIER_DISTRIBUTION, hashLeaf } from '@pck/shared'
import { keccak256, concatHex, Hex } from 'npm:viem'

type Cell = {
  cellId: number
  tier: number
  salt: Hex
}

type CreateBoardResult = {
  prizeLayout: Cell[]
  merkleRoot: Hex
}

function generateSalt(): Hex {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return ('0x' + Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')) as Hex
}

function shuffle<T>(items: T[]): void {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[items[i], items[j]] = [items[j], items[i]]
  }
}

function buildMerkleRoot(leaves: Hex[]): Hex {
  if (leaves.length === 0) {
    throw new Error('No leaves provided')
  }

  let layer = [...leaves]
  while (layer.length > 1) {
    const nextLayer: Hex[] = []
    for (let i = 0; i < layer.length; i += 2) {
      const left = layer[i]
      const right = layer[i + 1] ?? left
      const [a, b] = [left, right].sort()
      nextLayer.push(keccak256(concatHex([a, b])))
    }
    layer = nextLayer
  }
  return layer[0]
}

export function createBoard(): CreateBoardResult {
  const cells: Cell[] = []
  let currentId = 0

  for (const [tier, count] of Object.entries(TIER_DISTRIBUTION)) {
    for (let i = 0; i < count; i++) {
      cells.push({
        cellId: currentId++,
        tier: Number(tier),
        salt: generateSalt(),
      })
    }
  }

  shuffle(cells)
  cells.forEach((cell, index) => {
    cell.cellId = index
  })

  const leaves = cells.map((cell) => hashLeaf(cell.cellId, cell.tier, cell.salt) as Hex)
  const merkleRoot = buildMerkleRoot(leaves)

  return {
    prizeLayout: cells,
    merkleRoot,
  }
}
