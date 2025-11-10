import { sepolia, mainnet, polygon, arbitrum, optimism, base } from 'viem/chains'
import type { Chain } from 'viem'

/**
 * Get chain configuration by chain ID
 */
export function getChainById(chainId: number): Chain {
  const chains: Record<number, Chain> = {
    1: mainnet,
    11155111: sepolia,
    137: polygon,
    42161: arbitrum,
    10: optimism,
    8453: base,
  }

  const chain = chains[chainId]
  if (!chain) {
    console.warn(`Unknown chain ID: ${chainId}, falling back to Sepolia`)
    return sepolia
  }

  return chain
}
