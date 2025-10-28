# Testing Strategy for Shared Package

## Philosophy

**"Test critical business logic, not TypeScript types"**

This package contains shared types, constants, and utilities. We follow a pragmatic testing approach:

## What to Test ✅

### Critical Business Logic
- **Merkle tree utilities** (`src/utils/merkle.ts`)
  - `hashLeaf()` function - Must match Solidity contract exactly
  - Proof generation logic
  - Tree construction algorithm

- **Complex validation** (`src/utils/validation.ts`)
  - Business rule validations (tier ranges, cell ID bounds)
  - Edge case handling
  - Error conditions

### What NOT to Test ❌

- **Type definitions** (`src/types/*`)
  - TypeScript ensures type safety at compile time
  - No runtime behavior to test

- **Simple constants** (`src/constants/*`)
  - No logic, just values
  - TypeScript catches typos

- **Re-exports** (`src/index.ts`)
  - No logic to test

## Test Files

Keep only tests for:
- `test/utils/merkle.test.ts` - When Merkle utilities are implemented
- `test/utils/validation.test.ts` - When complex validation is added

## Running Tests

```bash
# Run tests (when they exist)
pnpm test

# Type checking (primary validation)
pnpm typecheck

# Build
pnpm build
```

## TDD for Critical Logic

When implementing Merkle or validation utilities:

1. **RED**: Write failing test for the specific algorithm/logic
2. **GREEN**: Implement minimum code to pass
3. **REFACTOR**: Clean up implementation
4. **VERIFY**: Ensure Solidity contract match (for Merkle)

## Why This Approach?

- **Focus on Value**: Test code that can actually fail in production
- **Reduce Maintenance**: Less test code to maintain
- **Type Safety**: Let TypeScript do what it does best
- **Developer Velocity**: Spend time on features, not trivial tests

## Example: What Changed

**Before (Removed)**:
- 392 lines testing simple type definitions
- 128 lines testing API request/response types
- 99 lines testing simple constants
- 30 lines testing .gitignore files
- 10 lines testing folder structure

**After (Keeping Only Critical)**:
- Merkle utility tests (when implemented)
- Complex validation tests (when implemented)
- ~100-200 lines total for actual business logic

**Result**: ~90% reduction in test code, 100% focus on critical paths
