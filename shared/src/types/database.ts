// Database Schema Types

export interface Cell {
  cellId: number;
  tier: number;
  salt: string;
}

export interface Board {
  boardId: string;
  prizeLayout: Cell[];
  merkleRoot: string;
  isAssigned: boolean;
}

export interface GameSession {
  sessionId: number;
  userAddress: string;
  boardId: string;
  pullCount: number;
  isActive: boolean;
}

export interface RevealedCell {
  id: number;
  sessionId: number;
  cellId: number;
  tier: number;
}

export interface PrizeClaim {
  prizeId: string;
  userAddress: string;
  tier: number;
  isClaimed: boolean;
  sessionId: number;
  cellId: number;
}
