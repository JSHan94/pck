import { FC, useState, useEffect, useCallback } from "react"
import { useCurrentAccount } from "../../lib/wallet"
import { mistToSui } from "../../config/constants"

import { LotteryPlay } from "./components/LotteryPlay"
import { LotteryGrid } from "./components/LotteryGrid"
import { fetchAllLotteries as fetchLotteriesLive, fetchLotteryDetail } from "./lotteryApi"

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

const LotteryInteraction: FC = () => {
	const currentAccount = useCurrentAccount()


	const [lotteryObjectId, setLotteryObjectId] = useState<string>("")
	const [slotIndex, setSlotIndex] = useState<number | null>(null)
	const [status, setStatus] = useState<string>("")
	const [isLoading, setIsLoading] = useState<boolean>(false)

	// Lottery objects list
	const [lotteryObjects, setLotteryObjects] = useState<
		Array<{
			id: string
			isActive: boolean
			slotCount: number
		}>
	>([])
	const [isLoadingLotteries, setIsLoadingLotteries] = useState<boolean>(false)

	// Lottery state visualization
	const [lotteryData, setLotteryData] = useState<LotteryData | null>(null)

	const handleQueryLottery = useCallback(async () => {
		if (!lotteryObjectId) return

		setIsLoading(true)
		setStatus("Querying play...")

		try {
			const object = await fetchLotteryDetail(lotteryObjectId)

			console.log("Lottery object:", object)

			if (object) {
				const slots = object.slots || []
				const winner = object.winner

				setStatus(`Play Status:
  Active: ${object.isActive}
  Prize: ${mistToSui(object.prizeMist)} $pM${object.prizeClaimed
						? " (Claimed Anonymously ✓)"
						: object.prizeMist === 0
							? " (Collected ✓)"
							: ""
					}
  Entry Fee: ${mistToSui(object.feeMist)} $pM per slot
  Remaining Fee: ${mistToSui(object.remainingFeeMist)} $pM${object.remainingFeeMist === 0 && winner ? " (Collected ✓)" : ""
					}
  Taken Slots: ${slots.filter((s: boolean) => s).length}/${slots.length}
  ${winner ? `Winner: ${winner}` : "No winner yet"}
  ${object.prizeClaimed ? "Prize has been claimed anonymously" : ""}`)
				setLotteryData({
					slots,
					isActive: object.isActive,
					winningSlot: object.winningSlot,
					creator: object.creator,
					winner,
					prize: object.prizeMist,
					remainingFee: object.remainingFeeMist,
					prizeClaimed: object.prizeClaimed,
					fee: object.feeMist,
				})
			} else {
				setStatus("Could not read play data")
			}

			setIsLoading(false)
		} catch (error: any) {
			console.error("Error querying lottery:", error)
			setStatus(`Error: ${error.message}`)
			setIsLoading(false)
		}
	}, [lotteryObjectId])

	// Auto-query lottery when object ID changes
	useEffect(() => {
		if (lotteryObjectId) {
			handleQueryLottery()
		} else {
			setLotteryData(null)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [lotteryObjectId])

	const fetchAllLotteries = async () => {
		setIsLoadingLotteries(true)
		try {
			const lotteriesResponse = await fetchLotteriesLive(1, 50)
			const lotteries = lotteriesResponse.data.map((game) => ({
				id: game.id,
				isActive: game.isActive,
				slotCount: game.slots.length,
			}))

			const validLotteries = lotteries.filter((l) => l !== null)

			setLotteryObjects(validLotteries)

			if (validLotteries.length > 0 && !lotteryObjectId) {
				setLotteryObjectId(validLotteries[0].id)
			}

			setStatus(`Loaded ${validLotteries.length} play object(s) from mock data`)
		} catch (error: any) {
			console.error("Error fetching lotteries:", error)
			setStatus(
				`Error fetching plays: ${error.message}. Make sure you've created at least one play.`
			)
		}
		setIsLoadingLotteries(false)
	}

	return (
		<div className="max-w-4xl mx-auto p-6">
			<h2 className="text-3xl font-bold mb-8">$pM Random Play</h2>

			Play Selection
			<div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
				<div className="flex items-center justify-between mb-2">
					<label className="block text-sm font-medium">Select Play:</label>
					<button
						onClick={fetchAllLotteries}
						disabled={isLoadingLotteries}
						className="text-xs px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
					>
						{isLoadingLotteries ? "Loading..." : "Refresh List"}
					</button>
				</div>
				<select
					value={lotteryObjectId}
					onChange={(e) => setLotteryObjectId(e.target.value)}
					className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
				>
					<option value="">Select a play...</option>
					{lotteryObjects.map((lottery) => (
						<option key={lottery.id} value={lottery.id}>
							{lottery.id.slice(0, 10)}...{lottery.id.slice(-8)} -{" "}
							{lottery.slotCount} slots -{" "}
							{lottery.isActive ? "Active" : "Ended"}
						</option>
					))}
				</select>
				{lotteryObjects.length === 0 && (
					<p className="text-xs text-gray-500 mt-1">
						No plays found. Click "Refresh List" or create a new play.
					</p>
				)}
			</div>

			{/* Lottery Grid Visualization */}
			{lotteryData && (
				<LotteryGrid
					slots={lotteryData.slots}
					isActive={lotteryData.isActive}
					winningSlot={lotteryData.winningSlot}
					selectedSlot={slotIndex}
					onSlotSelect={setSlotIndex}
				/>
			)}

			{/* Play Lottery Section */}
			{lotteryObjectId && (
				<LotteryPlay
					lotteryObjectId={lotteryObjectId}
					lotteryData={lotteryData}
					slotIndex={slotIndex}
					currentAccountAddress={currentAccount?.address}

					isLoading={isLoading}
					onLoadingChange={setIsLoading}
					onStatusChange={setStatus}
					onLotteryUpdate={handleQueryLottery}
				/>
			)}

			{/* Status Section */}
			{status && (
				<div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
					<h3 className="text-xl font-semibold mb-4">Status</h3>
					<pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-md overflow-x-auto whitespace-pre-wrap text-sm">
						{status}
					</pre>
				</div>
			)}

			{/* Instructions */}
			<div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
				<h4 className="font-semibold mb-2">How to Play:</h4>
				<ol className="list-decimal list-inside space-y-1 text-sm">
					<li>Connect your wallet using the navbar</li>

					<li>
						<strong>Creating a play:</strong> Click "Create Play" and
						configure the prize pool and entry fee. The prize pool you set
						will be locked in the play contract.
					</li>
					<li>
						<strong>Playing:</strong> Select an existing play from the
						dropdown, click any available slot in the 3x3 grid, then "Pick
						Slot". The entry fee per play is shown in the play details.
					</li>
					<li>
						<strong>Winning:</strong> If you win, your slot turns gold!
					</li>
					<li>
						<strong>Claiming prizes:</strong> Winners can collect
						directly as the known winner using "Collect Prize".
					</li>
					<li>
						<strong>Creator fees:</strong> If you created the play, click
						"Collect Fee" to get accumulated player fees.
					</li>
				</ol>
			</div>
		</div>
	)
}

export default LotteryInteraction
