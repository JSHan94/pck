# Development Workflow Guide

This document provides detailed step-by-step workflows for development following TDD principles adapted to our pragmatic testing policy.

## Table of Contents
1. [Quick Reference](#quick-reference)
2. [The "go" Command Workflow](#the-go-command-workflow)
3. [Decision Tree](#decision-tree)
4. [Component-Specific Guidelines](#component-specific-guidelines)
5. [PLAN.md Update Examples](#planmd-update-examples)
6. [Verification Checklist](#verification-checklist)

---

## Quick Reference

### When User Says "go"
```
1. Read PLAN.md → Find next [ ] item
2. Check if exists (Read files)
3. Check testing policy for component
4. Take appropriate action
5. Update PLAN.md checkbox
6. Verify (test/typecheck)
7. Report completion
```

### Key Principles
- ✅ **Check before create** - Always read before writing
- ✅ **Consult testing policy** - Not everything needs tests
- ✅ **Update PLAN.md** - After every completed item
- ✅ **Verify changes** - Run appropriate checks

---

## The "go" Command Workflow

### Step 1: Read PLAN.md
```bash
Read /docs/PLAN.md
```

**Find:** The next unchecked item `- [ ]` in sequential order

**Example:**
```markdown
- [x] `Board`: `{ boardId: string, ... }`
- [x] `Cell`: `{ cellId: number, tier: number, salt: string }`
- [x] `GameSession`: `{ sessionId: number, ... }`
- [ ] `RevealedCell`: `{ id: number, sessionId: number, cellId: number, tier: number }`  ← This one
```

### Step 2: Verify Existing Work

**ALWAYS check these before proceeding:**

#### 2a. Check Implementation
```bash
# For types
Read shared/src/types/database.ts

# For constants
Read shared/src/constants/index.ts

# For utilities
Read shared/src/utils/[filename].ts
```

#### 2b. Check Tests
```bash
# Search for test files
Glob pattern: **/*.test.ts in appropriate directory

# Or search specifically
Glob pattern: **/database.test.ts
```

#### 2c. Consult Testing Policy
```bash
Read /docs/TESTING_POLICY.md
Read /docs/TESTING_SHARED.md  # For shared package
```

**Key Policy Points:**
- ❌ **DO NOT test:** Type definitions, simple constants, re-exports
- ✅ **DO test:** Business logic, algorithms, complex validation

### Step 3: Determine Action

Use this decision tree:

```
Is it a type definition?
├─ YES → Check if exists → Update PLAN.md (NO TESTS)
└─ NO
   └─ Is it a simple constant?
      ├─ YES → Check if exists → Update PLAN.md (NO TESTS)
      └─ NO
         └─ Is it business logic?
            └─ YES → Check tests → Follow TDD if missing → Update PLAN.md
```

### Step 4: Execute Action

#### Action A: Type Definition Found
```markdown
✅ Implementation exists in database.ts
✅ Matches specification
⚠️ NO TESTS needed (per TESTING_POLICY.md)
📝 Update PLAN.md
```

#### Action B: Type Definition Missing
```typescript
1. Implement type in appropriate file
2. Run: pnpm --filter shared typecheck
3. Update PLAN.md
```

#### Action C: Business Logic Missing
```typescript
1. Write failing test (RED)
2. Implement minimum code (GREEN)
3. Refactor if needed
4. Run: pnpm --filter shared test
5. Run: pnpm --filter shared typecheck
6. Update PLAN.md
```

### Step 5: Update PLAN.md

**Critical:** This step is MANDATORY after every completed item.

```bash
# Find the exact line
- [ ] `RevealedCell`: `{ id: number, sessionId: number, cellId: number, tier: number }`

# Change to
- [x] `RevealedCell`: `{ id: number, sessionId: number, cellId: number, tier: number }`
```

**Use Edit tool to make the change:**
```
old_string: "- [ ] `RevealedCell`:"
new_string: "- [x] `RevealedCell`:"
```

### Step 6: Verify

Run appropriate verification based on what was changed:

```bash
# For types and constants
pnpm --filter shared typecheck

# For business logic (utilities)
pnpm --filter shared test
pnpm --filter shared typecheck

# For frontend changes
pnpm --filter frontend typecheck
pnpm --filter frontend test  # If tests exist

# For backend changes
pnpm --filter backend typecheck
```

### Step 7: Report to User

**Template:**
```markdown
**Found:** [What already existed or what was missing]
**Action Taken:** [What you did]
**Tests:** [Pass/Not required/Added new tests]
**Verification:** [Typecheck/Test results]
**PLAN.md:** [Updated checkbox line X]
**Status:** Ready for next "go"
```

**Example:**
```markdown
**Found:** RevealedCell type already implemented in shared/src/types/database.ts
**Action Taken:** Verified implementation matches specification
**Tests:** Not required per TESTING_POLICY.md (types validated by TypeScript)
**Verification:** ✅ typecheck passed
**PLAN.md:** Updated line 137 to [x]
**Status:** Ready for next "go"
```

---

## Decision Tree

```
                    User says "go"
                          |
                          ↓
                   Read PLAN.md
              Find next unchecked [ ] item
                          |
                          ↓
            ┌─────────────────────────────┐
            │   Check Existing Work       │
            │  - Read target file         │
            │  - Search for tests         │
            │  - Consult testing policy   │
            └─────────────────────────────┘
                          |
             ┌────────────┴────────────┐
             ↓                         ↓
     Implementation EXISTS    Implementation MISSING
             |                         |
             ↓                         ↓
     Is it correct?          What type of code?
         ↓     ↓                   ↓     ↓
       YES    NO           TYPE/CONSTANT  LOGIC
        |      |                 |          |
        ↓      ↓                 ↓          ↓
    Update  Fix it          Implement   Write test
    PLAN.md    |            quickly      (TDD)
        ↓      ↓                 |          |
    Verify  Verify               ↓          ↓
        ↓      ↓             Typecheck   Implement
    Report Report               |          |
                                ↓          ↓
                           Update      Test + Typecheck
                           PLAN.md         |
                                ↓          ↓
                             Verify     Update
                                ↓       PLAN.md
                             Report       |
                                         ↓
                                      Verify
                                         |
                                         ↓
                                      Report
```

---

## Component-Specific Guidelines

### Shared Package (`/shared`)

**Test ONLY:**
- ✅ `src/utils/merkle.ts` - Critical business logic
- ✅ `src/utils/validation.ts` - Complex validation

**DO NOT Test:**
- ❌ `src/types/` - All type definitions
- ❌ `src/constants/` - Simple constant values
- ❌ `src/index.ts` - Re-exports

**Commands:**
```bash
pnpm --filter shared typecheck
pnpm --filter shared test
pnpm --filter shared build
```

### Frontend Package (`/frontend`)

**Test ONLY:**
- ✅ Game state management logic
- ✅ Complex UI interactions
- ✅ Transaction flow logic

**DO NOT Test:**
- ❌ Simple components (buttons, cards)
- ❌ Type definitions
- ❌ API wrappers

**Commands:**
```bash
pnpm --filter frontend typecheck
pnpm --filter frontend test
pnpm --filter frontend dev
```

### Backend Package (`/backend`)

**Test ONLY:**
- ✅ Board generation algorithm
- ✅ Merkle proof generation
- ✅ Receipt verification logic
- ✅ Session state management

**DO NOT Test:**
- ❌ Simple CRUD endpoints
- ❌ Database schema
- ❌ Type mappings

**Commands:**
```bash
pnpm --filter backend typecheck
supabase start  # Local development
```

### Contract (`/contract`)

**Use Foundry ONLY:**
- All tests in Solidity
- No TypeScript tests

**Commands:**
```bash
forge test
forge build
```

---

## PLAN.md Update Examples

### Example 1: Simple Type (Already Exists)

**PLAN.md Before:**
```markdown
### 마일스톤 S2: 공유 타입 정의
- [x] `Board`: `{ boardId: string, prizeLayout: Cell[], merkleRoot: string, isAssigned: boolean }`
- [x] `Cell`: `{ cellId: number, tier: number, salt: string }`
- [ ] `RevealedCell`: `{ id: number, sessionId: number, cellId: number, tier: number }`
```

**After Verification:**
```markdown
### 마일스톤 S2: 공유 타입 정의
- [x] `Board`: `{ boardId: string, prizeLayout: Cell[], merkleRoot: string, isAssigned: boolean }`
- [x] `Cell`: `{ cellId: number, tier: number, salt: string }`
- [x] `RevealedCell`: `{ id: number, sessionId: number, cellId: number, tier: number }`
```

**Edit Command:**
```
old_string: "- [ ] `RevealedCell`:"
new_string: "- [x] `RevealedCell`:"
```

### Example 2: Constant (Needs Implementation)

**PLAN.md Before:**
```markdown
### 마일스톤 S3: 공유 상수 및 유틸리티
- [ ] `TIER_DISTRIBUTION`: `{ 1: 1, 2: 2, 3: 6, 4: 10, 5: 18, 6: 12 }`
- [ ] `GRID_SIZE`: `7`
- [ ] `TOTAL_CELLS`: `49`
```

**After Implementation:**
```markdown
### 마일스톤 S3: 공유 상수 및 유틸리티
- [x] `TIER_DISTRIBUTION`: `{ 1: 1, 2: 2, 3: 6, 4: 10, 5: 18, 6: 12 }`
- [ ] `GRID_SIZE`: `7`
- [ ] `TOTAL_CELLS`: `49`
```

### Example 3: Business Logic (TDD)

**PLAN.md Before:**
```markdown
### 마일스톤 S3: 공유 상수 및 유틸리티
- [ ] **Merkle 유틸리티** (`src/utils/merkle.ts`):
  - [ ] `hashLeaf(cellId: number, tier: number, salt: string): string`
  - [ ] 컨트랙트 C3의 해시 로직과 1:1 매칭 보장
```

**After TDD Implementation:**
```markdown
### 마일스톤 S3: 공유 상수 및 유틸리티
- [ ] **Merkle 유틸리티** (`src/utils/merkle.ts`):
  - [x] `hashLeaf(cellId: number, tier: number, salt: string): string`
  - [x] 컨트랙트 C3의 해시 로직과 1:1 매칭 보장
```

---

## Verification Checklist

### Before Marking Item Complete

Check ALL of these:

#### For Type Definitions:
- [ ] Type defined in correct file
- [ ] Type matches PLAN.md specification
- [ ] Type matches TECHSPEC.md requirements
- [ ] Typecheck passes
- [ ] PLAN.md checkbox updated

#### For Constants:
- [ ] Constant defined in correct file
- [ ] Value matches PLAN.md specification
- [ ] Exported from index.ts
- [ ] Typecheck passes
- [ ] PLAN.md checkbox updated

#### For Business Logic:
- [ ] Tests written (if not already existing)
- [ ] All tests pass
- [ ] Implementation complete
- [ ] Typecheck passes
- [ ] Matches TECHSPEC.md requirements
- [ ] PLAN.md checkbox updated

### Commit Checklist

Before committing:

```bash
# Run all checks
pnpm typecheck:all
pnpm test:all

# Verify PLAN.md updated
git diff docs/PLAN.md

# Commit with clear message
git add .
git commit -m "feat: implement RevealedCell type

- Added RevealedCell interface to database.ts
- Updated PLAN.md S2 checklist
- No tests needed per TESTING_POLICY.md"
```

---

## Troubleshooting

### Problem: Can't find next unchecked item
**Solution:** Search PLAN.md for `- [ ]` pattern

### Problem: Implementation exists but checkbox unchecked
**Solution:** Verify implementation correctness, then update PLAN.md immediately

### Problem: Unsure if tests needed
**Solution:**
1. Check `/docs/TESTING_POLICY.md`
2. Default to NO tests for types/constants
3. Default to YES tests for business logic

### Problem: Tests failing
**Solution:**
1. Read error message carefully
2. Fix implementation (GREEN phase)
3. Don't update PLAN.md until tests pass

### Problem: Typecheck failing
**Solution:**
1. Fix type errors first
2. Don't proceed to next item
3. Don't update PLAN.md until typecheck passes

---

## Summary

**The "go" workflow in 7 steps:**
1. 📖 Read PLAN.md
2. 🔍 Check existing work
3. 📋 Consult testing policy
4. ⚙️ Take appropriate action
5. ✅ Update PLAN.md
6. ✓ Verify changes
7. 📣 Report completion

**Remember:**
- ✅ Check before create
- ✅ Test only what matters
- ✅ Update PLAN.md always
- ✅ Verify before reporting

This workflow prevents:
- ❌ Duplicate work
- ❌ Unnecessary tests
- ❌ Unchecked completed items
- ❌ Confusion in future sessions
