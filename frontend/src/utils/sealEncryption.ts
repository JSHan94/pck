// Mocked Seal helpers to keep the UI functional without on-chain encryption.

export async function encryptWithSeal(
	data: string,
	_allowlistId: string,
	_packageId: string,
	_client: unknown
): Promise<{ encryptedData: Uint8Array; encryptionId: string }> {
	const encoded = new TextEncoder().encode(data)
	return { encryptedData: encoded, encryptionId: `mock-encryption-${Date.now()}` }
}

export async function decryptWithSeal(
	encryptedData: Uint8Array,
	_allowlistId: string,
	_packageId: string,
	_client: unknown,
	_walletAddress: string,
	_signPersonalMessage: (_message: { message: Uint8Array }) => Promise<{ signature: string }>
): Promise<string> {
	return new TextDecoder().decode(encryptedData)
}
