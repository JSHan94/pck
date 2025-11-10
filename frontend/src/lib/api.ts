import type {
  StartSessionResponse,
  PullRequest,
  PullResponse,
  HintResponse,
  UserStateResponse,
  AdminCheckResponse,
  AdminResetResponse,
} from '@pck/shared'
import { config } from './config'

// Use Supabase Functions URL or fallback to /api for MSW
const API_BASE_URL = config.supabase.url
  ? `${config.supabase.url}/functions/v1`
  : '/api'

type ApiErrorResponse = {
  error?: string
  code?: string
  message?: string
}

const API_ERROR_MESSAGES: Record<string, string> = {
  TICKET_NOT_PURCHASED: 'Please purchase a ticket before revealing cells.',
  TICKET_NOT_VERIFIED: 'Please verify your ticket before revealing cells.',
  SESSION_NOT_ACTIVE: 'Your session is not active. Please start a new game.',
  SESSION_NOT_FOUND: 'No active session found. Please start a new game.',
  ALREADY_REVEALED: 'This cell has already been revealed.',
  BOARD_COMPLETED: 'All cells have already been revealed.',
  UNAUTHORIZED: 'You must be logged in to continue.',
  HINT_NOT_AVAILABLE: 'Hints unlock every 3 pulls. Keep playing to reveal one.',
}

function buildJsonHeaders(accessToken?: string): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (config.supabase.anonKey) {
    headers.apikey = config.supabase.anonKey
  }

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  }

  return headers
}

async function handleJsonResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  if (response.ok) {
    return response.json() as Promise<T>
  }

  let errorBody: ApiErrorResponse | undefined
  try {
    errorBody = await response.json()
  } catch {
    // Ignore JSON parse errors for non-JSON responses
  }

  const derivedMessage =
    (errorBody && getErrorMessage(errorBody)) ||
    fallbackMessage

  throw new Error(derivedMessage)
}

function getErrorMessage(errorBody: ApiErrorResponse): string | undefined {
  const errorCode = errorBody.error || errorBody.code
  if (errorCode && API_ERROR_MESSAGES[errorCode]) {
    return API_ERROR_MESSAGES[errorCode]
  }
  if (errorBody.message) {
    return errorBody.message
  }
  if (errorCode) {
    return errorCode
  }
  return undefined
}

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

    getUserState: async (): Promise<UserStateResponse> => {
      const response = await fetch(`${API_BASE_URL}/game/user-state`)
      if (!response.ok) throw new Error('Failed to fetch user state')
      return response.json()
    },

    pull: async (data: PullRequest, options?: { accessToken?: string }): Promise<PullResponse> => {
      const response = await fetch(`${API_BASE_URL}/game/pull`, {
        method: 'POST',
        headers: buildJsonHeaders(options?.accessToken),
        body: JSON.stringify(data),
      })

      return handleJsonResponse<PullResponse>(response, 'Failed to reveal the cell')
    },

    getHint: async (sessionId: number, options?: { accessToken?: string }): Promise<HintResponse> => {
      const response = await fetch(`${API_BASE_URL}/game/hint?sessionId=${sessionId}`, {
        headers: buildJsonHeaders(options?.accessToken),
      })

      return handleJsonResponse<HintResponse>(response, 'Failed to fetch hint')
    },

    getPrizes: async () => {
      const response = await fetch(`${API_BASE_URL}/game/prizes`)
      if (!response.ok) throw new Error('Failed to fetch prizes')
      return response.json()
    },
  },

  admin: {
    check: async (options?: { accessToken?: string }): Promise<AdminCheckResponse> => {
      const response = await fetch(`${API_BASE_URL}/admin/check`, {
        headers: buildJsonHeaders(options?.accessToken),
      })

      return handleJsonResponse<AdminCheckResponse>(response, 'Failed to verify admin access')
    },

    resetBoard: async (options?: { accessToken?: string }): Promise<AdminResetResponse> => {
      const response = await fetch(`${API_BASE_URL}/admin/reset-board`, {
        method: 'POST',
        headers: buildJsonHeaders(options?.accessToken),
        body: JSON.stringify({}),
      })

      return handleJsonResponse<AdminResetResponse>(response, 'Failed to reset board')
    },
  },
}
