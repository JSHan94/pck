import { isAdminAddress } from './env.ts'

export class AdminAuthError extends Error {
  constructor(message = 'UNAUTHORIZED') {
    super(message)
  }
}

export async function requireAdmin(request: Request): Promise<string> {
  const address = request.headers.get('x-user-address')
  if (!isAdminAddress(address ?? undefined)) {
    throw new AdminAuthError()
  }
  return address as string
}
