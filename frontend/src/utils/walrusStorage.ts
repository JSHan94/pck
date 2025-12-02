// Mocked Walrus helpers: no network calls, just deterministic stubs.
export async function uploadToWalrus(
	_encryptedData: Uint8Array
): Promise<{
	blobId: string
	endEpoch: string
	suiRefType: string
	suiRef: string
	status: string
}> {
	const blobId = `blob-${Date.now()}`
	return {
		blobId,
		endEpoch: "mock-epoch",
		suiRefType: "Mock",
		suiRef: "mock-sui-ref",
		status: "Mock upload complete",
	}
}

export async function downloadFromWalrus(_blobId: string): Promise<Uint8Array> {
	const data = "mock-encrypted-secret"
	return new TextEncoder().encode(data)
}
