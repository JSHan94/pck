import { decodeJwt } from 'https://esm.sh/jose@5.9.6'

const PRIVY_APP_ID = Deno.env.get('PRIVY_APP_ID')

export type AuthContext = {
  address: string
}

export class AuthError extends Error {
  constructor(message = 'UNAUTHORIZED') {
    super(message)
  }
}

export async function requireUser(request: Request): Promise<AuthContext> {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AuthError('MISSING_TOKEN')
  }

  const token = authHeader.slice('Bearer '.length)
  const payload = decodeJwt(token)
  const address = (payload as Record<string, unknown>)['sub']
  if (typeof address !== 'string') {
    throw new AuthError('INVALID_TOKEN')
  }

  if (PRIVY_APP_ID && payload['app_id'] !== PRIVY_APP_ID) {
    throw new AuthError('INVALID_APP')
  }

  return { address }
}
