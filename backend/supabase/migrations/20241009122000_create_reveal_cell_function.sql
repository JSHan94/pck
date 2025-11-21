create or replace function public.reveal_cell(
  p_session_id bigint,
  p_user_address text,
  p_cell_id integer,
  p_require_active boolean default false
)
returns table (
  tier integer,
  prize_id uuid,
  pull_count integer
)
language plpgsql
security definer
as $$
declare
  normalized_address text;
  session_record public."GameSession"%rowtype;
  board_record public."Board"%rowtype;
  cell jsonb;
  cell_tier integer;
begin
  normalized_address := lower(trim(p_user_address));

  select *
  into session_record
  from public."GameSession"
  where "sessionId" = p_session_id
  for update;

  if not found then
    raise exception 'SESSION_NOT_FOUND';
  end if;

  if session_record."userAddress" <> normalized_address then
    raise exception 'NOT_OWNER';
  end if;

  if p_require_active and session_record."isActive" is not true then
    raise exception 'SESSION_NOT_ACTIVE';
  end if;

  if session_record."pullCount" >= 49 then
    raise exception 'BOARD_COMPLETED';
  end if;

  if p_cell_id < 0 or p_cell_id >= 49 then
    raise exception 'INVALID_CELL_ID';
  end if;

  perform
  from public."RevealedCell"
  where "sessionId" = p_session_id
    and "cellId" = p_cell_id;

  if found then
    raise exception 'ALREADY_REVEALED';
  end if;

  select *
  into board_record
  from public."Board"
  where "boardId" = session_record."boardId"
  for update;

  if not found then
    raise exception 'BOARD_NOT_FOUND';
  end if;

  select value
  into cell
  from jsonb_array_elements(board_record."prizeLayout") value
  where (value->>'cellId')::integer = p_cell_id
  limit 1;

  if cell is null then
    raise exception 'CELL_NOT_FOUND';
  end if;

  cell_tier := (cell->>'tier')::integer;

  insert into public."RevealedCell" ("sessionId", "cellId", "tier")
  values (p_session_id, p_cell_id, cell_tier);

  insert into public."PrizeClaim" ("userAddress", "sessionId", "cellId", "tier")
  values (session_record."userAddress", p_session_id, p_cell_id, cell_tier)
  returning "prizeId" into prize_id;

  update public."GameSession"
  set "pullCount" = "pullCount" + 1
  where "sessionId" = p_session_id
  returning "pullCount" into pull_count;

  tier := cell_tier;
  return next;
  return;
end;
$$;

grant execute on function public.reveal_cell(bigint, text, integer, boolean)
to anon, authenticated, service_role;
