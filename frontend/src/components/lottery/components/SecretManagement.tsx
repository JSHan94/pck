import { FC, useEffect } from "react"
import { useSecret } from "../../../hooks/useSecret"

interface SecretManagementProps {
	currentAccountAddress: string | undefined
	onStatusChange?: (status: string) => void
}

export const SecretManagement: FC<SecretManagementProps> = ({
	currentAccountAddress,
	onStatusChange,
}) => {
	const {
		claimSecretHash,
		generatedSecret,
		isGeneratingSecret,
		status: secretStatus,
		handleGenerateSecret,
	} = useSecret(currentAccountAddress)

	// Notify parent of status changes using useEffect
	useEffect(() => {
		if (onStatusChange && secretStatus) {
			onStatusChange(secretStatus)
		}
	}, [secretStatus, onStatusChange])

	return (
		<div className="nes-container with-title is-centered">
			<p className="title">My Secret</p>
			<p className="text-sm text-brand-tertiary dark:text-white/70 mb-4">
				Generate your personal secret for anonymous prize claiming.
				Stored securely in your browser's local storage.
			</p>
			<div className="flex flex-col gap-4">
				{/* Generate Secret Button */}
				<div className="border-b border-white/10 pb-4">
					<h4 className="font-semibold mb-2 text-brand-tertiary dark:text-white">
						Generate Your Secret
					</h4>
					<p className="text-xs text-brand-tertiary dark:text-white/60 mb-3">
						Generate your secret for anonymous prize claiming.
						Keep this safe - you'll need it to claim prizes!
					</p>
					<button
						onClick={handleGenerateSecret}
						disabled={isGeneratingSecret}
						className={`nes-btn is-primary w-full ${isGeneratingSecret ? "is-disabled" : ""}`}
					>
						{isGeneratingSecret
							? "Generating..."
							: claimSecretHash && generatedSecret
								? "Regenerate"
								: "Generate Secret"}
					</button>
				</div>

				{/* Display Current Secret */}
				{generatedSecret && claimSecretHash && (
					<div className="nes-container is-dark with-title mt-4">
						<p className="title">Secret Active</p>
						<p className="text-sm mb-3 text-green-400">
							✓ Use this for all lottery picks!
						</p>
						<div className="space-y-3">
							<div className="nes-field">
								<label htmlFor="secret_field">Your Secret:</label>
								<input type="text" id="secret_field" className="nes-input is-dark" value={generatedSecret} readOnly />
							</div>
							<div className="nes-field">
								<label htmlFor="hash_field">Hash (public):</label>
								<input type="text" id="hash_field" className="nes-input is-dark" value={claimSecretHash} readOnly />
							</div>
						</div>
						<p className="text-xs mt-3 text-gray-400">
							💡 Save your secret! If lost, you cannot claim prizes.
						</p>
					</div>
				)}

				{/* Status Display */}
				{secretStatus && (
					<div className="nes-container is-rounded mt-4">
						<p>{secretStatus}</p>
					</div>
				)}
			</div>
		</div>
	)
}

// Export the hook as well for use in parent component
export { useSecret }
