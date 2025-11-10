import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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

  return useMutation({
    mutationFn: (data: PullRequest) => api.game.pull(data),
    onSuccess: () => {
      // Invalidate and refetch board and user state
      queryClient.invalidateQueries({ queryKey: gameKeys.board() })
      queryClient.invalidateQueries({ queryKey: gameKeys.userState() })
    },
  })
}

export function useHint(sessionId: number) {
  return useQuery({
    queryKey: [...gameKeys.all, 'hint', sessionId] as const,
    queryFn: () => api.game.getHint(sessionId),
    enabled: false, // Only fetch when manually triggered
  })
}
