create or replace function public.allocate_board_to_session(p_user_address text)
returns table (
  session_id bigint,
  board_id uuid,
  merkle_root text
)
language plpgsql
security definer
as $$
declare
  selected_board public."Board"%rowtype;
  normalized_address text;
begin
  normalized_address := lower(trim(p_user_address));

  if normalized_address is null or length(normalized_address) = 0 then
    raise exception 'INVALID_USER_ADDRESS';
  end if;

  select *
  into selected_board
  from public."Board"
  where "isAssigned" = false
  order by random()
  limit 1
  for update skip locked;

  if not found then
    raise exception 'NO_AVAILABLE_BOARDS';
  end if;

  update public."Board"
  set "isAssigned" = true
  where "boardId" = selected_board."boardId";

  insert into public."User" ("address")
  values (normalized_address)
  on conflict ("address") do nothing;

  insert into public."GameSession" (
    "userAddress",
    "boardId",
    "isActive",
    "pullCount"
  )
  values (
    normalized_address,
    selected_board."boardId",
    false,
    0
  )
  returning "sessionId" into session_id;

  board_id := selected_board."boardId";
  merkle_root := selected_board."merkleRoot";

  return next;
  return;
end;
$$;

grant execute on function public.allocate_board_to_session(text)
to anon, authenticated, service_role;
