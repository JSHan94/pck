import { FC } from "react"

interface LotteryGridProps {
	slots: boolean[]
	isActive: boolean
	winningSlot: number
	selectedSlot: number | null
	onSlotSelect: (index: number) => void
}

export const LotteryGrid: FC<LotteryGridProps> = ({
	slots,
	isActive,
	winningSlot,
	selectedSlot,
	onSlotSelect,
}) => {
	return (
		<div className="nes-container with-title is-centered">
			<p className="title">Pick Your Slot</p>

			{/* 3x3 Grid */}
			<div className="grid grid-cols-3 gap-4 mb-8 max-w-lg mx-auto p-4">
				{slots.map((isTaken, index) => {
					const isWinning = !isActive && index === winningSlot
					const isSelected = selectedSlot === index
					const isAvailable = isActive && !isTaken

					return (
						<button
							key={index}
							type="button"
							onClick={() => isAvailable ? onSlotSelect(index) : null}
							disabled={!isAvailable}
							className={`nes-btn ${isWinning ? "is-warning" : isTaken ? "is-error" : isSelected ? "is-success" : isAvailable ? "is-primary" : "is-disabled"}`}
							style={{ width: '100%', height: '100%', minHeight: '60px' }}
						>
							{isWinning ? "🏆" : index}
						</button>
					)
				})}
			</div>

			{/* Legend */}
			<div className="flex flex-wrap gap-4 text-sm justify-center items-center pt-4 border-t border-black">
				<div className="flex items-center gap-2">
					<button className="nes-btn is-primary is-small" style={{ pointerEvents: 'none' }}></button>
					<span>Available</span>
				</div>
				<div className="flex items-center gap-2">
					<button className="nes-btn is-success is-small" style={{ pointerEvents: 'none' }}></button>
					<span>Selected</span>
				</div>
				<div className="flex items-center gap-2">
					<button className="nes-btn is-error is-small" style={{ pointerEvents: 'none' }}></button>
					<span>Taken</span>
				</div>
				<div className="flex items-center gap-2">
					<button className="nes-btn is-warning is-small" style={{ pointerEvents: 'none' }}>🏆</button>
					<span>Winner</span>
				</div>
			</div>
		</div>
	)
}
