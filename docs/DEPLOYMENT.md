# Deployment Guide

This document describes how to ship the current off‑chain build (frontend + Supabase backend) to production. Smart‑contract work is deferred to F6, so this guide only covers the “fully off‑chain” release that runs entirely on Supabase + Vercel.

## 1. Prerequisites

- Vercel account with access to the target team/project
- Supabase project already provisioned and populated with the required tables/functions
- Privy project (App ID) configured for the same domain
- RPC provider URL (Infura/Alchemy) for the blockchain calls performed inside Supabase verification endpoints (future phase but keep value handy)
- `pnpm` 8.x installed locally
- Vercel CLI (`npm i -g vercel`) for first‑time linking + env management

## 2. Environment Variables

Create the following variables in Vercel (Project Settings → Environment Variables). All of them must be available in **Preview** and **Production** environments.

| Variable | Description |
| --- | --- |
| `VITE_SUPABASE_URL` | Your Supabase project URL (`https://xxxx.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public API key |
| `VITE_PRIVY_APP_ID` | Privy App ID for wallet authentication |
| `VITE_CHAIN_ID` | Target chain ID (default: `11155111` for Sepolia) |
| `VITE_CONTRACT_ADDRESS` | Leave as dummy for now (`0x000...000`) – real value added in Proof stage |
| `VITE_RPC_URL` | RPC endpoint used by frontend utilities (also referenced by backend for parity) |

> Tip: run `vercel env add` to enter each value via CLI, or upload a `.env` file with `vercel env pull/push`.

## 3. Build/Deploy Commands

Vercel uses the repository root as the project root. The included `vercel.json` already instructs Vercel to:

```json
{
  "buildCommand": "pnpm --filter shared build && pnpm --filter frontend build",
  "installCommand": "pnpm install --frozen-lockfile",
  "outputDirectory": "frontend/dist"
}
```

This guarantees the shared package is compiled before the frontend build consumes it. No additional configuration is required in the Vercel dashboard besides selecting this repo and confirming the output directory (`frontend/dist`).

## 4. Local Verification Checklist

Before pushing a deployment, run the same commands locally:

```bash
pnpm install
pnpm --filter shared build
pnpm --filter frontend build
```

Then preview the production bundle with Vite:

```bash
cd frontend
pnpm preview
```

Visit `http://localhost:4173` and ensure:

- Supabase endpoints respond correctly
- Privy login works with your configured redirect URI
- Pulls, hints, prizes, and admin reset behave as expected

## 5. First-Time Vercel Setup

1. `vercel login`
2. From the repo root: `vercel link` (select the existing project or create a new one)
3. `vercel env pull` (optional) to fetch remote env into `.env.vercel`
4. Push environment variables (`vercel env add` …)
5. Trigger a preview deployment: `vercel --prod` or rely on Git → Vercel integration

The first build may take longer because `pnpm install` happens at the root and compiles the shared package. Subsequent builds are cached.

## 6. Rollout Strategy

1. Merge frontend/backend fixes into `main`
2. Vercel builds a Preview deployment automatically
3. Smoke-test the Preview URL using production Supabase/Privy
4. Promote Preview → Production via the Vercel dashboard (or `vercel --prod`)

## 7. Troubleshooting

- **`AdminCheckResponse` or other shared types missing**: ensure `pnpm --filter shared build` completes before the frontend build; Vercel already does this, but local builds need the same sequence.
- **Supabase CORS errors**: add the Vercel domain to Supabase → Authentication → URL configuration.
- **Privy errors**: register the Vercel domain in Privy Dashboard → Allowed origins & redirect URIs.

Once these steps are complete, the “Vercel 배포” checklist item in `PLAN.md` can be marked as done. The Proof-stage work (F6) will revisit this guide to add contract-specific variables and flows.
