import { GameBoard } from '../GameBoard'
import styles from '../../App.module.css'

type BoardOverlayState = 'loading' | 'connect' | 'start' | null

type BoardSectionProps = {
  sessionId: number | null
  revealedCells: Array<{ cellId: number; tier: number }>
  hintedCells: Set<number>
  loadingCellId: number | null
  onCellClick: (cellId: number) => void
  boardOverlayState: BoardOverlayState
  onConnect: () => void
  onStartSession: () => void
  isPurchasing: boolean
  ready: boolean
  sectionId?: string
}

export function BoardSection({
  sessionId,
  revealedCells,
  hintedCells,
  loadingCellId,
  onCellClick,
  boardOverlayState,
  onConnect,
  onStartSession,
  isPurchasing,
  ready,
  sectionId,
}: BoardSectionProps) {
  const overlayText = boardOverlayState === 'connect' ? 'Connect to start' : 'Buy a ticket to activate'

  return (
    <section className={styles.boardSection} id={sectionId}>
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.sectionLabel}>Live Board</p>
        </div>
      </div>

      <div className={styles.boardShell}>
        <GameBoard
          revealedCells={revealedCells}
          hintedCells={hintedCells}
          loadingCellId={loadingCellId}
          onCellClick={onCellClick}
        />

        {boardOverlayState && (
          <div className={styles.boardOverlay}>
            {boardOverlayState === 'loading' ? (
              <span className={styles.spinner} />
            ) : (
              <>
                <p className={styles.overlayTitle}>{overlayText}</p>
                <button
                  className={styles.primaryButton}
                  onClick={boardOverlayState === 'connect' ? onConnect : onStartSession}
                  disabled={
                    boardOverlayState === 'connect'
                      ? !ready
                      : Boolean(sessionId) || isPurchasing
                  }
                >
                  {boardOverlayState === 'connect'
                    ? 'Connect'
                    : isPurchasing
                      ? 'Purchasing…'
                      : 'Start Run'}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

export type { BoardOverlayState }
