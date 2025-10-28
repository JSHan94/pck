// API Request/Response Types

export interface StartSessionResponse {
  merkleRoot: string;
  sessionId: number;
}

export interface PullRequest {
  cellId: number;
  sessionId: number;
}

export interface PullResponse {
  tier: number;
}

export interface HintResponse {
  tier4PlusCell: number;
  tier5PlusCell: number;
}

export interface ClaimProofResponse {
  merkleProof: string[];
  prizeId: string;
  prizeTier: number;
  cellId: number;
  salt: string;
  sessionId: number;
}

export interface VerifyReceiptRequest {
  txHash: string;
  sessionId?: number;
  prizeId?: string;
}

export interface VerifyReceiptResponse {
  success: boolean;
  isActive?: boolean;
  isClaimed?: boolean;
}
