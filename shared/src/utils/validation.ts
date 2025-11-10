// Validation utility functions

/**
 * Check if tier is valid (1-6)
 */
export function isValidTier(tier: number): boolean {
  return tier >= 1 && tier <= 6;
}

/**
 * Check if cellId is valid (0-48)
 */
export function isValidCellId(cellId: number): boolean {
  return cellId >= 0 && cellId <= 48;
}
