import { useState } from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { toast } from 'react-hot-toast'
import { TOTAL_CELLS, HINT_INTERVAL } from '@pck/shared'
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
import { config } from './lib/config'
import { BoardSection, type BoardOverlayState } from './components/dashboard/BoardSection'
import { SessionPanel } from './components/dashboard/SessionPanel'
import { TicketPanel } from './components/dashboard/TicketPanel'
import { RewardsPanel } from './components/dashboard/RewardsPanel'
import { ClaimModal } from './components/dashboard/ClaimModal'
import { GlobalHeader, type NavItem } from './components/navigation/GlobalHeader'
import styles from './App.module.css'
import type { PrizeItem } from './types/prize'

function App() {
  const { ready, authenticated, login, logout } = usePrivy()
  const { wallets } = useWallets()

  const wallet = wallets[0]
  const address = wallet?.address

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
      toast.error('No active run found. Please start a new game before pulling cells.')
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
      toast.error('No active run found. Please start a new game before requesting hints.')
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
      toast.error('Connect your wallet to start a new run.')
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
      if (result.txHash) {
        toast.success(
          `Ticket purchased for run #${result.sessionId}. Tx: ${result.txHash.slice(0, 10)}...`,
          { id: toastId },
        )
      } else {
        toast.success(`Run #${result.sessionId} started in off-chain mode.`, {
          id: toastId,
        })
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to start run', {
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
      if (result.txHash) {
        toast.success(`Prize claimed successfully. Tx: ${result.txHash.slice(0, 10)}...`, {
          id: toastId,
        })
      } else {
        toast.success('Prize marked as claimed in off-chain mode.', {
          id: toastId,
        })
      }
      closeClaimModal()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to claim prize.', {
        id: toastId,
      })
    }
  }

  const isHintReady = Boolean(sessionId && pullCount > 0 && pullCount % HINT_INTERVAL === 0)
  const hintProgress = pullCount % HINT_INTERVAL
  const nextHintCount = !sessionId
    ? HINT_INTERVAL
    : pullCount === 0
      ? HINT_INTERVAL
      : hintProgress === 0
        ? 0
        : HINT_INTERVAL - hintProgress
  const boardOverlayState: BoardOverlayState = !ready
    ? 'loading'
    : !authenticated
      ? 'connect'
      : !sessionId
        ? 'start'
        : null
  const navItems: NavItem[] = [
    { label: 'Board', href: '#board' },
    { label: 'Rewards', href: '#rewards' },
  ]
  return (
    <div className={styles.app}>
      <div className={styles.glow} aria-hidden="true" />
      <GlobalHeader
        ready={ready}
        authenticated={authenticated}
        address={address}
        onLogin={login}
        onLogout={logout}
        navItems={navItems}
      />
      <div className={styles.container}>
        <div className={styles.layout}>
          <BoardSection
            sectionId="board"
            sessionId={sessionId}
            revealedCells={revealedCells}
            hintedCells={hintedCells}
            loadingCellId={activeCellId}
            onCellClick={handleCellClick}
            boardOverlayState={boardOverlayState}
            onConnect={login}
            onStartSession={handleStartSession}
            isPurchasing={startSession.isPending}
            ready={ready}
          />

          <aside className={styles.sidebar}>
            <SessionPanel
              sessionId={sessionId}
              isPurchasing={startSession.isPending}
              onStartSession={handleStartSession}
              onHint={handleHint}
              isHintReady={isHintReady}
              nextHintCount={nextHintCount}
              pullCount={pullCount}
              totalCells={TOTAL_CELLS}
              isAdmin={isAdmin}
              onForceReset={handleForceReset}
              isResetting={adminReset.isPending}
            />

            <TicketPanel ticketPurchase={ticketPurchase} onCopyTxHash={handleCopyTxHash} />

            <RewardsPanel
              sectionId="rewards"
              prizes={prizes}
              authenticated={authenticated}
              onClaim={openClaimModal}
              claimPending={claimPrize.isPending}
            />
          </aside>
        </div>
      </div>

      <ClaimModal
        isOpen={isClaimModalOpen}
        prize={selectedPrize}
        onClose={closeClaimModal}
        onConfirm={handleClaimPrize}
        isPending={claimPrize.isPending}
      />
    </div>
  )
}

export default App
