import { useState, useEffect } from "react"
import { keccak256 as keccakHash } from "js-sha3"

// Helper function to generate random bytes
const generateRandomBytes = (length: number): Uint8Array => {
	const bytes = new Uint8Array(length)
	crypto.getRandomValues(bytes)
	return bytes
}

// Helper function to convert bytes to hex string
const bytesToHex = (bytes: Uint8Array): string => {
	return Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("")
}

// Helper function to compute Keccak256 hash
export const keccak256 = (data: Uint8Array): Uint8Array => {
	const hashHex = keccakHash(data)
	const hashBytes = new Uint8Array(hashHex.length / 2)
	for (let i = 0; i < hashBytes.length; i++) {
		hashBytes[i] = parseInt(hashHex.substring(i * 2, i * 2 + 2), 16)
	}
	return hashBytes
}

export const useSecret = (currentAccountAddress: string | undefined) => {
	const [claimSecretHash, setClaimSecretHash] = useState<string>("")
	const [generatedSecret, setGeneratedSecret] = useState<string>("")
	const [isGeneratingSecret, setIsGeneratingSecret] = useState<boolean>(false)
	const [status, setStatus] = useState<string>("")

	// Load secret from localStorage on mount
	useEffect(() => {
		const storedHash = localStorage.getItem("lotterySecretHash")
		const storedSecret = localStorage.getItem("lotterySecret")

		if (storedHash) setClaimSecretHash(storedHash)
		if (storedSecret) setGeneratedSecret(storedSecret)
	}, [])

	const handleGenerateSecret = async () => {
		if (!currentAccountAddress) {
			setStatus("Please connect your wallet first")
			return
		}

		setIsGeneratingSecret(true)
		setStatus("Generating claim secret...")

		try {
			// Generate random secret (32 bytes)
			const secretBytes = generateRandomBytes(32)
			const secretHex = bytesToHex(secretBytes)

			// Compute hash of the secret
			const hashBytes = keccak256(secretBytes)
			const hashHex = bytesToHex(hashBytes)

			// Store the generated values in state and localStorage
			setGeneratedSecret(secretHex)
			setClaimSecretHash(hashHex)

			localStorage.setItem("lotterySecret", secretHex)
			localStorage.setItem("lotterySecretHash", hashHex)

			setStatus(
				`✓ Secret generated and saved!\n\nYou can now use this secret for all lottery picks.`
			)
			setIsGeneratingSecret(false)

		} catch (error: any) {
			console.error("Error generating secret:", error)
			setStatus(`Error: ${error.message}`)
			setIsGeneratingSecret(false)
		}
	}

	return {
		claimSecretHash,
		generatedSecret,
		isGeneratingSecret,
		status,
		handleGenerateSecret,
	}
}
