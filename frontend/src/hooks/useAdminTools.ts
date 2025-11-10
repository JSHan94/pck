import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { usePrivy } from '@privy-io/react-auth'
import type { AdminCheckResponse } from '@pck/shared'
import { api } from '../lib/api'
import { gameKeys } from './useGameQueries'

const adminKeys = {
  status: (address?: string) => ['admin', 'status', address] as const,
}

export function useAdminStatus(address?: string) {
  const { getAccessToken } = usePrivy()

  return useQuery({
    queryKey: adminKeys.status(address),
    enabled: Boolean(address),
    queryFn: async (): Promise<AdminCheckResponse> => {
      if (!address) {
        return { isAdmin: false }
      }

      try {
        const accessToken = await getAccessToken()
        if (!accessToken) {
          return { isAdmin: false }
        }
        return await api.admin.check({ accessToken })
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
  const { getAccessToken } = usePrivy()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      if (!address) {
        throw new Error('Connect an admin wallet before resetting the board')
      }

      const accessToken = await getAccessToken()
      if (!accessToken) {
        throw new Error('Please log in before resetting the board')
      }

      return api.admin.resetBoard({ accessToken })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gameKeys.board() })
      queryClient.invalidateQueries({ queryKey: gameKeys.userState() })
      queryClient.invalidateQueries({ queryKey: gameKeys.prizes() })
    },
  })
}
