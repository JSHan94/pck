export const fromHex = (hex: string): Uint8Array => {
	const clean = hex.startsWith("0x") ? hex.slice(2) : hex
	const bytes = new Uint8Array(clean.length / 2)
	for (let i = 0; i < bytes.length; i++) {
		bytes[i] = parseInt(clean.substr(i * 2, 2), 16)
	}
	return bytes
}

export const toHex = (data: Uint8Array): string => {
	return `0x${Array.from(data)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("")}`
}
