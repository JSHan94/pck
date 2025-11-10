import { GRID_SIZE } from '@pck/shared'
import { Cell } from './Cell'
import styles from './GameBoard.module.css'

interface GameBoardProps {
  revealedCells: Array<{ cellId: number; tier: number }>
  hintedCells: Set<number>
  onCellClick: (cellId: number) => void
}

export function GameBoard({ revealedCells, hintedCells, onCellClick }: GameBoardProps) {
  const revealedMap = new Map(revealedCells.map((cell) => [cell.cellId, cell.tier]))

  return (
    <div
      className={styles.board}
      style={{
        gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
      }}
    >
      {Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, index) => {
        const tier = revealedMap.get(index)
        const isRevealed = tier !== undefined
        const isHinted = hintedCells.has(index)

        return (
          <Cell
            key={index}
            cellId={index}
            isRevealed={isRevealed}
            tier={tier}
            isHinted={isHinted}
            onClick={() => onCellClick(index)}
          />
        )
      })}
    </div>
  )
}
