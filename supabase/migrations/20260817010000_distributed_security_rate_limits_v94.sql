create table if not exists public.security_rate_limits (
  key_hash text primary key,
  attempt_count integer not null check (attempt_count > 0),
  window_expires_at timestamptz not null,
  updated_at timestamptz not null default now()
);

alter table public.security_rate_limits enable row level security;
revoke all on table public.security_rate_limits from anon, authenticated;

create or replace function public.consume_security_rate_limit(
  p_key_hash text,
  p_limit integer,
  p_window_seconds integer
)
returns table(allowed boolean, retry_after_seconds integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_count integer;
  expires_at timestamptz;
begin
  if p_key_hash !~ '^[0-9a-f]{64}$'
     or p_limit < 1
     or p_window_seconds < 1
     or p_window_seconds > 86400 then
    raise exception 'Invalid rate-limit input';
  end if;

  insert into public.security_rate_limits as limits (
    key_hash,
    attempt_count,
    window_expires_at,
    updated_at
  ) values (
    p_key_hash,
    1,
    now() + make_interval(secs => p_window_seconds),
    now()
  )
  on conflict (key_hash) do update
  set attempt_count = case
        when limits.window_expires_at <= now() then 1
        else limits.attempt_count + 1
      end,
      window_expires_at = case
        when limits.window_expires_at <= now()
          then now() + make_interval(secs => p_window_seconds)
        else limits.window_expires_at
      end,
      updated_at = now()
  returning attempt_count, window_expires_at
    into current_count, expires_at;

  return query select
    current_count <= p_limit,
    case
      when current_count <= p_limit then 0
      else greatest(1, ceil(extract(epoch from (expires_at - now())))::integer)
    end;
end;
$$;

revoke all on function public.consume_security_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_security_rate_limit(text, integer, integer) to service_role;

create index if not exists security_rate_limits_expiry_idx
  on public.security_rate_limits(window_expires_at);
