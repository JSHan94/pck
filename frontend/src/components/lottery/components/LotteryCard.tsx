import { FC } from "react"
import { LotterySummary } from "../lotteryApi"

type Props = {
	game: LotterySummary
	onSelect: (id: string) => void
}

const LotteryCard: FC<Props> = ({ game, onSelect }) => {
	const isActive = game.isActive
	const statusLabel = isActive ? "Active" : "Ended"

	const slots = game.slots.length ? game.slots : Array(9).fill(false)
	const availableSlots = slots.filter((slot) => !slot).length
	const title = `Lottery ${game.id.slice(0, 6)}...`
	const description = isActive
		? `${availableSlots} slots open • Prize ${game.prize} $M`
		: `Ended • Prize ${game.prize} $M`

	return (
		<button
			type="button"
			onClick={() => onSelect(game.id)}
			className={`nes-container is-rounded with-title is-centered w-full hover:is-dark transition-all ${isActive ? "" : "is-disabled"}`}
			aria-label={`${title} lottery ${statusLabel}`}
			aria-disabled={!isActive}
		>
			<p className="title">{title}</p>
			<div className="relative aspect-square w-full overflow-hidden p-1">
				<div className="w-full h-full bg-white dark:bg-gray-950 overflow-hidden border-4 border-black">
					{/* 3x3 Grid */}
					<div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-1 p-2 bg-gray-200">
						{slots.slice(0, 9).map((isTaken, index) => {
							const isWinning = !isActive && index === game.winningSlot
							const cellClass = isWinning
								? "bg-yellow-400"
								: isTaken
									? "bg-red-500"
									: isActive
										? "bg-blue-400"
										: "bg-gray-400"
							return (
								<div
									key={index}
									className={`${cellClass} border-2 border-black`}
									aria-hidden="true"
								>
									{isWinning && (
										<div className="w-full h-full flex items-center justify-center text-xl">
											🏆
										</div>
									)}
								</div>
							)
						})}
					</div>

					{/* Status Badge */}
					<div className="absolute left-2 top-2">
						<span className={`nes-badge ${isActive ? "is-success" : "is-error"}`}>
							<span className="is-dark">{isActive ? "LIVE" : "END"}</span>
						</span>
					</div>
				</div>
			</div>

			{/* Card Footer */}
			<div className="mt-3 text-left">
				<p className="text-sm">{description}</p>
				<div className="flex items-center gap-2 text-xs mt-2">
					<span>💰 {game.prize} $M</span>
				</div>
			</div>
		</button>
	)
}

export default LotteryCard
