import { useState } from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { GRID_SIZE, TOTAL_CELLS, HINT_INTERVAL } from '@pck/shared'
import { GameBoard } from './components/GameBoard'
import { useGameBoard, useUserState, usePull, useHint } from './hooks/useGameQueries'
import { useWalletBalance } from './hooks/useWalletBalance'
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
  const { refetch: refetchHint } = useHint(1)

  // Local state for hints
  const [hintedCells, setHintedCells] = useState<Set<number>>(new Set())

  const revealedCells = boardData?.revealedCells || []
  const pullCount = userStateData?.pullCount || 0

  const handleCellClick = (cellId: number) => {
    // Check if cell is already revealed
    if (revealedCells.some((cell: { cellId: number; tier: number }) => cell.cellId === cellId)) {
      return
    }

    // Call API with pull mutation
    pullMutation.mutate({
      cellId,
      sessionId: 1, // TODO: Get from session state
    })
  }

  const handleHint = async () => {
    const { data } = await refetchHint()
    if (data) {
      setHintedCells(new Set([data.tier4PlusCell, data.tier5PlusCell]))
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
                <p className={styles.pullCount}>Pull Count: {pullCount}/{TOTAL_CELLS}</p>
                <button
                  onClick={handleHint}
                  disabled={pullCount % HINT_INTERVAL !== 0 || pullCount === 0}
                  className={styles.hintButton}
                >
                  Get Hint {pullCount % HINT_INTERVAL === 0 && pullCount > 0 ? '✨' : `(${HINT_INTERVAL - (pullCount % HINT_INTERVAL)})`}
                </button>
              </div>
            </div>
            <GameBoard
              revealedCells={revealedCells}
              hintedCells={hintedCells}
              onCellClick={handleCellClick}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default App
