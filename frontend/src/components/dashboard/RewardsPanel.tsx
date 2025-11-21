import styles from '../../App.module.css'
import type { PrizeItem } from '../../types/prize'

type RewardsPanelProps = {
  prizes: PrizeItem[] | undefined
  authenticated: boolean
  onClaim: (prize: PrizeItem) => void
  claimPending: boolean
  sectionId?: string
}

export function RewardsPanel({
  prizes,
  authenticated,
  onClaim,
  claimPending,
  sectionId,
}: RewardsPanelProps) {
  return (
    <section id={sectionId} className={`${styles.panel} ${styles.prizePanel}`}>
      <div className={styles.panelHeader}>
        <span>Rewards</span>
        {prizes?.length ? <span className={styles.badge}>{prizes.length}</span> : null}
      </div>
      {authenticated ? (
        prizes?.length ? (
          <ul className={styles.prizeList}>
            {prizes.map((prize) => (
              <li key={prize.prizeId} className={styles.prizeItem}>
                <div>
                  <p className={styles.prizeTitle}>#{prize.prizeId.slice(0, 6)}</p>
                  <p className={styles.prizeTier}>Tier {prize.tier}</p>
                </div>
                <span
                  className={`${styles.badge} ${
                    prize.isClaimed ? styles.badgeClaimed : styles.badgeActive
                  }`}
                >
                  {prize.isClaimed ? 'Claimed' : 'Open'}
                </span>
                {!prize.isClaimed && (
                  <button
                    onClick={() => onClaim(prize)}
                    className={styles.primaryButton}
                    disabled={claimPending}
                  >
                    {claimPending ? 'Claiming…' : 'Claim'}
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.emptyState}>Reveal cells to unlock rewards.</p>
        )
      ) : (
        <p className={styles.emptyState}>Connect to sync rewards.</p>
      )}
    </section>
  )
}
