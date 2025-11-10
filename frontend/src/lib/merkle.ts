import { hashLeaf, verifyMerkleProof } from '@pck/shared'

interface ClientProofParams {
  cellId: number
  tier: number
  salt: string
  merkleProof: string[]
  merkleRoot: string
}

/**
 * Client-side Merkle proof verification.
 * Used before spending gas on claim transactions.
 */
export function verifyCellProof({
  cellId,
  tier,
  salt,
  merkleProof,
  merkleRoot,
}: ClientProofParams): boolean {
  const leaf = hashLeaf(cellId, tier, salt)
  return verifyMerkleProof(leaf as `0x${string}`, merkleProof, merkleRoot as `0x${string}`)
}
