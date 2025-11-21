import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AdminCheckResponse } from '@pck/shared'
import { api } from '../lib/api'
import { gameKeys } from './useGameQueries'

const adminKeys = {
  status: (address?: string) => ['admin', 'status', address] as const,
}

export function useAdminStatus(address?: string) {
  const normalized = address?.toLowerCase()

  return useQuery({
    queryKey: adminKeys.status(normalized),
    enabled: Boolean(normalized),
    queryFn: async (): Promise<AdminCheckResponse> => {
      if (!normalized) {
        return { isAdmin: false }
      }

      try {
        return await api.admin.check({ userAddress: normalized })
      } catch (error) {
        console.warn('Failed to verify admin access', error)
        return { isAdmin: false }
      }
    },
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 5,
  })
}

export function useAdminReset(address?: string) {
  const queryClient = useQueryClient()
  const normalized = address?.toLowerCase()

  return useMutation({
    mutationFn: async () => {
      if (!normalized) {
        throw new Error('Connect an admin wallet before resetting the board')
      }

      return api.admin.resetBoard({ userAddress: normalized })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gameKeys.board() })
      queryClient.invalidateQueries({ queryKey: gameKeys.userState() })
      queryClient.invalidateQueries({ queryKey: gameKeys.prizes() })
    },
  })
}
