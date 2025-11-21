import styles from '../../App.module.css'

type SessionPanelProps = {
  sessionId: number | null
  isPurchasing: boolean
  onStartSession: () => void
  onHint: () => void
  isHintReady: boolean
  nextHintCount: number
  pullCount: number
  totalCells: number
  isAdmin: boolean
  onForceReset: () => void
  isResetting: boolean
}

export function SessionPanel({
  sessionId,
  isPurchasing,
  onStartSession,
  onHint,
  isHintReady,
  nextHintCount,
  pullCount,
  totalCells,
  isAdmin,
  onForceReset,
  isResetting,
}: SessionPanelProps) {
  return (
    <div className={styles.panel}>
      <button
        onClick={onStartSession}
        disabled={Boolean(sessionId) || isPurchasing}
        className={styles.primaryButton}
      >
        {sessionId ? 'Board Active' : isPurchasing ? 'Purchasing…' : 'Start Run'}
      </button>
      <div className={styles.controlGrid}>
        <button
          onClick={onHint}
          disabled={!sessionId || pullCount === 0 || !isHintReady}
          className={styles.secondaryButton}
        >
          Hint {isHintReady ? 'Ready' : `+${nextHintCount}`}
        </button>
        {isAdmin && (
          <button
            onClick={onForceReset}
            disabled={isResetting}
            className={styles.secondaryButton}
          >
            {isResetting ? 'Resetting…' : 'Force Reset'}
          </button>
        )}
      </div>
      <div className={styles.sessionStats}>
        <div>
          <span className={styles.sessionLabel}>Pulls Left</span>
          <strong>{Math.max(totalCells - pullCount, 0)}</strong>
        </div>
        <div>
          <span className={styles.sessionLabel}>Hint</span>
          <strong>{isHintReady ? 'Ready' : `+${nextHintCount}`}</strong>
        </div>
      </div>
    </div>
  )
}
