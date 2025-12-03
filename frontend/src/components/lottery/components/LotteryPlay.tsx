import { FC } from "react"
import { useCurrentAccount } from "../../../lib/wallet"
import { mistToSui } from "../../../config/constants"
import {

	collectFeeMock,
	collectPrizeMock,
	pickSlotMock,
} from "../lotteryApi"

interface LotteryData {
	slots: boolean[]
	isActive: boolean
	winningSlot: number
	creator: string
	winner: string | null
	prize: number
	remainingFee: number
	prizeClaimed: boolean
	fee: number  // Fee per slot for this lottery
}

interface LotteryPlayProps {
	lotteryObjectId: string
	lotteryData: LotteryData | null
	slotIndex: number | null
	currentAccountAddress: string | undefined

	isLoading: boolean
	onLoadingChange: (loading: boolean) => void
	onStatusChange: (status: string) => void
	onLotteryUpdate: () => void
}

export const LotteryPlay: FC<LotteryPlayProps> = ({
	lotteryObjectId,
	lotteryData,
	slotIndex,
	currentAccountAddress,

	isLoading,
	onLoadingChange,
	onStatusChange,
	onLotteryUpdate,
}) => {
	const currentAccount = useCurrentAccount()


	const handlePickSlot = async () => {
		if (!lotteryObjectId || isLoading || slotIndex === null || !lotteryData)
			return



		onLoadingChange(true)
		onStatusChange("Picking slot...")

		try {
			if (!currentAccount?.address) throw new Error("Wallet not connected")
			pickSlotMock(lotteryObjectId, slotIndex, currentAccount.address)
			onStatusChange("Slot picked! Lottery updated.")
			setTimeout(() => onLotteryUpdate(), 500)
		} catch (error: any) {
			console.error("Error picking slot:", error)
			onStatusChange(`Error: ${error.message}`)
			onLoadingChange(false)
		}
	}

	const handleCollectFee = async () => {
		if (!lotteryObjectId || isLoading) return

		onLoadingChange(true)
		onStatusChange("Collecting fees...")

		try {
			if (!currentAccount?.address) throw new Error("Wallet not connected")
			collectFeeMock(lotteryObjectId, currentAccount.address)
			onStatusChange("Fees collected.")
			setTimeout(() => onLotteryUpdate(), 500)
		} catch (error: any) {
			console.error("Error collecting fees:", error)
			onStatusChange(`Error: ${error.message}`)
			onLoadingChange(false)
		}
	}

	const handleCollectPrize = async () => {
		if (!lotteryObjectId || isLoading) return

		onLoadingChange(true)
		onStatusChange("Collecting prize...")

		try {
			if (!currentAccount?.address) throw new Error("Wallet not connected")
			collectPrizeMock(lotteryObjectId, currentAccount.address)
			onStatusChange("Prize collected.")
			setTimeout(() => onLotteryUpdate(), 500)
		} catch (error: any) {
			console.error("Error collecting prize:", error)
			onStatusChange(`Error: ${error.message}`)
			onLoadingChange(false)
		}
	}



	const isCreator =
		currentAccountAddress &&
		lotteryData &&
		currentAccountAddress === lotteryData.creator
	const isWinner =
		currentAccountAddress &&
		lotteryData &&
		lotteryData.winner &&
		currentAccountAddress === lotteryData.winner
	const canCollectFee =
		isCreator && lotteryData && lotteryData.remainingFee > 0
	const canCollectPrize = isWinner && lotteryData && lotteryData.prize > 0

	return (
		<div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
			<h3 className="text-xl font-semibold mb-4">Play Lottery</h3>
			<div className="flex flex-col gap-4">
				{lotteryData && (
					<div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md">
						<div className="grid grid-cols-2 gap-2 text-sm">
							<div>
								<span className="font-semibold">Prize:</span>{" "}
								{mistToSui(lotteryData.prize)} $pM
								{lotteryData.prize === 0 && (
									<span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
										(Collected ✓)
									</span>
								)}
							</div>
							<div>
								<span className="font-semibold">Entry Fee:</span>{" "}
								{mistToSui(lotteryData.fee)} $pM
							</div>
							<div>
								<span className="font-semibold">Fees Collected:</span>{" "}
								{mistToSui(lotteryData.remainingFee)} $pM
								{lotteryData.remainingFee === 0 && lotteryData.winner && (
									<span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
										(Collected ✓)
									</span>
								)}
							</div>
							<div>
								<span className="font-semibold">Status:</span>{" "}
								{lotteryData.isActive ? (
									<span className="text-green-600 dark:text-green-400">
										Active
									</span>
								) : (
									<span className="text-red-600 dark:text-red-400">
										Ended
									</span>
								)}
							</div>
						</div>
					</div>
				)}

				<button
					onClick={handlePickSlot}
					disabled={
						isLoading ||
						!lotteryObjectId ||
						!lotteryData ||
						!lotteryData.isActive ||
						slotIndex === null ||
						(slotIndex !== null && lotteryData.slots[slotIndex])
					}
					className="w-full px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
					title={
						!lotteryData
							? "Select a lottery first"
							: !lotteryData.isActive
								? "This lottery has ended"
								: slotIndex === null
									? "Select a slot from the grid"
									: slotIndex !== null && lotteryData.slots[slotIndex]
										? "This slot is already taken"
										: "Click to pick this slot"
					}
				>
					{isLoading
						? "Processing..."
						: !lotteryData
							? "Pick Slot"
							: !lotteryData.isActive
								? "Lottery Ended"
								: slotIndex === null
									? "Pick Slot (Select from Grid)"
									: lotteryData.slots[slotIndex]
										? "Slot Taken"
										: `Pick Slot ${slotIndex} (Pay ${mistToSui(lotteryData.fee)} $pM)`}
				</button>

				<div className="flex gap-3">
					<button
						onClick={handleCollectFee}
						disabled={isLoading || !canCollectFee}
						className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
						title={
							!isCreator
								? "Only creator can collect fees"
								: !lotteryData?.remainingFee
									? "No fees to collect"
									: "Collect accumulated fees"
						}
					>
						{isLoading
							? "Processing..."
							: canCollectFee
								? `Collect Fee (${mistToSui(lotteryData!.remainingFee)} $pM)`
								: isCreator &&
									lotteryData?.remainingFee === 0 &&
									lotteryData?.winner
									? "Fees Collected ✓"
									: "Collect Fee"}
					</button>

					<button
						onClick={handleCollectPrize}
						disabled={isLoading || !canCollectPrize}
						className="flex-1 px-6 py-3 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
						title={
							!isWinner
								? "Only winner can collect prize"
								: !lotteryData?.prize
									? "Prize already collected"
									: "Collect your prize!"
						}
					>
						{isLoading
							? "Processing..."
							: canCollectPrize
								? `Collect Prize (${mistToSui(lotteryData!.prize)} $pM)`
								: isWinner && lotteryData?.prize === 0
									? "Prize Collected ✓"
									: "Collect Prize"}
					</button>
				</div>


			</div>
		</div>
	)
}
