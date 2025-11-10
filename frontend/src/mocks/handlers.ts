import { http, HttpResponse } from 'msw'
import type {
  StartSessionResponse,
  PullResponse,
  HintResponse
} from '@pck/shared'
import { createBoard } from './createBoard'
import { verifyCellProof } from '../lib/merkle'

const BASE_URL = '/api'

// Generate a mock board once for the session
const mockBoard = createBoard()
const revealedCells = new Map<number, number>() // cellId -> tier

export const handlers = [
  // GET /api/game/start-session
  http.get(`${BASE_URL}/game/start-session`, () => {
    const response: StartSessionResponse = {
      merkleRoot: mockBoard.merkleRoot,
      sessionId: 1,
    }
    return HttpResponse.json(response)
  }),

  // GET /api/game/board
  http.get(`${BASE_URL}/game/board`, () => {
    return HttpResponse.json({
      boardId: mockBoard.boardId,
      revealedCells: Array.from(revealedCells.entries()).map(([cellId, tier]) => ({
        cellId,
        tier,
      })),
    })
  }),

  // GET /api/game/user-state
  http.get(`${BASE_URL}/game/user-state`, () => {
    return HttpResponse.json({
      pullCount: revealedCells.size,
    })
  }),

  // POST /api/game/pull
  http.post(`${BASE_URL}/game/pull`, async ({ request }) => {
    const body = await request.json() as { cellId: number; sessionId: number }
    const { cellId } = body

    // Find the tier for this cell from the mock board
    const cell = mockBoard.prizeLayout.find(c => c.cellId === cellId)
    if (!cell) {
      return HttpResponse.json({ error: 'Invalid cell ID' }, { status: 400 })
    }

    const proof = mockBoard.proofs[cellId] ?? []
    const isValidProof = verifyCellProof({
      cellId,
      tier: cell.tier,
      salt: cell.salt,
      merkleProof: proof,
      merkleRoot: mockBoard.merkleRoot,
    })

    if (!isValidProof) {
      return HttpResponse.json({ error: 'Invalid merkle proof' }, { status: 500 })
    }

    // Add to revealed cells
    revealedCells.set(cellId, cell.tier)

    const response: PullResponse = {
      tier: cell.tier,
    }

    return HttpResponse.json(response)
  }),

  // GET /api/game/hint
  http.get(`${BASE_URL}/game/hint`, () => {
    // Find unrevealed cells with tier 4+ and 5+
    const unrevealedCells = mockBoard.prizeLayout.filter(
      cell => !revealedCells.has(cell.cellId)
    )

    const tier4Plus = unrevealedCells.find(cell => cell.tier <= 4)
    const tier5Plus = unrevealedCells.find(cell => cell.tier <= 5)

    const response: HintResponse = {
      tier4PlusCell: tier4Plus?.cellId ?? 0,
      tier5PlusCell: tier5Plus?.cellId ?? 0,
    }
    return HttpResponse.json(response)
  }),

  // GET /api/game/prizes
  http.get(`${BASE_URL}/game/prizes`, () => {
    // Return prizes for revealed cells
    return HttpResponse.json(
      Array.from(revealedCells.entries()).map(([cellId, tier]) => ({
        prizeId: `prize-${cellId}`,
        tier,
        isClaimed: false,
      }))
    )
  }),
]
