import { FC, useCallback, useEffect, useMemo, useState } from "react"
import { useNavigation } from "../../../providers/navigation/NavigationContext"
import LotteryCard from "./LotteryCard"
import Pagination from "./Pagination"
import { LotterySummary, fetchAllLotteries } from "../lotteryApi"
import { LotteryCreation } from "./LotteryCreation"

const PAGE_SIZE = 12
type FilterMode = "latest" | "active" | "prize"

const LotteryGridList: FC = () => {
	const { navigate } = useNavigation()
	const [games, setGames] = useState<LotterySummary[]>([])
	const [page, setPage] = useState(1)
	const [total, setTotal] = useState(0)
	const [isLoading, setIsLoading] = useState(false)
	const [filterMode, setFilterMode] = useState<FilterMode>("latest")
	const [showCreateModal, setShowCreateModal] = useState(false)

	const loadPage = useCallback(async (targetPage: number) => {
		setIsLoading(true)
		const response = await fetchAllLotteries(targetPage, PAGE_SIZE)
		setGames(response.data)
		setTotal(response.total)
		setIsLoading(false)
	}, [])

	const handleCreateClick = () => {
		setShowCreateModal(true)
	}

	useEffect(() => {
		loadPage(page)
	}, [page, loadPage])

	const handleSelect = (gameId: string) => {
		navigate(`/lottery/${gameId}`)
	}

	const displayedGames = useMemo(() => {
		const sorted = games.slice().sort((a, b) => {
			if (filterMode === "prize") {
				return (b.prizeValue || 0) - (a.prizeValue || 0)
			}
			if (filterMode === "active") {
				if (a.isActive !== b.isActive) return a.isActive ? -1 : 1
				return (b.createdAtMs || 0) - (a.createdAtMs || 0)
			}
			// default: active first, newest first
			if (a.isActive !== b.isActive) return a.isActive ? -1 : 1
			return (b.createdAtMs || 0) - (a.createdAtMs || 0)
		})

		if (filterMode === "active") {
			return sorted.filter((game) => game.isActive)
		}
		return sorted
	}, [filterMode, games])

	return (
		<section className="nes-container with-title is-centered">
			<h3 className="title">Active Plays</h3>
			{/* Header Section */}
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
				<div>
					<p className="text-sm">
						Showing {Math.min(games.length, PAGE_SIZE)} of {total} plays
					</p>
				</div>

				<div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
					{/* Refresh Button */}
					<button
						type="button"
						onClick={() => loadPage(page)}
						disabled={isLoading}
						className={`nes-btn is-primary h-12 flex items-center justify-center ${isLoading ? "is-disabled" : ""}`}
						aria-label="Refresh plays"
					>
						Refresh
					</button>

					{/* Filter Dropdown */}
					<div className="nes-select">
						<select
							required
							value={filterMode}
							onChange={(e) => setFilterMode(e.target.value as FilterMode)}
							className="h-12 !min-h-0"
						>
							<option value="latest">Active first • Newest</option>
							<option value="active">Active only</option>
							<option value="prize">Prize (high to low)</option>
						</select>
					</div>

					{/* Create Button */}
					<button
						type="button"
						onClick={handleCreateClick}
						className="nes-btn is-success h-12 flex items-center justify-center"
					>
						Create
					</button>
				</div>
			</div>

			{/* Lottery Grid */}
			<div
				className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
				role="grid"
				aria-live="polite"
			>
				{isLoading &&
					Array.from({ length: PAGE_SIZE }).map((_, index) => (
						<div
							key={index}
							className="nes-container is-rounded"
							style={{ height: '300px' }}
						/>
					))}
				{!isLoading &&
					displayedGames.map((game) => (
						<div role="gridcell" key={game.id}>
							<LotteryCard game={game} onSelect={handleSelect} />
						</div>
					))}
				{!isLoading && displayedGames.length === 0 && (
					<div className="col-span-full text-center py-16">
						<div className="text-6xl mb-4"></div>
						<p className="text-xl font-semibold text-brand-tertiary dark:text-gray-300">
							No games available
						</p>
						<p className="text-sm text-brand-tertiary dark:text-gray-400 mt-2">
							Be the first to create one!
						</p>
					</div>
				)}
			</div>

			{/* Pagination */}
			<Pagination
				page={page}
				pageSize={PAGE_SIZE}
				total={total}
				onPageChange={setPage}
			/>

			{/* Create Modal */}
			{showCreateModal && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-slide-up"
					role="dialog"
					aria-modal="true"
					aria-label="Create new play"
					onClick={() => setShowCreateModal(false)}
				>
					<div
						className="nes-dialog is-rounded bg-white p-4 relative"
						onClick={(e) => e.stopPropagation()}
					>
						<button
							type="button"
							onClick={() => setShowCreateModal(false)}
							className="absolute top-4 right-4 text-2xl text-brand-tertiary hover:text-brand-primary dark:text-gray-300 dark:hover:text-gray-100 transition-colors"
							aria-label="Close create play modal"
						>
							✕
						</button>
						<div id="create-lottery-section">
							<LotteryCreation
								isLoading={isLoading}
								onLoadingChange={setIsLoading}
								onStatusChange={() => { }}
								onLotteryCreated={() => {
									setShowCreateModal(false)
									loadPage(page)
								}}
							/>
						</div>
					</div>
				</div>
			)}
		</section>
	)
}

export default LotteryGridList
