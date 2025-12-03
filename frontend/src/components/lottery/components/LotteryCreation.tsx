import { FC, useState } from "react"
import { useCurrentAccount } from "../../../lib/wallet"
import {
	DEFAULT_LOTTERY_PRIZE,
	DEFAULT_FEE,
	mistToSui,
	suiToMist,
} from "../../../config/constants"
import { createLotteryMock } from "../lotteryApi"

interface LotteryCreationProps {
	isLoading: boolean
	onLoadingChange: (loading: boolean) => void
	onStatusChange: (status: string) => void
	onLotteryCreated: () => void
}

export const LotteryCreation: FC<LotteryCreationProps> = ({
	isLoading,
	onLoadingChange,
	onStatusChange,
	onLotteryCreated,
}) => {
	const currentAccount = useCurrentAccount()

	// State for prize and fee inputs (in $pM, not MIST)
	const [prizeInSui, setPrizeInSui] = useState<string>(
		mistToSui(DEFAULT_LOTTERY_PRIZE)
	)
	const [feeInSui, setFeeInSui] = useState<string>(mistToSui(DEFAULT_FEE))
	const [localStatus, setLocalStatus] = useState<string>("")

	const handleCreateLottery = async () => {
		if (isLoading) return

		// Convert $pM to MIST
		const prizeInMist = suiToMist(parseFloat(prizeInSui) || 0)
		const feeInMist = suiToMist(parseFloat(feeInSui) || 0)

		// Validate inputs
		if (prizeInMist <= 0) {
			onStatusChange("Prize amount must be greater than 0")
			return
		}
		if (feeInMist <= 0) {
			onStatusChange("Fee must be greater than 0")
			return
		}

		onLoadingChange(true)
		onStatusChange("Creating play...")
		setLocalStatus("Creating play...")

		try {
			const creator = currentAccount?.address || "0xprivy-demo"
			createLotteryMock(creator, prizeInMist, feeInMist)
			const message = "Play created in demo mode."
			onStatusChange(message)
			setLocalStatus(message)
			onLoadingChange(false)
			setTimeout(() => onLotteryCreated(), 500)
		} catch (error: any) {
			console.error("Error creating play:", error)
			const message = `Error: ${error.message}`
			onStatusChange(message)
			setLocalStatus(message)
			onLoadingChange(false)
		}
	}

	return (
		<div className="nes-container with-title">
			<p className="title">Create New Play</p>
			<p className="text-sm mb-4">
				Create a 3x3 play with 9 slots. Configure the prize pool and entry
				fee below.
			</p>

			{/* Prize Amount Input */}
			<div className="nes-field mb-4">
				<label htmlFor="prize_field">Prize Pool ($pM)</label>
				<input
					type="number"
					id="prize_field"
					value={prizeInSui}
					onChange={(e) => setPrizeInSui(e.target.value)}
					step="0.01"
					min="0"
					placeholder="Enter prize amount in $pM"
					className="nes-input"
				/>
				<p className="text-xs mt-1">
					Winner receives this amount
				</p>
			</div>

			{/* Fee Input */}
			<div className="nes-field mb-4">
				<label htmlFor="fee_field">Entry Fee per Slot ($pM)</label>
				<input
					type="number"
					id="fee_field"
					value={feeInSui}
					onChange={(e) => setFeeInSui(e.target.value)}
					step="0.001"
					min="0"
					placeholder="Enter fee amount in $pM"
					className="nes-input"
				/>
				<p className="text-xs mt-1">
					Players pay this amount to pick a slot
				</p>
			</div>

			<button
				onClick={handleCreateLottery}
				disabled={isLoading}
				className={`nes-btn is-primary w-full ${isLoading ? "is-disabled" : ""}`}
			>
				{isLoading ? "Processing..." : `Create Play (Pay ${prizeInSui} $pM)`}
			</button>
			{localStatus && (
				<p className="mt-3 text-xs">{localStatus}</p>
			)}
		</div>
	)
}
