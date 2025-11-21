import type { TicketPurchaseRecord } from '../../hooks/useGameQueries'
import styles from '../../App.module.css'

type TicketPanelProps = {
  ticketPurchase: TicketPurchaseRecord | null | undefined
  onCopyTxHash: () => void
}

export function TicketPanel({ ticketPurchase, onCopyTxHash }: TicketPanelProps) {
  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <span>Tickets</span>
        {ticketPurchase?.sessionId && <span className={styles.badge}>#{ticketPurchase.sessionId}</span>}
      </div>
      {ticketPurchase?.txHash ? (
        <>
          <div className={styles.ticketDetail}>
            <span>Tx</span>
            <span className={styles.ticketHash}>
              {ticketPurchase.txHash.slice(0, 10)}...{ticketPurchase.txHash.slice(-6)}
            </span>
          </div>
          <button onClick={onCopyTxHash} className={styles.ghostButton}>
            Copy hash
          </button>
        </>
      ) : (
        <p className={styles.emptyState}>No ticket yet.</p>
      )}
    </div>
  )
}
