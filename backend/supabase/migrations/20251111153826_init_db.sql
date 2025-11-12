create table if not exists public."Board" (
  "boardId" uuid primary key default gen_random_uuid(),
  "prizeLayout" jsonb not null,
  "merkleRoot" text not null unique,
  "isAssigned" boolean not null default false,
  "createdAt" timestamptz not null default now()
);

create table if not exists public."User" (
  "address" text primary key,
  "createdAt" timestamptz not null default now()
);

create table if not exists public."GameSession" (
  "sessionId" bigserial primary key,
  "userAddress" text not null references public."User"("address") on delete cascade,
  "boardId" uuid not null references public."Board"("boardId") on delete restrict,
  "pullCount" integer not null default 0,
  "isActive" boolean not null default false,
  "createdAt" timestamptz not null default now()
);

create table if not exists public."RevealedCell" (
  "id" bigserial primary key,
  "sessionId" bigint not null references public."GameSession"("sessionId") on delete cascade,
  "cellId" integer not null,
  "tier" integer not null,
  "revealedAt" timestamptz not null default now()
);

create unique index if not exists revealedcell_session_cell_idx
  on public."RevealedCell"("sessionId", "cellId");

create table if not exists public."PrizeClaim" (
  "prizeId" uuid primary key default gen_random_uuid(),
  "userAddress" text not null references public."User"("address") on delete cascade,
  "sessionId" bigint not null references public."GameSession"("sessionId") on delete cascade,
  "cellId" integer not null,
  "tier" integer not null,
  "isClaimed" boolean not null default false,
  "claimedTxHash" text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create index if not exists prizeclaim_user_idx on public."PrizeClaim"("userAddress");
create index if not exists prizeclaim_session_idx on public."PrizeClaim"("sessionId");
