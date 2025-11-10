import { useQuery } from '@tanstack/react-query'
import { createPublicClient, http, formatEther } from 'viem'
import { config } from '../lib/config'
import { getChainById } from '../lib/chains'

/**
 * Hook to fetch wallet balance
 */
export function useWalletBalance(address: string | undefined) {
  return useQuery({
    queryKey: ['walletBalance', address],
    queryFn: async () => {
      if (!address) return null

      const chain = getChainById(config.chain.id)
      const client = createPublicClient({
        chain,
        transport: http(config.rpc.url || undefined),
      })

      const balance = await client.getBalance({
        address: address as `0x${string}`,
      })

      return formatEther(balance)
    },
    enabled: !!address,
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 60, // Refetch every minute
  })
}
