const ADMIN_ADDRESSES = (Deno.env.get('ADMIN_ADDRESSES') ?? '')
  .split(',')
  .map((addr) => addr.trim().toLowerCase())
  .filter(Boolean)

export function requireEnv(name: string): string {
  const value = Deno.env.get(name)
  if (!value) {
    throw new Error(`Missing env var: ${name}`)
  }
  return value
}

export function isAdminAddress(address: string | undefined): boolean {
  if (!address) return false
  return ADMIN_ADDRESSES.includes(address.toLowerCase())
}
