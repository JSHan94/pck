# Testing Policy for PCK Project

## Executive Summary

This project follows a **pragmatic testing approach** focused on critical business logic rather than comprehensive test coverage.

## Core Principle

> **"Test what matters, not what's trivial"**

We prioritize testing **high-risk, high-complexity, business-critical code** over achieving arbitrary coverage percentages.

## Component-Specific Guidelines

### 1. Shared Package (`/shared`)

**Test ONLY:**
- ✅ Merkle tree utilities (`hashLeaf`, proof generation)
  - MUST match Solidity contract implementation exactly
  - Test edge cases and security scenarios
- ✅ Complex validation logic with business rules
  - Multi-step validations
  - Edge case handling

**DO NOT Test:**
- ❌ Type definitions (TypeScript validates these)
- ❌ Simple constants (no logic to test)
- ❌ Basic interfaces/types
- ❌ Configuration files
- ❌ Re-exports

**Test Coverage Target:** ~60-70% of utility functions only

### 2. Frontend (`/frontend`)

**Test ONLY:**
- ✅ Game state management
  - Session state transitions
  - Pull counting logic
  - Hint system logic
- ✅ Complex UI interactions
  - Multi-step transaction flows
  - Error recovery logic
- ✅ Blockchain integration
  - Transaction preparation
  - Receipt verification flow

**DO NOT Test:**
- ❌ Simple components (buttons, cards, grids)
- ❌ Styling/CSS
- ❌ Mock data generators
- ❌ Type definitions
- ❌ API client wrappers (test the logic, not axios calls)

**Test Coverage Target:** ~40-50% focused on business logic

### 3. Backend (`/backend`)

**Test ONLY:**
- ✅ Board generation algorithm
  - Tier distribution correctness
  - Shuffle fairness (if custom implementation)
  - Merkle root generation
- ✅ Proof generation logic
  - Merkle proof correctness
  - Cell data integrity
- ✅ Receipt verification
  - Event parsing
  - Signature validation
  - State update logic
- ✅ Session state management
  - isActive transitions
  - Pull counting
  - Duplicate prevention

**DO NOT Test:**
- ❌ Simple CRUD endpoints
- ❌ Database schema definitions
- ❌ Route definitions
- ❌ Type mappings
- ❌ Environment configuration

**Test Coverage Target:** ~60-70% of business logic

### 4. Contract (`/contract`)

**NO TypeScript Tests Required**

- Use **Foundry's native testing framework** only
- Write Solidity tests in `/contract/test/`
- Focus on:
  - Merkle proof verification
  - State transitions
  - Access control
  - Edge cases and attack vectors

## TDD Methodology (Modified)

### For Critical Business Logic

Follow strict TDD:

1. **RED**: Write failing test for the specific algorithm/business rule
2. **GREEN**: Implement minimum code to make test pass
3. **REFACTOR**: Clean up implementation
4. **VERIFY**: Ensure cross-component consistency (e.g., Solidity ↔ TypeScript)

### For Simple Code

Skip TDD, implement directly:

1. Write implementation
2. Run typecheck
3. Manual verification
4. Add test only if complexity grows

## When to Add Tests

Add tests when code meets **ANY** of these criteria:

1. **High Impact**
   - Affects game fairness
   - Handles money/prizes
   - Security-critical operations

2. **High Complexity**
   - Complex algorithms (Merkle trees, shuffling)
   - Multi-step state machines
   - Non-trivial calculations

3. **High Risk**
   - External input handling
   - State transitions
   - Cryptographic operations

4. **Bug Fixes**
   - Always write test to reproduce bug first
   - Then fix
   - Keep test as regression prevention

## Test Maintenance

### Monthly Review

- Remove tests that:
  - No longer test critical paths
  - Test framework functionality
  - Have become trivial after refactoring

### Test Quality Over Quantity

**Good Test:**
```typescript
it('should prevent duplicate pulls on same cell', async () => {
  await pull(sessionId, cellId);
  await expect(pull(sessionId, cellId)).rejects.toThrow('Cell already revealed');
});
```

**Bad Test:**
```typescript
it('should have prizeId as string', () => {
  const prize: PrizeClaim = { prizeId: 'test', ... };
  expect(typeof prize.prizeId).toBe('string');
});
```

## Integration with Development Workflow

### Pre-Commit

For changes to critical business logic:
```bash
pnpm test            # Run tests
pnpm typecheck       # Type safety
```

For simple code changes:
```bash
pnpm typecheck       # Type safety only
```

### CI/CD

```bash
pnpm test            # All components (with --passWithNoTests)
pnpm typecheck:all   # Type safety across monorepo
```

## Benefits of This Approach

1. **Faster Development**
   - Less time writing trivial tests
   - More time on features

2. **Lower Maintenance**
   - Fewer tests to update when refactoring
   - Less test flakiness

3. **Higher Quality Tests**
   - Focus on actual bugs and edge cases
   - Better documentation of critical behavior

4. **Better Type Safety**
   - Rely on TypeScript for type validation
   - Catch errors at compile time

## Examples of Removed Tests

We removed ~659 lines of tests including:

- ❌ Type definition tests (392 lines)
- ❌ API type tests (128 lines)
- ❌ Constant value tests (99 lines)
- ❌ File structure tests (10 lines)
- ❌ .gitignore validation tests (30 lines)

**Result:** 90% reduction in test code, 100% focus on critical paths

## Migration Path

### Phase 1: Cleanup (✅ Complete)
- Remove trivial tests
- Update package.json scripts
- Document new approach

### Phase 2: Critical Tests (Next)
- Add Merkle utility tests when implementing
- Add board generation tests when implementing
- Add proof verification tests when implementing

### Phase 3: Integration Tests
- Add E2E tests for critical user flows
- Frontend: Ticket purchase → Pull → Claim
- Backend: Session lifecycle tests

## Questions and Answers

**Q: Why not test types?**
A: TypeScript validates types at compile time. Runtime tests don't add value.

**Q: What about TDD?**
A: Still use TDD for critical business logic. Skip for trivial code.

**Q: What if I'm unsure?**
A: Default to NO test. Add test only when complexity or risk is evident.

**Q: What about code coverage?**
A: Aim for 60-70% of critical paths, not 90%+ of all code.

**Q: Contract tests?**
A: Use Foundry only. No TypeScript tests for contracts.

## Summary

This policy balances:
- ✅ Confidence in critical code
- ✅ Development velocity
- ✅ Maintenance burden
- ✅ Type safety through tooling

**Result:** Better tests, faster development, fewer bugs.
