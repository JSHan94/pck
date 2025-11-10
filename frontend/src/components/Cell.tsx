import styles from './Cell.module.css'

interface CellProps {
  cellId: number
  isRevealed: boolean
  tier?: number
  isHinted: boolean
  isLoading: boolean
  onClick: () => void
}

export function Cell({ cellId, isRevealed, tier, isHinted, isLoading, onClick }: CellProps) {
  if (isRevealed && tier !== undefined) {
    const tierClass = styles[`tier${tier}` as keyof typeof styles]
    return (
      <div className={`${styles.cell} ${styles.revealed} ${tierClass}`}>
        T{tier}
      </div>
    )
  }

  return (
    <button
      onClick={onClick}
      disabled={isRevealed || isLoading}
      className={`${styles.cell} ${styles.unrevealed} ${isHinted ? styles.hinted : ''} ${isLoading ? styles.loading : ''}`}
    >
      {isLoading ? (
        <span className={styles.loader} aria-label="Revealing cell" />
      ) : (
        <span className={styles.cellNumber}>{cellId}</span>
      )}
    </button>
  )
}
