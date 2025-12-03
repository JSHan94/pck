import { FC, useEffect, useMemo, useState } from "react"
import { useNavigation } from "../../../providers/navigation/NavigationContext"
import { LotteryGrid } from "./LotteryGrid"
import {
	LotterySummary,

	collectFeeMock,
	collectPrizeMock,
	fetchLotteryDetail,
	pickSlotMock,
} from "../lotteryApi"
import { useCurrentAccount } from "../../../lib/wallet"
import { mistToSui } from "../../../config/constants"


type Props = {
	gameId: string
}

const LotteryDetailPage: FC<Props> = ({ gameId }) => {
	const { navigate } = useNavigation()
	const currentAccount = useCurrentAccount()

	const [lottery, setLottery] = useState<LotterySummary | null>(null)
	const [isLoading, setIsLoading] = useState(false)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [selectedSlot, setSelectedSlot] = useState<number | null>(null)
	const [showConfirm, setShowConfirm] = useState(false)
	const [statusMessage, setStatusMessage] = useState<string>("")


	useEffect(() => {
		setSelectedSlot(null)
	}, [gameId])

	useEffect(() => {
		let isMounted = true
		const load = async () => {
			setIsLoading(true)
			const detail = await fetchLotteryDetail(gameId)
			if (!isMounted) return
			setLottery(detail)
			setIsLoading(false)
			setStatusMessage("")
		}
		load()
		return () => {
			isMounted = false
		}
	}, [gameId])

	const handleSlotSelect = (slot: number) => {
		if (!lottery) return
		if (!lottery.isActive || lottery.slots[slot]) {
			setSelectedSlot(slot)
			return
		}

		setSelectedSlot(slot)
		setShowConfirm(true)
	}

	const handlePickSlot = async () => {
		if (!lottery || selectedSlot === null || !lottery.isActive) return

		if (!currentAccount) {
			setStatusMessage("지갑을 연결해주세요.")
			return
		}
		setIsSubmitting(true)
		setStatusMessage("Picking slot...")

		try {
			const updated = pickSlotMock(lottery.id, selectedSlot, currentAccount.address)
			setLottery(updated)
			setStatusMessage("Slot picked! Play updated.")
			setShowConfirm(false)
			setIsSubmitting(false)
		} catch (error: any) {
			setStatusMessage(`Error: ${error.message}`)
			setIsSubmitting(false)
		}
	}

	const availableSlots = useMemo(
		() => (lottery ? lottery.slots.filter((s) => !s).length : 0),
		[lottery]
	)

	const isCreator =
		currentAccount?.address && lottery?.creator
			? currentAccount.address === lottery.creator
			: false
	const isWinner =
		currentAccount?.address && lottery?.winner
			? currentAccount.address === lottery.winner
			: false
	const canCollectFee = isCreator && lottery?.remainingFeeMist && lottery.remainingFeeMist > 0
	const canCollectPrize = isWinner && lottery?.prizeMist && lottery.prizeMist > 0 && !lottery.prizeClaimed

	const handleCollectFee = async () => {
		if (!lottery || !isCreator) return
		setIsSubmitting(true)
		setStatusMessage("Collecting fees...")
		try {
			const updated = collectFeeMock(lottery.id, currentAccount!.address)
			setLottery(updated)
			setStatusMessage("Fees collected.")
			setIsSubmitting(false)
		} catch (error: any) {
			setStatusMessage(`Error: ${error.message}`)
			setIsSubmitting(false)
		}
	}

	const handleCollectPrize = async () => {
		if (!lottery || !isWinner) return
		setIsSubmitting(true)
		setStatusMessage("Collecting prize...")
		try {
			const updated = collectPrizeMock(lottery.id, currentAccount!.address)
			setLottery(updated)
			setStatusMessage("Prize collected.")
			setIsSubmitting(false)
		} catch (error: any) {
			setStatusMessage(`Error: ${error.message}`)
			setIsSubmitting(false)
		}
	}



	if (!lottery && !isLoading) {
		return (
			<section className="space-y-4">
				<button
					type="button"
					onClick={() => navigate("/")}
					className="nes-btn"
					aria-label="Back to lottery list"
				>
					<i className="nes-icon is-small left"></i> Back to Plays
				</button>
				<div className="nes-container is-rounded is-centered">
					<div className="text-6xl mb-4">🎰</div>
					<p className="title">Play not found</p>
				</div>
			</section>
		)
	}

	const isActive = lottery?.isActive ?? false

	return (
		<section className="space-y-6 animate-slide-up">
			<div className="flex items-center justify-between gap-3">
				<button
					type="button"
					onClick={() => navigate("/")}
					className="nes-btn"
					aria-label="Back to lottery list"
				>
					<i className="nes-icon is-small left"></i> Back
				</button>
			</div>
			<div className="nes-container with-title">
				<p className="title">Play Details</p>
				{isLoading && (
					<div className="nes-container is-rounded" style={{ height: '100px' }} aria-busy="true" />
				)}
				{lottery && (
					<div className="space-y-4">
						<div className="flex items-start justify-between gap-3">
							<div>
								<h2 className="title">Play {lottery.id.slice(0, 6)}...</h2>
								<p className="text-sm">
									{lottery.slotCount} slots • {lottery.prize} $pM prize • {lottery.fee} $pM fee • {availableSlots} open
								</p>
							</div>
							<div className={`nes-badge ${isActive ? "is-success" : "is-error"}`}>
								<span className="is-dark">{isActive ? "LIVE" : "END"}</span>
							</div>
						</div>
						<div className="nes-table-responsive">
							<table className="nes-table is-bordered is-centered w-full">
								<thead>
									<tr>
										<th>Status</th>
										<th>Prize</th>
										<th>Fee</th>
										<th>Updated</th>
									</tr>
								</thead>
								<tbody>
									<tr>
										<td>{isActive ? "Active" : "Ended"}</td>
										<td>{lottery.prize} $pM</td>
										<td>{lottery.remainingFee} $pM</td>
										<td>{lottery.createdAt || "Recently"}</td>
									</tr>
								</tbody>
							</table>
						</div>
						<p className="text-xs text-gray-500 flex items-center gap-1">
							<i className="nes-icon coin is-small"></i> On-chain data will appear once the contract ABI is connected to this RPC
						</p>
					</div>
				)}
			</div>
			{lottery && (
				<LotteryGrid
					slots={lottery.slots}
					isActive={isActive}
					winningSlot={lottery.winningSlot}
					selectedSlot={selectedSlot}
					onSlotSelect={handleSlotSelect}
				/>
			)}
			{lottery && (
				<div className="nes-container with-title">
					<p className="title">Collect Payouts</p>
					<div className="grid gap-4 md:grid-cols-2">
						<button
							type="button"
							onClick={handleCollectFee}
							disabled={!canCollectFee || isSubmitting}
							className={`nes-btn ${canCollectFee ? "is-primary" : "is-disabled"}`}
							title={
								!isCreator
									? "Only the creator can collect fees"
									: lottery.remainingFeeMist === 0
										? "No fees remaining"
										: "Collect creator fees"
							}
						>
							{isSubmitting && canCollectFee
								? "Processing..."
								: canCollectFee
									? `Collect Fee (${lottery.remainingFee} $pM)`
									: "Collect Fee"}
						</button>
						<button
							type="button"
							onClick={handleCollectPrize}
							disabled={!canCollectPrize || isSubmitting}
							className={`nes-btn ${canCollectPrize ? "is-warning" : "is-disabled"}`}
							title={
								!isWinner
									? "Only winner can collect prize"
									: lottery.prizeClaimed
										? "Prize already claimed"
										: "Collect prize"
							}
						>
							{isSubmitting && canCollectPrize
								? "Processing..."
								: canCollectPrize
									? `Collect Prize (${lottery.prize} $pM)`
									: lottery.prizeClaimed
										? "Prize Claimed"
										: "Collect Prize"}
						</button>
					</div>

				</div>
			)}

			{statusMessage && (
				<div className="nes-container is-rounded">
					<p>{statusMessage}</p>
				</div>
			)}
			{showConfirm && lottery && selectedSlot !== null && (
				<div
					className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
					role="dialog"
					aria-modal="true"
					aria-label="Confirm pick slot"
					onClick={() => !isSubmitting && setShowConfirm(false)}
				>
					<div
						className="nes-dialog is-rounded bg-white p-4"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="text-center">
							<h3 className="title">Confirm Pick</h3>
						</div>
						<p className="text-center">
							Entry fee: <strong>{mistToSui(lottery.feeMist)} $pM</strong>
						</p>
						<div className="flex gap-3 mt-4">
							<button
								type="button"
								onClick={() => setShowConfirm(false)}
								className="nes-btn"
								disabled={isSubmitting}
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={handlePickSlot}
								disabled={isSubmitting}
								className="nes-btn is-primary"
							>
								{isSubmitting ? "Processing..." : "Pick Slot!"}
							</button>
						</div>
					</div>
				</div>
			)}

		</section>
	)
}

export default LotteryDetailPage
