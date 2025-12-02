import { useState, useEffect } from "react"
export const useUserAllowlist = (currentAccountAddress: string | undefined) => {
	const [allowlistId, setAllowlistId] = useState<string>("")
	const [capId, setCapId] = useState<string>("")
	const [isCreatingAllowlist, setIsCreatingAllowlist] = useState<boolean>(false)
	const [status, setStatus] = useState<string>("")

	// Load allowlist info from localStorage on mount
	useEffect(() => {
		const storedAllowlistId = localStorage.getItem("userAllowlistId")
		const storedCapId = localStorage.getItem("userAllowlistCapId")

		if (storedAllowlistId) setAllowlistId(storedAllowlistId)
		if (storedCapId) setCapId(storedCapId)
	}, [])

	const handleCreateUserAllowlist = async () => {
		if (!currentAccountAddress) {
			setStatus("Please connect your wallet first")
			return
		}

		setIsCreatingAllowlist(true)
		setStatus("Creating your personal allowlist (mock)...")

		try {
			const newAllowlistId = `0xallowlist-${Date.now()}`
			const newCapId = `0xcap-${Date.now()}`

			setAllowlistId(newAllowlistId)
			setCapId(newCapId)
			localStorage.setItem("userAllowlistId", newAllowlistId)
			localStorage.setItem("userAllowlistCapId", newCapId)

			setStatus(
				`✓ Allowlist created (mock)\nAllowlist ID: ${newAllowlistId}\nCap ID: ${newCapId}\n\nUse these values when encrypting secrets.`
			)
			setIsCreatingAllowlist(false)
		} catch (error: any) {
			console.error("Error creating allowlist:", error)
			setStatus(`Error: ${error.message}`)
			setIsCreatingAllowlist(false)
		}
	}

	return {
		allowlistId,
		capId,
		isCreatingAllowlist,
		status,
		handleCreateUserAllowlist,
	}
}
