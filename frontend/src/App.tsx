import { useState } from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { toast } from 'react-hot-toast'
import { GRID_SIZE, TOTAL_CELLS, HINT_INTERVAL } from '@pck/shared'
import { GameBoard } from './components/GameBoard'
import {
  useGameBoard,
  useUserState,
  usePull,
  useHint,
  useStartSession,
  usePrizes,
  useTicketPurchaseInfo,
  useClaimPrize,
  type TransactionStage,
} from './hooks/useGameQueries'
import { useWalletBalance } from './hooks/useWalletBalance'
import { useAdminStatus, useAdminReset } from './hooks/useAdminTools'
import styles from './App.module.css'

type PrizeItem = {
  prizeId: string
  tier: number
  isClaimed: boolean
}

function App() {
  const { ready, authenticated, login, logout } = usePrivy()
  const { wallets } = useWallets()

  const wallet = wallets[0]
  const address = wallet?.address

  // Fetch wallet balance
  const { data: balance } = useWalletBalance(address)

  // TanStack Query hooks
  const { data: boardData } = useGameBoard()
  const { data: userStateData } = useUserState()
  const pullMutation = usePull()
  const { data: adminStatus } = useAdminStatus(address)
  const adminReset = useAdminReset(address)
  const startSession = useStartSession()
  const claimPrize = useClaimPrize()
  const { data: prizes } = usePrizes(authenticated)
  const { data: ticketPurchase } = useTicketPurchaseInfo()

  // Local state for hints & animations
  const [hintedCells, setHintedCells] = useState<Set<number>>(new Set())
  const [activeCellId, setActiveCellId] = useState<number | null>(null)
  const [selectedPrize, setSelectedPrize] = useState<PrizeItem | null>(null)
  const [isClaimModalOpen, setClaimModalOpen] = useState(false)

  const revealedCells = boardData?.revealedCells || []
  const pullCount = userStateData?.pullCount || 0
  const isAdmin = Boolean(adminStatus?.isAdmin)
  const sessionId = userStateData?.sessionId ?? null
  const { refetch: refetchHint } = useHint(sessionId ?? undefined)

  const openClaimModal = (prize: PrizeItem) => {
    setSelectedPrize(prize)
    setClaimModalOpen(true)
  }

  const closeClaimModal = () => {
    setClaimModalOpen(false)
    setSelectedPrize(null)
  }

  const handleCellClick = (cellId: number) => {
    // Check if cell is already revealed
    if (revealedCells.some((cell: { cellId: number; tier: number }) => cell.cellId === cellId)) {
      return
    }

    if (!sessionId) {
      toast.error('No active session found. Please start a new game before pulling cells.')
      return
    }

    setActiveCellId(cellId)

    pullMutation.mutate(
      {
        cellId,
        sessionId,
      },
      {
        onError: () => {
          setActiveCellId(null)
        },
        onSettled: () => {
          setActiveCellId(null)
        },
      },
    )
  }

  const handleHint = async () => {
    if (!sessionId) {
      toast.error('No active session found. Please start a new game before requesting hints.')
      return
    }

    const { data } = await refetchHint()
    if (data) {
      setHintedCells(new Set([data.tier4PlusCell, data.tier5PlusCell]))
    }
  }

  const handleForceReset = () => {
    adminReset.mutate(undefined, {
      onSuccess: () => {
        toast.success('Board reset requested. Refreshing data...')
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : 'Failed to reset board')
      },
    })
  }

  const handleStartSession = async () => {
    if (!authenticated) {
      toast.error('Connect your wallet to start a new session.')
      return
    }

    let toastId: string | undefined
    const stageMessages: Record<Exclude<TransactionStage, 'success'>, string> = {
      submitting: 'Confirm the buyTicket transaction in your wallet…',
      awaiting_confirmation: 'Waiting for on-chain confirmation…',
      verifying: 'Verifying your transaction receipt…',
    }

    const updateToast = (message: string) => {
      toastId = toast.loading(message, { id: toastId })
    }

    try {
      const result = await startSession.mutateAsync({
        onProgress: (stage) => {
          if (stage === 'success') return
          const message = stageMessages[stage]
          if (message) {
            updateToast(message)
          }
        },
      })
      toast.success(
        `Ticket purchased for session #${result.sessionId}. Tx: ${result.txHash.slice(0, 10)}...`,
        { id: toastId },
      )
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to start session', {
        id: toastId,
      })
    }
  }

  const handleCopyTxHash = async () => {
    if (!ticketPurchase?.txHash) return
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      toast.error('Clipboard not available in this environment.')
      return
    }

    try {
      await navigator.clipboard.writeText(ticketPurchase.txHash)
      toast.success('Transaction hash copied to clipboard.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to copy transaction hash.')
    }
  }

  const handleClaimPrize = async () => {
    if (!selectedPrize) return

    let toastId: string | undefined
    const stageMessages: Record<Exclude<TransactionStage, 'success'>, string> = {
      submitting: 'Confirm the claim transaction in your wallet…',
      awaiting_confirmation: 'Waiting for on-chain confirmation…',
      verifying: 'Verifying claim receipt…',
    }

    const updateToast = (message: string) => {
      toastId = toast.loading(message, { id: toastId })
    }

    try {
      const result = await claimPrize.mutateAsync({
        prizeId: selectedPrize.prizeId,
        onProgress: (stage) => {
          if (stage === 'success') return
          const message = stageMessages[stage]
          if (message) updateToast(message)
        },
      })
      toast.success(`Prize claimed successfully. Tx: ${result.txHash.slice(0, 10)}...`, {
        id: toastId,
      })
      closeClaimModal()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to claim prize.', {
        id: toastId,
      })
    }
  }

  return (
    <div className={styles.app}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>PCK Gacha dApp</h1>

          {/* Login/Logout Button */}
          {ready && (
            <div className={styles.auth}>
              {authenticated && address ? (
                <>
                  <div className={styles.walletInfo}>
                    <p className={styles.walletLabel}>Connected Wallet:</p>
                    <p className={styles.walletAddress}>{address.slice(0, 6)}...{address.slice(-4)}</p>
                    {balance && (
                      <p className={styles.walletBalance}>
                        Balance: {parseFloat(balance).toFixed(4)} ETH
                      </p>
                    )}
                  </div>
                  <button
                    onClick={logout}
                    className={`${styles.button} ${styles.logoutButton}`}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <button
                  onClick={login}
                  className={`${styles.button} ${styles.loginButton}`}
                >
                  Connect Wallet
                </button>
              )}
            </div>
          )}
        </div>

        {/* Game Info */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Game Information</h2>
          <div className={styles.info}>
            <p className={styles.infoText}>Grid Size: {GRID_SIZE}x{GRID_SIZE}</p>
            <p className={styles.infoText}>Total Cells: {TOTAL_CELLS}</p>
          </div>
        </div>

        {/* Game Board */}
        {authenticated && (
          <div className={styles.card}>
            <div className={styles.boardHeader}>
              <h2 className={styles.cardTitle}>Game Board</h2>
              <div className={styles.boardControls}>
                <button
                  onClick={handleStartSession}
                  disabled={!!sessionId || startSession.isPending}
                  className={`${styles.button} ${styles.startButton}`}
                >
                  {sessionId ? 'Session Active' : startSession.isPending ? 'Purchasing...' : 'Start Game'}
                </button>
                <p className={styles.pullCount}>Pull Count: {pullCount}/{TOTAL_CELLS}</p>
                <button
                  onClick={handleHint}
                  disabled={!sessionId || pullCount % HINT_INTERVAL !== 0 || pullCount === 0}
                  className={styles.hintButton}
                >
                  Get Hint {pullCount % HINT_INTERVAL === 0 && pullCount > 0 ? '✨' : `(${HINT_INTERVAL - (pullCount % HINT_INTERVAL)})`}
                </button>
                {isAdmin && (
                  <button
                    onClick={handleForceReset}
                    disabled={adminReset.isPending}
                    className={`${styles.button} ${styles.adminButton}`}
                  >
                    {adminReset.isPending ? 'Resetting...' : 'Force Reset'}
                  </button>
                )}
              </div>
            </div>
            <GameBoard
              revealedCells={revealedCells}
              hintedCells={hintedCells}
              loadingCellId={activeCellId}
              onCellClick={handleCellClick}
            />
          </div>
        )}

        {authenticated && ticketPurchase && (
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Latest Ticket Purchase</h2>
            <div className={styles.info}>
              <p className={styles.infoText}>Session #{ticketPurchase.sessionId}</p>
              <p className={styles.infoText}>
                Tx Hash:{' '}
                <span className={styles.walletAddress}>
                  {ticketPurchase.txHash.slice(0, 10)}...{ticketPurchase.txHash.slice(-6)}
                </span>
              </p>
              <button
                onClick={handleCopyTxHash}
                className={`${styles.button} ${styles.startButton}`}
              >
                Copy Tx Hash
              </button>
            </div>
          </div>
        )}

        {authenticated && (
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Your Prizes</h2>
            {prizes?.length ? (
              <ul className={styles.prizeList}>
                {prizes.map((prize: PrizeItem) => (
                  <li key={prize.prizeId} className={styles.prizeItem}>
                    <div>
                      <p className={styles.prizeTitle}>Prize #{prize.prizeId.slice(0, 6)}</p>
                      <p className={styles.prizeTier}>Tier {prize.tier}</p>
                    </div>
                    <span
                      className={
                        prize.isClaimed ? styles.prizeStatusClaimed : styles.prizeStatusUnclaimed
                      }
                    >
                      {prize.isClaimed ? 'Claimed' : 'Unclaimed'}
                    </span>
                    {!prize.isClaimed && (
                      <button
                        onClick={() => openClaimModal(prize)}
                        className={`${styles.button} ${styles.claimButton}`}
                        disabled={claimPrize.isPending}
                      >
                        Claim
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.emptyState}>No prizes yet. Keep revealing cells!</p>
            )}
          </div>
        )}
      {isClaimModalOpen && selectedPrize && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Claim Prize</h3>
              <button className={styles.modalClose} onClick={closeClaimModal} aria-label="Close">
                ×
              </button>
            </div>
            <div className={styles.modalContent}>
              <p className={styles.modalText}>
                You are about to claim <strong>Prize #{selectedPrize.prizeId.slice(0, 6)}</strong>
              </p>
              <p className={styles.modalText}>Tier: {selectedPrize.tier}</p>
              <p className={styles.modalHint}>Submitting will fetch your proof and send the claim transaction.</p>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.modalSecondary} onClick={closeClaimModal}>
                Cancel
              </button>
              <button
                className={`${styles.button} ${styles.startButton}`}
                onClick={handleClaimPrize}
                disabled={claimPrize.isPending}
              >
                {claimPrize.isPending ? 'Claiming...' : 'Confirm Claim'}
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  )
}

export default App
