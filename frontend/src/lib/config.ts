/**
 * Application Configuration
 *
 * Environment variables should be set in .env file:
 * - VITE_SUPABASE_URL
 * - VITE_SUPABASE_ANON_KEY
 * - VITE_CONTRACT_ADDRESS
 * - VITE_CHAIN_ID
 * - VITE_PRIVY_APP_ID
 * - VITE_RPC_URL
 */

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const

const envContractAddress = import.meta.env.VITE_CONTRACT_ADDRESS?.trim()
const hasContractAddress =
  Boolean(envContractAddress) &&
  envContractAddress !== ZERO_ADDRESS &&
  envContractAddress.startsWith('0x')
const contractAddress: `0x${string}` = hasContractAddress && envContractAddress
  ? (envContractAddress as `0x${string}`)
  : ZERO_ADDRESS

export const config = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  },
  contract: {
    address: contractAddress,
    isConfigured: hasContractAddress,
  },
  chain: {
    id: Number(import.meta.env.VITE_CHAIN_ID) || 11155111, // Sepolia
  },
  privy: {
    appId: import.meta.env.VITE_PRIVY_APP_ID || '',
  },
  rpc: {
    url: import.meta.env.VITE_RPC_URL || '',
  },
} as const;

export const CONTRACT_ZERO_ADDRESS = ZERO_ADDRESS;
