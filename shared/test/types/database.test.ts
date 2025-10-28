import { describe, it, expect } from 'vitest';
import type { Board, Cell, GameSession, RevealedCell } from '../../src/types/database.js';

describe('Database Types', () => {
  describe('Cell', () => {
    it('should accept valid Cell object', () => {
      const cell: Cell = {
        cellId: 0,
        tier: 1,
        salt: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      };

      expect(cell.cellId).toBe(0);
      expect(cell.tier).toBe(1);
      expect(typeof cell.salt).toBe('string');
    });

    it('should have cellId as number', () => {
      const cell: Cell = {
        cellId: 48,
        tier: 6,
        salt: '0xabc',
      };

      expect(typeof cell.cellId).toBe('number');
    });

    it('should have tier as number', () => {
      const cell: Cell = {
        cellId: 10,
        tier: 3,
        salt: '0xdef',
      };

      expect(typeof cell.tier).toBe('number');
    });

    it('should have salt as string', () => {
      const cell: Cell = {
        cellId: 5,
        tier: 2,
        salt: '0x123',
      };

      expect(typeof cell.salt).toBe('string');
    });
  });

  describe('Board', () => {
    it('should accept valid Board object', () => {
      const board: Board = {
        boardId: 'board-uuid-123',
        prizeLayout: [
          { cellId: 0, tier: 1, salt: '0xabc' },
          { cellId: 1, tier: 2, salt: '0xdef' },
        ],
        merkleRoot: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        isAssigned: false,
      };

      expect(board.boardId).toBe('board-uuid-123');
      expect(Array.isArray(board.prizeLayout)).toBe(true);
      expect(board.prizeLayout.length).toBe(2);
      expect(board.merkleRoot).toBe('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');
      expect(board.isAssigned).toBe(false);
    });

    it('should have boardId as string', () => {
      const board: Board = {
        boardId: 'test-id',
        prizeLayout: [],
        merkleRoot: '0xabc',
        isAssigned: true,
      };

      expect(typeof board.boardId).toBe('string');
    });

    it('should have prizeLayout as array of Cell', () => {
      const cells: Cell[] = [
        { cellId: 0, tier: 1, salt: '0x111' },
        { cellId: 1, tier: 2, salt: '0x222' },
        { cellId: 2, tier: 3, salt: '0x333' },
      ];

      const board: Board = {
        boardId: 'test-board',
        prizeLayout: cells,
        merkleRoot: '0xroot',
        isAssigned: false,
      };

      expect(Array.isArray(board.prizeLayout)).toBe(true);
      expect(board.prizeLayout).toHaveLength(3);
      expect(board.prizeLayout[0].cellId).toBe(0);
      expect(board.prizeLayout[1].tier).toBe(2);
      expect(board.prizeLayout[2].salt).toBe('0x333');
    });

    it('should have merkleRoot as string', () => {
      const board: Board = {
        boardId: 'board-123',
        prizeLayout: [],
        merkleRoot: '0xmerklehash',
        isAssigned: false,
      };

      expect(typeof board.merkleRoot).toBe('string');
    });

    it('should have isAssigned as boolean', () => {
      const board1: Board = {
        boardId: 'board-1',
        prizeLayout: [],
        merkleRoot: '0xabc',
        isAssigned: true,
      };

      const board2: Board = {
        boardId: 'board-2',
        prizeLayout: [],
        merkleRoot: '0xdef',
        isAssigned: false,
      };

      expect(typeof board1.isAssigned).toBe('boolean');
      expect(board1.isAssigned).toBe(true);
      expect(typeof board2.isAssigned).toBe('boolean');
      expect(board2.isAssigned).toBe(false);
    });
  });

  describe('GameSession', () => {
    it('should accept valid GameSession object', () => {
      const session: GameSession = {
        sessionId: 1,
        userAddress: '0x1234567890123456789012345678901234567890',
        boardId: 'board-uuid-123',
        pullCount: 5,
        isActive: true,
      };

      expect(session.sessionId).toBe(1);
      expect(session.userAddress).toBe('0x1234567890123456789012345678901234567890');
      expect(session.boardId).toBe('board-uuid-123');
      expect(session.pullCount).toBe(5);
      expect(session.isActive).toBe(true);
    });

    it('should have sessionId as number', () => {
      const session: GameSession = {
        sessionId: 42,
        userAddress: '0xabc',
        boardId: 'board-1',
        pullCount: 0,
        isActive: false,
      };

      expect(typeof session.sessionId).toBe('number');
    });

    it('should have userAddress as string', () => {
      const session: GameSession = {
        sessionId: 1,
        userAddress: '0x123abc',
        boardId: 'board-1',
        pullCount: 0,
        isActive: false,
      };

      expect(typeof session.userAddress).toBe('string');
    });

    it('should have boardId as string', () => {
      const session: GameSession = {
        sessionId: 1,
        userAddress: '0xabc',
        boardId: 'test-board-id',
        pullCount: 0,
        isActive: false,
      };

      expect(typeof session.boardId).toBe('string');
    });

    it('should have pullCount as number', () => {
      const session: GameSession = {
        sessionId: 1,
        userAddress: '0xabc',
        boardId: 'board-1',
        pullCount: 10,
        isActive: true,
      };

      expect(typeof session.pullCount).toBe('number');
      expect(session.pullCount).toBe(10);
    });

    it('should have isActive as boolean', () => {
      const activeSession: GameSession = {
        sessionId: 1,
        userAddress: '0xabc',
        boardId: 'board-1',
        pullCount: 0,
        isActive: true,
      };

      const inactiveSession: GameSession = {
        sessionId: 2,
        userAddress: '0xdef',
        boardId: 'board-2',
        pullCount: 0,
        isActive: false,
      };

      expect(typeof activeSession.isActive).toBe('boolean');
      expect(activeSession.isActive).toBe(true);
      expect(typeof inactiveSession.isActive).toBe('boolean');
      expect(inactiveSession.isActive).toBe(false);
    });
  });

  describe('RevealedCell', () => {
    it('should accept valid RevealedCell object', () => {
      const revealedCell: RevealedCell = {
        id: 1,
        sessionId: 10,
        cellId: 5,
        tier: 3,
      };

      expect(revealedCell.id).toBe(1);
      expect(revealedCell.sessionId).toBe(10);
      expect(revealedCell.cellId).toBe(5);
      expect(revealedCell.tier).toBe(3);
    });

    it('should have id as number', () => {
      const revealedCell: RevealedCell = {
        id: 999,
        sessionId: 1,
        cellId: 0,
        tier: 1,
      };

      expect(typeof revealedCell.id).toBe('number');
    });

    it('should have sessionId as number', () => {
      const revealedCell: RevealedCell = {
        id: 1,
        sessionId: 42,
        cellId: 10,
        tier: 2,
      };

      expect(typeof revealedCell.sessionId).toBe('number');
    });

    it('should have cellId as number', () => {
      const revealedCell: RevealedCell = {
        id: 1,
        sessionId: 1,
        cellId: 48,
        tier: 6,
      };

      expect(typeof revealedCell.cellId).toBe('number');
    });

    it('should have tier as number', () => {
      const revealedCell: RevealedCell = {
        id: 1,
        sessionId: 1,
        cellId: 25,
        tier: 4,
      };

      expect(typeof revealedCell.tier).toBe('number');
    });
  });
});
