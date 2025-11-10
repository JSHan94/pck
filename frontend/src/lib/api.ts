import type {
  StartSessionResponse,
  PullRequest,
  PullResponse,
  HintResponse,
} from '@pck/shared'
import { config } from './config'

// Use Supabase Functions URL or fallback to /api for MSW
const API_BASE_URL = config.supabase.url
  ? `${config.supabase.url}/functions/v1`
  : '/api'

export const api = {
  game: {
    startSession: async (): Promise<StartSessionResponse> => {
      const response = await fetch(`${API_BASE_URL}/game/start-session`)
      if (!response.ok) throw new Error('Failed to start session')
      return response.json()
    },

    getBoard: async () => {
      const response = await fetch(`${API_BASE_URL}/game/board`)
      if (!response.ok) throw new Error('Failed to fetch board')
      return response.json()
    },

    getUserState: async () => {
      const response = await fetch(`${API_BASE_URL}/game/user-state`)
      if (!response.ok) throw new Error('Failed to fetch user state')
      return response.json()
    },

    pull: async (data: PullRequest): Promise<PullResponse> => {
      const response = await fetch(`${API_BASE_URL}/game/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Failed to pull')
      return response.json()
    },

    getHint: async (sessionId: number): Promise<HintResponse> => {
      const response = await fetch(`${API_BASE_URL}/game/hint?sessionId=${sessionId}`)
      if (!response.ok) throw new Error('Failed to fetch hint')
      return response.json()
    },

    getPrizes: async () => {
      const response = await fetch(`${API_BASE_URL}/game/prizes`)
      if (!response.ok) throw new Error('Failed to fetch prizes')
      return response.json()
    },
  },
}
