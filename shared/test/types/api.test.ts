import { describe, it, expect } from 'vitest';
import type {
  StartSessionResponse,
  PullRequest,
  PullResponse,
  HintResponse,
  ClaimProofResponse,
  VerifyReceiptRequest,
  VerifyReceiptResponse,
} from '../../src/types/api.js';

describe('API Types', () => {
  describe('StartSessionResponse', () => {
    it('should accept valid StartSessionResponse object', () => {
      const validResponse: StartSessionResponse = {
        merkleRoot: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        sessionId: 1,
      };

      expect(validResponse.merkleRoot).toBe('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');
      expect(validResponse.sessionId).toBe(1);
    });
  });

  describe('PullRequest', () => {
    it('should accept valid PullRequest object', () => {
      const request: PullRequest = {
        cellId: 5,
        sessionId: 10,
      };

      expect(request.cellId).toBe(5);
      expect(request.sessionId).toBe(10);
    });
  });

  describe('PullResponse', () => {
    it('should accept valid PullResponse object', () => {
      const response: PullResponse = {
        tier: 3,
      };

      expect(response.tier).toBe(3);
      expect(typeof response.tier).toBe('number');
    });
  });

  describe('HintResponse', () => {
    it('should accept valid HintResponse object', () => {
      const response: HintResponse = {
        tier4PlusCell: 10,
        tier5PlusCell: 20,
      };

      expect(response.tier4PlusCell).toBe(10);
      expect(response.tier5PlusCell).toBe(20);
    });
  });

  describe('ClaimProofResponse', () => {
    it('should accept valid ClaimProofResponse object', () => {
      const response: ClaimProofResponse = {
        merkleProof: ['0xabc', '0xdef'],
        prizeId: 'uuid-123',
        prizeTier: 4,
        cellId: 5,
        salt: '0x1234',
        sessionId: 1,
      };

      expect(Array.isArray(response.merkleProof)).toBe(true);
      expect(response.merkleProof.length).toBe(2);
      expect(response.prizeId).toBe('uuid-123');
      expect(response.prizeTier).toBe(4);
      expect(response.cellId).toBe(5);
      expect(response.salt).toBe('0x1234');
      expect(response.sessionId).toBe(1);
    });
  });

  describe('VerifyReceiptRequest', () => {
    it('should accept valid VerifyReceiptRequest with all fields', () => {
      const request: VerifyReceiptRequest = {
        txHash: '0xabc123',
        sessionId: 1,
        prizeId: 'uuid-456',
      };

      expect(request.txHash).toBe('0xabc123');
      expect(request.sessionId).toBe(1);
      expect(request.prizeId).toBe('uuid-456');
    });

    it('should accept VerifyReceiptRequest with optional fields omitted', () => {
      const request: VerifyReceiptRequest = {
        txHash: '0xabc123',
      };

      expect(request.txHash).toBe('0xabc123');
      expect(request.sessionId).toBeUndefined();
      expect(request.prizeId).toBeUndefined();
    });
  });

  describe('VerifyReceiptResponse', () => {
    it('should accept valid VerifyReceiptResponse with all fields', () => {
      const response: VerifyReceiptResponse = {
        success: true,
        isActive: true,
        isClaimed: false,
      };

      expect(response.success).toBe(true);
      expect(response.isActive).toBe(true);
      expect(response.isClaimed).toBe(false);
    });

    it('should accept VerifyReceiptResponse with optional fields omitted', () => {
      const response: VerifyReceiptResponse = {
        success: false,
      };

      expect(response.success).toBe(false);
      expect(response.isActive).toBeUndefined();
      expect(response.isClaimed).toBeUndefined();
    });
  });
});
