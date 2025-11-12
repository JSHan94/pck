/// <reference types="vitest" />

import { describe, expect, it } from 'vitest'
import { buildBuyTicketCall, buildClaimPrizeCall, normalizeBytes32 } from './transactions'

const SAMPLE_ROOT = `0x${'ab'.repeat(32)}`
const SAMPLE_PROOF = [`0x${'cd'.repeat(32)}`, `0x${'ef'.repeat(32)}`]

describe('buildBuyTicketCall', () => {
  it('builds buyTicket call data with normalized inputs', () => {
    const { functionName, args } = buildBuyTicketCall({
      merkleRoot: SAMPLE_ROOT,
      sessionId: 42,
    })

    expect(functionName).toBe('buyTicket')
    expect(args).toEqual([SAMPLE_ROOT, 42n])
  })

  it('throws when merkle root is invalid', () => {
    expect(() =>
      buildBuyTicketCall({
        merkleRoot: '1234',
        sessionId: 1,
      }),
    ).toThrowError('Invalid merkle root: 1234')
  })

  it('throws when session id is not a positive integer', () => {
    expect(() =>
      buildBuyTicketCall({
        merkleRoot: SAMPLE_ROOT,
        sessionId: -1,
      }),
    ).toThrowError('Session ID must be a non-negative integer')
  })
})

describe('normalizeBytes32', () => {
  it('enforces 32-byte hex strings', () => {
    expect(() => normalizeBytes32('0x1')).toThrowError()
    expect(() => normalizeBytes32('abc')).toThrowError()
    expect(normalizeBytes32(SAMPLE_ROOT)).toBe(SAMPLE_ROOT)
  })
})

describe('buildClaimPrizeCall', () => {
  it('builds claimPrize call data with normalized values', () => {
    const { functionName, args } = buildClaimPrizeCall({
      sessionId: 10,
      merkleProof: SAMPLE_PROOF,
      prizeId: SAMPLE_ROOT,
      prizeTier: 4,
      cellId: 7,
      salt: `0x${'11'.repeat(32)}`,
    })

    expect(functionName).toBe('claimPrize')
    expect(args).toEqual([
      10n,
      SAMPLE_PROOF.map((node) => node.toLowerCase()),
      SAMPLE_ROOT,
      4n,
      7,
      `0x${'11'.repeat(32)}`,
    ])
  })

  it('throws when cell id is out of bounds', () => {
    expect(() =>
      buildClaimPrizeCall({
        sessionId: 1,
        merkleProof: SAMPLE_PROOF,
        prizeId: SAMPLE_ROOT,
        prizeTier: 1,
        cellId: 256,
        salt: SAMPLE_ROOT,
      }),
    ).toThrowError('Cell ID must be between 0 and 255')
  })

  it('throws when proof contains invalid entry', () => {
    expect(() =>
      buildClaimPrizeCall({
        sessionId: 1,
        merkleProof: ['0x123'],
        prizeId: SAMPLE_ROOT,
        prizeTier: 1,
        cellId: 1,
        salt: SAMPLE_ROOT,
      }),
    ).toThrowError()
  })
})
