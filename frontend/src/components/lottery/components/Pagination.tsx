import { FC, useMemo } from "react"

type PaginationProps = {
	page: number
	pageSize: number
	total: number
	onPageChange: (page: number) => void
}

const Pagination: FC<PaginationProps> = ({
	page,
	pageSize,
	total,
	onPageChange,
}) => {
	const totalPages = useMemo(
		() => Math.max(1, Math.ceil(total / pageSize)),
		[pageSize, total]
	)

	if (totalPages <= 1) return null

	const handleChange = (nextPage: number) => {
		if (nextPage < 1 || nextPage > totalPages || nextPage === page) return
		onPageChange(nextPage)
	}

	return (
		<div className="flex items-center justify-center gap-2 mt-6" role="navigation" aria-label="Pagination">
			<button
				type="button"
				onClick={() => handleChange(page - 1)}
				disabled={page <= 1}
				className={`nes-btn ${page <= 1 ? "is-disabled" : ""}`}
				aria-label="Previous page"
			>
				Previous
			</button>
			{Array.from({ length: totalPages }).map((_, index) => {
				const pageNumber = index + 1
				const isCurrent = pageNumber === page
				return (
					<button
						key={pageNumber}
						type="button"
						onClick={() => handleChange(pageNumber)}
						className={`nes-btn ${isCurrent ? "is-primary" : ""}`}
						aria-label={`Page ${pageNumber}`}
						aria-current={isCurrent ? "page" : undefined}
					>
						{pageNumber}
					</button>
				)
			})}
			<button
				type="button"
				onClick={() => handleChange(page + 1)}
				disabled={page >= totalPages}
				className={`nes-btn ${page >= totalPages ? "is-disabled" : ""}`}
				aria-label="Next page"
			>
				Next
			</button>
		</div>
	)
}

export default Pagination
