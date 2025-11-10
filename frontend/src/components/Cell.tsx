import styles from './Cell.module.css'

interface CellProps {
  cellId: number
  isRevealed: boolean
  tier?: number
  isHinted: boolean
  onClick: () => void
}

export function Cell({ cellId, isRevealed, tier, isHinted, onClick }: CellProps) {
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
      disabled={isRevealed}
      className={`${styles.cell} ${styles.unrevealed} ${isHinted ? styles.hinted : ''}`}
    >
      <span className={styles.cellNumber}>{cellId}</span>
    </button>
  )
}
