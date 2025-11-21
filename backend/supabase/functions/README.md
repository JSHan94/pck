# Supabase Edge Functions

This directory hosts the Deno-based Edge Functions for the backend component.  
Use the Supabase CLI to run or deploy functions from this folder.

## Local development

```bash
cd backend/supabase/functions
supabase functions serve --env-file ../.env
```

Each function lives in its own subdirectory (e.g., `health/`) with an `index.ts` entrypoint.  
Shared utilities from `@pck/shared` are mapped in `import_map.json`, so you can write imports like `import { TOTAL_CELLS } from "@pck/shared";` directly inside Edge Functions.

## External dependencies

`import_map.json` wires npm packages via Deno's `npm:` spec:

- `merkletreejs` (Merkle tree generation/proof helpers)
- `keccak256` (hash helper matching Solidity)
- `viem` (shared hashing helpers such as `concatHex`)

Example:

```ts
import keccak256 from "keccak256";
import { MerkleTree } from "merkletreejs";
import { concatHex } from "viem";
```

## Deploying functions

Set `SUPABASE_PROJECT_ID` (or `SUPABASE_PROJECT_REF`) and run:

```bash
pnpm --filter @pck/backend deploy:functions
```

The script iterates through every function directory under `supabase/functions` (excluding `_shared`) and invokes the Supabase CLI to deploy each one with the shared `.env` file if present. Use `SUPABASE_BIN` to point to a custom CLI binary if needed.

## Environment variables

All functions rely on the following secrets (configure via `supabase secrets set ...`):

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_WALLET_ADDRESSES` (comma-separated)
- `ADMIN_API_KEY` (optional)
- `ADMIN_PREGENERATE_MAX` (optional, default `200`)

## Admin authentication

`_shared/adminAuth.ts` exposes `requireAdmin(request)` which validates:

- `x-user-address` header matches one of the comma-separated wallets in `ADMIN_WALLET_ADDRESSES`
- Optional `x-admin-api-key` header matches `ADMIN_API_KEY` (if configured)

Set both secrets via `supabase secrets set ADMIN_WALLET_ADDRESSES="0x123...,0x456..." ADMIN_API_KEY="super-secret"`.
