import React, { useEffect, useState } from "react"
import { usePrivy, useWallets } from "@privy-io/react-auth"
import { ensureChainId, rpcRequest } from "./rpcClient"
import memeLogo from "../assets/meme_logo.png"

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
	const { wallets } = useWallets()
	const { connect, disconnect } = usePrivyWalletActions()
	const [balance, setBalance] = useState<string | null>(null)

	const connected = Boolean(account)
	const activeWallet = wallets.find((w) => w.address === account?.address)

	const expectedChainId = Number(import.meta.env.VITE_CHAIN_ID || 43522)
	const walletChainId = activeWallet?.chainId
		? Number(activeWallet.chainId.toString().replace("eip155:", ""))
		: null

	const isWrongChain = connected && walletChainId !== null && walletChainId !== expectedChainId

	useEffect(() => {
		if (account?.address) {
			rpcRequest<string>("eth_getBalance", [account.address, "latest"])
				.then((hex) => {
					const val = Number(BigInt(hex)) / 1e18
					setBalance(val.toFixed(2))
				})
				.catch((err) => {
					console.error("Failed to fetch balance:", err)
					setBalance(null)
				})
		} else {
			setBalance(null)
		}
	}, [account?.address])

	const label = connected
		? `${account?.address.slice(0, 6)}...${account?.address.slice(-4)}`
		: "Connect"

	return (
		<div className="flex items-center gap-4">
			{connected && balance && !isWrongChain && (
				<button className="nes-btn is-disabled" style={{ opacity: 1, cursor: 'default', display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '1rem', paddingRight: '1rem' }}>
					<img src={memeLogo} alt="$M" className="w-6 h-6 object-contain pixelated" />
					<span className="text-black">{balance}</span>
				</button>
			)}
			<button
				type="button"
				onClick={connected ? disconnect : connect}
				className={`nes-btn ${isWrongChain ? "is-error" : "is-primary"}`}
			>
				{isWrongChain ? "Wrong Network" : label}
			</button>
		</div>
	)
}
