import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { createPublicClient, createWalletClient, custom, http } from 'viem'
import { api } from '../lib/api'
import type { PullRequest } from '@pck/shared'
import { config } from '../lib/config'
import { getChainById } from '../lib/chains'
import { gachaGameAbi } from '../data/gachaGameAbi'
import { buildBuyTicketCall, buildClaimPrizeCall } from '../lib/transactions'

type StartSessionResult = {
  merkleRoot: string
  sessionId: number
  txHash: `0x${string}`
}

type TicketPurchaseRecord = {
  sessionId: number
  txHash: `0x${string}`
}

type ClaimPrizeResult = {
  prizeId: string
  txHash: `0x${string}`
}

export type TransactionStage =
  | 'submitting'
  | 'awaiting_confirmation'
  | 'verifying'
  | 'success'

type TransactionProgressOptions = {
  onProgress?: (stage: TransactionStage) => void
}

export const gameKeys = {
  all: ['game'] as const,
  board: () => [...gameKeys.all, 'board'] as const,
  userState: () => [...gameKeys.all, 'userState'] as const,
  prizes: () => [...gameKeys.all, 'prizes'] as const,
  ticketPurchase: () => [...gameKeys.all, 'ticketPurchase'] as const,
}

export function useGameBoard() {
  return useQuery({
    queryKey: gameKeys.board(),
    queryFn: api.game.getBoard,
  })
}

export function useUserState() {
  return useQuery({
    queryKey: gameKeys.userState(),
    queryFn: api.game.getUserState,
  })
}

export function usePrizes(enabled = true) {
  return useQuery({
    queryKey: gameKeys.prizes(),
    queryFn: api.game.getPrizes,
    enabled,
  })
}

export function useTicketPurchaseInfo() {
  return useQuery<TicketPurchaseRecord | null>({
    queryKey: gameKeys.ticketPurchase(),
    queryFn: async () => null,
    staleTime: Infinity,
    gcTime: Infinity,
    initialData: null,
  })
}

export function usePull() {
  const queryClient = useQueryClient()
  const { getAccessToken } = usePrivy()

  return useMutation({
    mutationFn: async (data: PullRequest) => {
      const accessToken = await getAccessToken()
      if (!accessToken) {
        throw new Error('Please log in before revealing cells')
      }
      return api.game.pull(data, { accessToken })
    },
    onSuccess: () => {
      // Invalidate and refetch board and user state
      queryClient.invalidateQueries({ queryKey: gameKeys.board() })
      queryClient.invalidateQueries({ queryKey: gameKeys.userState() })
    },
  })
}

export function useHint(sessionId?: number) {
  const { getAccessToken } = usePrivy()

  return useQuery({
    queryKey: [...gameKeys.all, 'hint', sessionId] as const,
    queryFn: async () => {
      if (sessionId === undefined) {
        throw new Error('No active game session found. Please start a new game.')
      }
      const accessToken = await getAccessToken()
      if (!accessToken) {
        throw new Error('Please log in before requesting hints')
      }
      return api.game.getHint(sessionId, { accessToken })
    },
    enabled: false, // Only fetch when manually triggered
  })
}

export function useStartSession() {
  const queryClient = useQueryClient()
  const { wallets } = useWallets()
  const { getAccessToken } = usePrivy()

  return useMutation<StartSessionResult, Error, TransactionProgressOptions>({
    mutationFn: async (options) => {
      const wallet = wallets[0]
      if (!wallet) {
        throw new Error('Connect your wallet before starting a session.')
      }

      const contractAddress = config.contract.address
      if (
        !contractAddress ||
        contractAddress === '0x0000000000000000000000000000000000000000'
      ) {
        throw new Error('Contract address is not configured.')
      }

      const chain = getChainById(config.chain.id)
      if (wallet.chainId !== `eip155:${chain.id}`) {
        await wallet.switchChain(chain.id)
      }

      const { merkleRoot, sessionId } = await api.game.startSession()

      const publicClient = createPublicClient({
        chain,
        transport: config.rpc.url ? http(config.rpc.url) : http(),
      })

      const ticketPrice = (await publicClient.readContract({
        address: contractAddress,
        abi: gachaGameAbi,
        functionName: 'ticketPrice',
      })) as bigint

      const provider = await wallet.getEthereumProvider()
      const walletClient = createWalletClient({
        account: wallet.address as `0x${string}`,
        chain,
        transport: custom(provider),
      })

      const { args } = buildBuyTicketCall({ merkleRoot, sessionId })

      options?.onProgress?.('submitting')
      const txHash = await walletClient.writeContract({
        address: contractAddress,
        abi: gachaGameAbi,
        functionName: 'buyTicket',
        args,
        value: ticketPrice,
      })

      options?.onProgress?.('awaiting_confirmation')
      await publicClient.waitForTransactionReceipt({ hash: txHash })

      const accessToken = await getAccessToken()
      if (!accessToken) {
        throw new Error('Please log in before verifying your ticket purchase.')
      }

      options?.onProgress?.('verifying')
      await api.verify.ticketPurchase({ txHash, sessionId }, { accessToken })
      options?.onProgress?.('success')

      return { merkleRoot, sessionId, txHash }
    },
    onSuccess: ({ sessionId, txHash }) => {
      queryClient.invalidateQueries({ queryKey: gameKeys.board() })
      queryClient.invalidateQueries({ queryKey: gameKeys.userState() })
      queryClient.setQueryData(gameKeys.ticketPurchase(), { sessionId, txHash })
    },
  })
}

type ClaimPrizeVariables = {
  prizeId: string
} & TransactionProgressOptions

export function useClaimPrize() {
  const queryClient = useQueryClient()
  const { wallets } = useWallets()
  const { getAccessToken } = usePrivy()

  return useMutation<ClaimPrizeResult, Error, ClaimPrizeVariables>({
    mutationFn: async ({ prizeId, onProgress }) => {
      const wallet = wallets[0]
      if (!wallet) {
        throw new Error('Connect your wallet before claiming prizes.')
      }

      const accessToken = await getAccessToken()
      if (!accessToken) {
        throw new Error('Please log in before claiming prizes.')
      }

      const proof = await api.game.getClaimProof(prizeId, { accessToken })

      const contractAddress = config.contract.address
      if (
        !contractAddress ||
        contractAddress === '0x0000000000000000000000000000000000000000'
      ) {
        throw new Error('Contract address is not configured.')
      }

      const chain = getChainById(config.chain.id)
      if (wallet.chainId !== `eip155:${chain.id}`) {
        await wallet.switchChain(chain.id)
      }

      const publicClient = createPublicClient({
        chain,
        transport: config.rpc.url ? http(config.rpc.url) : http(),
      })

      const provider = await wallet.getEthereumProvider()
      const walletClient = createWalletClient({
        account: wallet.address as `0x${string}`,
        chain,
        transport: custom(provider),
      })

      const { args } = buildClaimPrizeCall({
        sessionId: proof.sessionId,
        merkleProof: proof.merkleProof,
        prizeId: proof.prizeId,
        prizeTier: proof.prizeTier,
        cellId: proof.cellId,
        salt: proof.salt,
      })

      onProgress?.('submitting')
      const txHash = await walletClient.writeContract({
        address: contractAddress,
        abi: gachaGameAbi,
        functionName: 'claimPrize',
        args,
      })

      onProgress?.('awaiting_confirmation')
      await publicClient.waitForTransactionReceipt({ hash: txHash })

      onProgress?.('verifying')
      await api.verify.prizeClaim({ txHash, prizeId }, { accessToken })

      onProgress?.('success')

      return { prizeId, txHash }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gameKeys.prizes() })
    },
  })
}
