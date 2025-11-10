import { useState } from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { toast } from 'react-hot-toast'
import { GRID_SIZE, TOTAL_CELLS, HINT_INTERVAL } from '@pck/shared'
import { GameBoard } from './components/GameBoard'
import { useGameBoard, useUserState, usePull, useHint } from './hooks/useGameQueries'
import { useWalletBalance } from './hooks/useWalletBalance'
import { useAdminStatus, useAdminReset } from './hooks/useAdminTools'
import styles from './App.module.css'

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
  const sessionId = userStateData?.sessionId
  const { refetch: refetchHint } = useHint(sessionId)
  const { data: adminStatus } = useAdminStatus(address)
  const adminReset = useAdminReset(address)

  // Local state for hints & animations
  const [hintedCells, setHintedCells] = useState<Set<number>>(new Set())
  const [activeCellId, setActiveCellId] = useState<number | null>(null)

  const revealedCells = boardData?.revealedCells || []
  const pullCount = userStateData?.pullCount || 0
  const isAdmin = Boolean(adminStatus?.isAdmin)

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
      </div>
    </div>
  )
}

export default App
