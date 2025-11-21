import styles from '../../App.module.css'
import type { PrizeItem } from '../../types/prize'

type ClaimModalProps = {
  isOpen: boolean
  prize: PrizeItem | null
  onClose: () => void
  onConfirm: () => void
  isPending: boolean
}

export function ClaimModal({ isOpen, prize, onClose, onConfirm, isPending }: ClaimModalProps) {
  if (!isOpen || !prize) return null

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <span className={`${styles.badge} ${styles.badgeActive}`}>Tier {prize.tier}</span>
          <button className={styles.modalClose} onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <h3 className={styles.modalTitle}>Claim #{prize.prizeId.slice(0, 6)}</h3>
        <p className={styles.modalText}>We will fetch the proof and submit the claim transaction.</p>
        <div className={styles.modalActions}>
          <button className={styles.secondaryButton} onClick={onClose}>
            Cancel
          </button>
          <button className={styles.primaryButton} onClick={onConfirm} disabled={isPending}>
            {isPending ? 'Claiming…' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}
