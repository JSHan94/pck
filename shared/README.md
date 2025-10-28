# @pck/shared

Shared TypeScript package containing types, constants, and utilities for the PCK monorepo.

## Purpose

Provides type safety and code reuse across:
- Frontend (React)
- Backend (Supabase Edge Functions)

## Structure

```
shared/
├── src/
│   ├── types/          # Shared TypeScript interfaces
│   │   ├── api.ts      # API request/response types
│   │   ├── database.ts # Database schema types
│   │   └── index.ts
│   ├── constants/      # Shared constants
│   │   └── index.ts    # Game constants (GRID_SIZE, TIER_DISTRIBUTION, etc.)
│   ├── utils/          # Shared utility functions
│   │   └── index.ts
│   └── index.ts        # Main exports
├── dist/               # Compiled output
└── README.md
```

## Installation

This package is part of the monorepo. Import from other packages:

```typescript
// In frontend or backend
import { StartSessionResponse, TIER_DISTRIBUTION } from '@pck/shared';
```

## Available Exports

### Types

**API Types** (`src/types/api.ts`):
- `StartSessionResponse` - Session initialization data
- `PullRequest` / `PullResponse` - Cell reveal logic
- `HintResponse` - Hint system data
- `ClaimProofResponse` - Merkle proof for prize claiming
- `VerifyReceiptRequest` / `VerifyReceiptResponse` - Receipt verification

**Database Types** (`src/types/database.ts`):
- `Board` - Game board with prize layout and merkle root
- `Cell` - Individual cell data (cellId, tier, salt)
- `GameSession` - User session state
- `RevealedCell` - Revealed cell tracking
- `PrizeClaim` - Prize claim records

### Constants

**Game Constants** (`src/constants/index.ts`):
- `TIER_DISTRIBUTION` - Prize tier distribution (49 total)
- `GRID_SIZE` - Grid dimensions (7×7)
- `TOTAL_CELLS` - Total cells (49)
- `HINT_INTERVAL` - Hint frequency (every 3 pulls)

### Utilities

**Coming Soon**:
- `hashLeaf()` - Merkle leaf hashing (must match Solidity)
- Validation utilities for tiers and cell IDs

## Scripts

```bash
# Build the package
pnpm build

# Type checking
pnpm typecheck

# Watch mode for development
pnpm watch

# Run tests (when utility tests are added)
pnpm test
```

## Development

### Adding New Types

1. Add interface to appropriate file in `src/types/`
2. Export from `src/types/index.ts`
3. Export from `src/index.ts`
4. Run `pnpm build` to generate declaration files

### Adding New Constants

1. Add constant to `src/constants/index.ts`
2. Export from `src/index.ts`
3. Run `pnpm build`

### Adding New Utilities

1. Implement in `src/utils/[name].ts`
2. Write tests in `test/utils/[name].test.ts` (for critical logic only)
3. Export from `src/utils/index.ts`
4. Export from `src/index.ts`
5. Run tests: `pnpm test`
6. Run build: `pnpm build`

## Testing Philosophy

**See [/docs/TESTING_SHARED.md](/docs/TESTING_SHARED.md) and [/docs/TESTING_POLICY.md](/docs/TESTING_POLICY.md)**

We follow a pragmatic testing approach:
- ✅ Test critical business logic (Merkle trees, complex validations)
- ❌ Skip testing simple types and constants
- 🎯 Focus on high-value, high-risk code

## Type Safety

This package relies heavily on TypeScript for validation:
- All exports are fully typed
- Strict mode enabled
- Declaration files generated automatically

## Dependencies

- `viem` - Ethereum utilities (for Merkle hashing)

## Dev Dependencies

- `typescript` - Type checking and compilation
- `vitest` - Testing framework (for utilities)
- `@types/node` - Node.js type definitions

## Usage Examples

### Frontend

```typescript
import { StartSessionResponse, GRID_SIZE, TIER_DISTRIBUTION } from '@pck/shared';

async function startGame() {
  const response: StartSessionResponse = await api.get('/game/start-session');
  console.log(`Grid size: ${GRID_SIZE}×${GRID_SIZE}`);
}
```

### Backend

```typescript
import { Board, Cell, TIER_DISTRIBUTION } from '@pck/shared';

function createBoard(): Board {
  const cells: Cell[] = generateCells(TIER_DISTRIBUTION);
  // ... generate board
}
```

## Versioning

This package uses semantic versioning. Version is kept in sync with the monorepo.

## License

Private - Part of PCK monorepo
