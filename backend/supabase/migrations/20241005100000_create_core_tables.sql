create extension if not exists "pgcrypto";

create table if not exists public."Board" (
  "boardId" uuid primary key default gen_random_uuid(),
  "prizeLayout" jsonb not null,
  "merkleRoot" text not null,
  "isAssigned" boolean not null default false,
  "createdAt" timestamptz not null default timezone('utc', now())
);

create table if not exists public."User" (
  "address" text primary key,
  "createdAt" timestamptz not null default timezone('utc', now())
);

create table if not exists public."GameSession" (
  "sessionId" bigserial primary key,
  "userAddress" text not null,
  "boardId" uuid not null references public."Board"("boardId") on delete restrict,
  "pullCount" integer not null default 0,
  "isActive" boolean not null default false,
  "createdAt" timestamptz not null default timezone('utc', now()),
  constraint "GameSession_userAddress_fkey" foreign key ("userAddress") references public."User"("address") on delete restrict
);

create table if not exists public."RevealedCell" (
  "id" bigserial primary key,
  "sessionId" bigint not null references public."GameSession"("sessionId") on delete cascade,
  "cellId" integer not null,
  "tier" integer not null,
  "revealedAt" timestamptz not null default timezone('utc', now())
);

create table if not exists public."PrizeClaim" (
  "prizeId" uuid primary key default gen_random_uuid(),
  "userAddress" text not null references public."User"("address") on delete restrict,
  "sessionId" bigint not null references public."GameSession"("sessionId") on delete cascade,
  "cellId" integer not null,
  "tier" integer not null,
  "isClaimed" boolean not null default false,
  "claimedTxHash" text,
  "createdAt" timestamptz not null default timezone('utc', now()),
  "updatedAt" timestamptz not null default timezone('utc', now())
);

create index if not exists "RevealedCell_sessionId_cellId_idx" on public."RevealedCell" ("sessionId", "cellId");
create index if not exists "PrizeClaim_userAddress_idx" on public."PrizeClaim" ("userAddress");
create index if not exists "PrizeClaim_sessionId_idx" on public."PrizeClaim" ("sessionId");
