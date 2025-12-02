import invariant from "tiny-invariant"

const rpcUrl = import.meta.env.VITE_RPC_URL as string | undefined
const chainIdEnv = import.meta.env.VITE_CHAIN_ID as string | undefined

invariant(rpcUrl, "VITE_RPC_URL is required")
invariant(chainIdEnv, "VITE_CHAIN_ID is required")

const chainId = Number(chainIdEnv)

type JsonRpcRequest = {
	id: number
	jsonrpc: "2.0"
	method: string
	params: any[]
}

type JsonRpcResponse<T = any> = {
	id: number
	jsonrpc: "2.0"
	result?: T
	error?: { code: number; message: string; data?: any }
}

export const rpcRequest = async <T = any>(method: string, params: any[] = []): Promise<T> => {
	const payload: JsonRpcRequest = {
		id: Date.now(),
		jsonrpc: "2.0",
		method,
		params,
	}

	const res = await fetch(rpcUrl, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload),
	})

	if (!res.ok) {
		throw new Error(`RPC ${method} failed with status ${res.status}`)
	}

	const body = (await res.json()) as JsonRpcResponse<T>
	if (body.error) {
		throw new Error(body.error.message || "Unknown RPC error")
	}
	if (typeof body.result === "undefined") {
		throw new Error(`RPC ${method} returned no result`)
	}
	return body.result
}

export const ensureChainId = async () => {
	const remoteChainIdHex = await rpcRequest<string>("eth_chainId")
	const remoteChainId = Number(remoteChainIdHex)
	if (remoteChainId !== chainId) {
		throw new Error(
			`Connected to chain ${remoteChainId} but expected ${chainId}. Check VITE_CHAIN_ID`
		)
	}
	return remoteChainId
}
