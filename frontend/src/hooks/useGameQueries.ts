import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usePrivy } from '@privy-io/react-auth'
import { api } from '../lib/api'
import type { PullRequest } from '@pck/shared'

export const gameKeys = {
  all: ['game'] as const,
  board: () => [...gameKeys.all, 'board'] as const,
  userState: () => [...gameKeys.all, 'userState'] as const,
  prizes: () => [...gameKeys.all, 'prizes'] as const,
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

export function usePrizes() {
  return useQuery({
    queryKey: gameKeys.prizes(),
    queryFn: api.game.getPrizes,
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
