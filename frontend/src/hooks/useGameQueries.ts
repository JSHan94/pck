import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { createPublicClient, createWalletClient, custom, http } from 'viem'
import { api } from '../lib/api'
import type { PullRequest } from '@pck/shared'
import type { PrizeItem } from '../types/prize'
import { config } from '../lib/config'
import { getChainById } from '../lib/chains'
import { gachaGameAbi } from '../data/gachaGameAbi'
import { buildBuyTicketCall, buildClaimPrizeCall } from '../lib/transactions'

type StartSessionResult = {
  merkleRoot: string
  sessionId: number
  txHash?: `0x${string}`
}

export type TicketPurchaseRecord = {
  sessionId: number
  txHash?: `0x${string}`
}

type ClaimPrizeResult = {
  prizeId: string
  txHash?: `0x${string}`
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
  const { ready, authenticated } = usePrivy()
  const { wallets } = useWallets()
  const address = wallets[0]?.address?.toLowerCase()

  return useQuery({
    queryKey: [...gameKeys.board(), address] as const,
    enabled: ready && authenticated && Boolean(address),
    queryFn: async () => {
      if (!address) {
        throw new Error('Connect your wallet before viewing your board')
      }
      return api.game.getBoard({ userAddress: address })
    },
  })
}

export function useUserState() {
  const { ready, authenticated } = usePrivy()
  const { wallets } = useWallets()
  const address = wallets[0]?.address?.toLowerCase()

  return useQuery({
    queryKey: [...gameKeys.userState(), address] as const,
    enabled: ready && authenticated && Boolean(address),
    queryFn: async () => {
      if (!address) {
        throw new Error('Connect your wallet before loading your user state')
      }
      return api.game.getUserState({ userAddress: address })
    },
  })
}

export function usePrizes(enabled = true) {
  const { ready, authenticated } = usePrivy()
  const { wallets } = useWallets()
  const address = wallets[0]?.address?.toLowerCase()

  return useQuery<PrizeItem[]>({
    queryKey: [...gameKeys.prizes(), address] as const,
    enabled: enabled && ready && authenticated && Boolean(address),
    queryFn: async () => {
      if (!address) {
        throw new Error('Connect your wallet before viewing your prizes')
      }
      return api.game.getPrizes({ userAddress: address })
    },
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
  const { wallets } = useWallets()
  const address = wallets[0]?.address?.toLowerCase()

  return useMutation({
    mutationFn: async (data: PullRequest) => {
      if (!address) {
        throw new Error('Connect your wallet before revealing cells')
      }
      return api.game.pull(data, { userAddress: address })
    },
    onSuccess: () => {
      // Invalidate and refetch board and user state
      queryClient.invalidateQueries({ queryKey: gameKeys.board() })
      queryClient.invalidateQueries({ queryKey: gameKeys.userState() })
    },
  })
}

export function useHint(sessionId?: number) {
  const { wallets } = useWallets()
  const address = wallets[0]?.address?.toLowerCase()

  return useQuery({
    queryKey: [...gameKeys.all, 'hint', sessionId, address] as const,
    queryFn: async () => {
      if (sessionId === undefined) {
        throw new Error('No active game session found. Please start a new game.')
      }
      if (!address) {
        throw new Error('Connect your wallet before requesting hints')
      }
      return api.game.getHint(sessionId, { userAddress: address })
    },
    enabled: false, // Only fetch when manually triggered
  })
}

export function useStartSession() {
  const queryClient = useQueryClient()
  const { wallets } = useWallets()
  const contractConfigured = config.contract.isConfigured

  return useMutation<StartSessionResult, Error, TransactionProgressOptions>({
    mutationFn: async (options) => {
      const wallet = wallets[0]
      if (!wallet) {
        throw new Error('Connect your wallet before starting a session.')
      }

      const userAddress = wallet.address?.toLowerCase()
      if (!userAddress) {
        throw new Error('Unable to determine your wallet address.')
      }

      const { merkleRoot, sessionId } = await api.game.startSession({
        userAddress,
      })

      if (!contractConfigured) {
        return { merkleRoot, sessionId }
      }

      const contractAddress = config.contract.address

      const chain = getChainById(config.chain.id)
      if (wallet.chainId !== `eip155:${chain.id}`) {
        await wallet.switchChain(chain.id)
      }

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

      options?.onProgress?.('verifying')
      await api.verify.ticketPurchase(
        { txHash, sessionId },
        { userAddress },
      )
      options?.onProgress?.('success')

      return { merkleRoot, sessionId, txHash }
    },
    onSuccess: ({ sessionId, txHash }) => {
      queryClient.invalidateQueries({ queryKey: gameKeys.board() })
      queryClient.invalidateQueries({ queryKey: gameKeys.userState() })
      if (txHash) {
        queryClient.setQueryData(gameKeys.ticketPurchase(), { sessionId, txHash })
      } else {
        queryClient.setQueryData(gameKeys.ticketPurchase(), null)
      }
    },
  })
}

type ClaimPrizeVariables = {
  prizeId: string
} & TransactionProgressOptions

export function useClaimPrize() {
  const queryClient = useQueryClient()
  const { wallets } = useWallets()
  const contractConfigured = config.contract.isConfigured

  return useMutation<ClaimPrizeResult, Error, ClaimPrizeVariables>({
    mutationFn: async ({ prizeId, onProgress }) => {
      const wallet = wallets[0]
      if (!wallet) {
        throw new Error('Connect your wallet before claiming prizes.')
      }

      const userAddress = wallet.address?.toLowerCase()
      if (!userAddress) {
        throw new Error('Unable to determine your wallet address.')
      }

      if (!contractConfigured) {
        return { prizeId }
      }

      const proof = await api.game.getClaimProof(prizeId, { userAddress })

      const contractAddress = config.contract.address

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
      await api.verify.prizeClaim({ txHash, prizeId }, { userAddress })

      onProgress?.('success')

      return { prizeId, txHash }
    },
    onSuccess: (_, variables) => {
      if (config.contract.isConfigured) {
        queryClient.invalidateQueries({ queryKey: gameKeys.prizes() })
        return
      }

      queryClient.setQueryData(
        gameKeys.prizes(),
        (previous: Array<{ prizeId: string }> | undefined) => {
          if (!previous) {
            return previous
          }
          return previous.filter((prize) => prize.prizeId !== variables.prizeId)
        },
      )
    },
  })
}
