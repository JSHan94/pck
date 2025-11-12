export interface BuyTicketParams {
  merkleRoot: string
  sessionId: number
}

export interface BuyTicketCall {
  functionName: 'buyTicket'
  args: readonly [`0x${string}`, bigint]
}

export interface ClaimPrizeParams {
  sessionId: number
  merkleProof: string[]
  prizeId: string
  prizeTier: number
  cellId: number
  salt: string
}

export interface ClaimPrizeCall {
  functionName: 'claimPrize'
  args: readonly [bigint, readonly `0x${string}`[], `0x${string}`, bigint, number, `0x${string}`]
}

const HEX_32_LENGTH = 66 // 0x + 64 hex chars
const HEX_PATTERN = /^0x[0-9a-fA-F]+$/

export function buildBuyTicketCall({ merkleRoot, sessionId }: BuyTicketParams): BuyTicketCall {
  const normalizedRoot = normalizeBytes32(merkleRoot)

  if (!Number.isInteger(sessionId) || sessionId < 0) {
    throw new Error('Session ID must be a non-negative integer')
  }

  return {
    functionName: 'buyTicket',
    args: [normalizedRoot, BigInt(sessionId)],
  }
}

export function buildClaimPrizeCall({
  sessionId,
  merkleProof,
  prizeId,
  prizeTier,
  cellId,
  salt,
}: ClaimPrizeParams): ClaimPrizeCall {
  if (!Number.isInteger(sessionId) || sessionId < 0) {
    throw new Error('Session ID must be a non-negative integer')
  }
  if (!Number.isInteger(prizeTier) || prizeTier < 0) {
    throw new Error('Prize tier must be a non-negative integer')
  }
  if (!Number.isInteger(cellId) || cellId < 0 || cellId > 255) {
    throw new Error('Cell ID must be between 0 and 255')
  }
  if (!Array.isArray(merkleProof)) {
    throw new Error('Merkle proof must be an array')
  }

  const normalizedProof = merkleProof.map((node) => normalizeBytes32(node))
  const normalizedPrizeId = normalizeBytes32(prizeId)
  const normalizedSalt = normalizeBytes32(salt)

  return {
    functionName: 'claimPrize',
    args: [
      BigInt(sessionId),
      normalizedProof,
      normalizedPrizeId,
      BigInt(prizeTier),
      cellId,
      normalizedSalt,
    ],
  }
}

export function normalizeBytes32(value: string): `0x${string}` {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Invalid merkle root: ${value}`)
  }

  const normalized = value.startsWith('0x') ? value : `0x${value}`

  if (normalized.length !== HEX_32_LENGTH || !HEX_PATTERN.test(normalized)) {
    throw new Error(`Invalid merkle root: ${value}`)
  }

  return normalized.toLowerCase() as `0x${string}`
}
