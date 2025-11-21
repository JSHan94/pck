create or replace function public.reset_user_session(p_user_address text)
returns table (
  session_id bigint,
  board_id uuid
)
language plpgsql
security definer
as $$
declare
  normalized_address text;
  target_session public."GameSession"%rowtype;
begin
  normalized_address := lower(trim(p_user_address));

  if normalized_address is null or length(normalized_address) = 0 then
    raise exception 'INVALID_ADDRESS';
  end if;

  select *
  into target_session
  from public."GameSession"
  where "userAddress" = normalized_address
  order by "createdAt" desc
  limit 1
  for update;

  if not found then
    raise exception 'SESSION_NOT_FOUND';
  end if;

  update public."Board"
  set "isAssigned" = false
  where "boardId" = target_session."boardId";

  delete from public."GameSession"
  where "sessionId" = target_session."sessionId";

  session_id := target_session."sessionId";
  board_id := target_session."boardId";

  return next;
  return;
end;
$$;

grant execute on function public.reset_user_session(text)
to anon, authenticated, service_role;
