import type {
  StartSessionResponse,
  GameBoardResponse,
  PullRequest,
  PullResponse,
  HintResponse,
  UserStateResponse,
  AdminCheckResponse,
  AdminResetResponse,
  VerifyReceiptResponse,
  ClaimProofResponse,
} from '@pck/shared'
import { config } from './config'

// Use Supabase Functions URL or fallback to /api during local development
const API_BASE_URL = config.supabase.url
  ? `${config.supabase.url}/functions/v1`
  : '/api'

type ApiErrorResponse = {
  error?: string
  code?: string
  message?: string
}

type UserAddressOptions = {
  userAddress?: string
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

function buildJsonHeaders(options?: UserAddressOptions): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (config.supabase.anonKey) {
    headers.apikey = config.supabase.anonKey
    headers.Authorization = `Bearer ${config.supabase.anonKey}`
  }

  if (options?.userAddress) {
    headers['x-user-address'] = options.userAddress.toLowerCase()
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
    startSession: async (options?: UserAddressOptions): Promise<StartSessionResponse> => {
      const response = await fetch(`${API_BASE_URL}/game-start-session`, {
        headers: buildJsonHeaders(options),
      })
      return handleJsonResponse<StartSessionResponse>(response, 'Failed to start session')
    },

    getBoard: async (options?: UserAddressOptions): Promise<GameBoardResponse> => {
      const response = await fetch(`${API_BASE_URL}/game-board`, {
        headers: buildJsonHeaders(options),
      })
      return handleJsonResponse<GameBoardResponse>(response, 'Failed to fetch board')
    },

    getUserState: async (options?: UserAddressOptions): Promise<UserStateResponse> => {
      const response = await fetch(`${API_BASE_URL}/game-user-state`, {
        headers: buildJsonHeaders(options),
      })
      return handleJsonResponse(response, 'Failed to fetch user state')
    },

    pull: async (data: PullRequest, options?: UserAddressOptions): Promise<PullResponse> => {
      const response = await fetch(`${API_BASE_URL}/game-pull`, {
        method: 'POST',
        headers: buildJsonHeaders(options),
        body: JSON.stringify(data),
      })

      return handleJsonResponse<PullResponse>(response, 'Failed to reveal the cell')
    },

    getHint: async (sessionId: number, options?: UserAddressOptions): Promise<HintResponse> => {
      const response = await fetch(`${API_BASE_URL}/game-hint?sessionId=${sessionId}`, {
        headers: buildJsonHeaders(options),
      })

      return handleJsonResponse<HintResponse>(response, 'Failed to fetch hint')
    },

    getPrizes: async (options?: UserAddressOptions) => {
      const response = await fetch(`${API_BASE_URL}/game-prizes`, {
        headers: buildJsonHeaders(options),
      })
      return handleJsonResponse(response, 'Failed to fetch prizes')
    },

    getClaimProof: async (
      prizeId: string,
      options?: UserAddressOptions,
    ): Promise<ClaimProofResponse> => {
      const response = await fetch(`${API_BASE_URL}/game-claim-proof?prizeId=${encodeURIComponent(prizeId)}`, {
        headers: buildJsonHeaders(options),
      })

      return handleJsonResponse<ClaimProofResponse>(response, 'Failed to fetch claim proof')
    },
  },

  admin: {
    check: async (options?: UserAddressOptions): Promise<AdminCheckResponse> => {
      const response = await fetch(`${API_BASE_URL}/admin-check`, {
        headers: buildJsonHeaders(options),
      })

      return handleJsonResponse<AdminCheckResponse>(response, 'Failed to verify admin access')
    },

    resetBoard: async (options?: UserAddressOptions): Promise<AdminResetResponse> => {
      const response = await fetch(`${API_BASE_URL}/admin-reset-board`, {
        method: 'POST',
        headers: buildJsonHeaders(options),
        body: JSON.stringify({}),
      })

      return handleJsonResponse<AdminResetResponse>(response, 'Failed to reset board')
    },
  },

  verify: {
    ticketPurchase: async (
      data: { txHash: string; sessionId: number },
      options?: UserAddressOptions,
    ): Promise<VerifyReceiptResponse> => {
      const response = await fetch(`${API_BASE_URL}/verify-ticket-purchase`, {
        method: 'POST',
        headers: buildJsonHeaders(options),
        body: JSON.stringify(data),
      })

      return handleJsonResponse<VerifyReceiptResponse>(response, 'Failed to verify ticket purchase')
    },

    prizeClaim: async (
      data: { txHash: string; prizeId: string },
      options?: UserAddressOptions,
    ): Promise<VerifyReceiptResponse> => {
      const response = await fetch(`${API_BASE_URL}/verify-prize-claim`, {
        method: 'POST',
        headers: buildJsonHeaders(options),
        body: JSON.stringify(data),
      })

      return handleJsonResponse<VerifyReceiptResponse>(response, 'Failed to verify prize claim')
    },
  },
}
