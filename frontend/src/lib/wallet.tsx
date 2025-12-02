import React from "react"
import { usePrivy, useWallets } from "@privy-io/react-auth"
import { ensureChainId, rpcRequest } from "./rpcClient"

type Account = { address: string }

// Derive the current account directly from Privy state; no extra provider needed.
export const useCurrentAccount = (): Account | null => {
	const privy = usePrivy()
	const { wallets } = useWallets()
	const address = wallets[0]?.address || privy.user?.wallet?.address || null
	if (!privy.ready || !privy.authenticated || !address) return null
	return { address }
}

// Connect/disconnect helpers that simply delegate to Privy.
export const usePrivyWalletActions = () => {
	const privy = usePrivy()
	return {
		connect: () => {
			if (!privy.ready) return
			privy.login()
		},
		disconnect: () => {
			if (!privy.ready) return
			privy.logout()
		},
	}
}

// Stubbed tx hook: verifies RPC connectivity and returns a synthetic digest.
export const useSignAndExecuteTransaction = () => {
	const account = useCurrentAccount()
	return {
		mutate: async (
			_args: { transaction?: unknown } = {},
			callbacks: {
				onSuccess?: (result: { digest: string }) => void
				onError?: (error: Error) => void
			} = {}
		) => {
			try {
				if (!account) {
					throw new Error("Wallet not connected")
				}
				await ensureChainId()
				const blockNumberHex = await rpcRequest<string>("eth_blockNumber")
				const digest = `${blockNumberHex}-${Date.now()}`
				callbacks.onSuccess?.({ digest })
			} catch (err: any) {
				callbacks.onError?.(err)
			}
		},
	}
}

export const useSignPersonalMessage = () => {
	return {
		mutateAsync: async (_args: any) => ({
			signature: "0xprivy-signed",
		}),
	}
}

export const ConnectButton: React.FC = () => {
	const account = useCurrentAccount()
	const { connect, disconnect } = usePrivyWalletActions()
	const connected = Boolean(account)
	const label = connected
		? `Connected: ${account?.address.slice(0, 6)}...${account?.address.slice(-4)}`
		: "Connect Privy Wallet"
	return (
		<button
			type="button"
			onClick={connected ? disconnect : connect}
			className="px-4 py-2 rounded-lg font-semibold bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow"
		>
			{label}
		</button>
	)
}
