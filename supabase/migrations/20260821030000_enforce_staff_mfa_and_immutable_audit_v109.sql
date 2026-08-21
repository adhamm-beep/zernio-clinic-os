begin;

-- Staff access is allowed only from an MFA-backed session (AAL2). Patient
-- accounts are deliberately unaffected because they are not linked to staff.
create or replace function public.staff_session_has_mfa()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_staff_id() is null
    or coalesce(auth.jwt()->>'aal', 'aal1') = 'aal2';
$$;

revoke all on function public.staff_session_has_mfa() from public, anon;
grant execute on function public.staff_session_has_mfa() to authenticated, service_role;

-- Add one restrictive policy to every RLS-protected application table. It is
-- combined with the existing tenant and permission policies, not a replacement.
do $$
declare
  target record;
begin
  for target in
    select n.nspname as schema_name, c.relname as table_name
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('r', 'p')
      and c.relrowsecurity
      and c.relname not in ('security_rate_limits', 'security_events')
  loop
    execute format(
      'drop policy if exists staff_mfa_required on %I.%I',
      target.schema_name,
      target.table_name
    );
    execute format(
      'create policy staff_mfa_required on %I.%I as restrictive for all to authenticated using (public.staff_session_has_mfa()) with check (public.staff_session_has_mfa())',
      target.schema_name,
      target.table_name
    );
    execute format(
      'alter table %I.%I force row level security',
      target.schema_name,
      target.table_name
    );
  end loop;
end;
$$;

-- Audit and security history is append-only for application users. Inserts
-- continue through trusted SECURITY DEFINER functions and database triggers.
revoke insert, update, delete, truncate on table public.enterprise_audit_log from public, anon, authenticated;
revoke update, delete, truncate on table public.security_events from public, anon, authenticated;

-- Patient clinical media and receipts must never be served from public buckets.
update storage.buckets
set public = false
where id in ('patient-receipts', 'patient-progress');

-- A service-only posture report makes future release checks deterministic
-- without exposing schema details to browser or patient sessions.
create or replace function public.security_posture_report()
returns jsonb
language sql
stable
security definer
set search_path = public, storage
as $$
  select jsonb_build_object(
    'public_tables_without_rls', coalesce((
      select jsonb_agg(c.relname order by c.relname)
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relkind in ('r', 'p')
        and not c.relrowsecurity
    ), '[]'::jsonb),
    'public_patient_buckets', coalesce((
      select jsonb_agg(b.id order by b.id)
      from storage.buckets b
      where b.public
        and (b.id ilike '%patient%' or b.id ilike '%receipt%' or b.id ilike '%medical%')
    ), '[]'::jsonb),
    'staff_tables_without_mfa_policy', coalesce((
      select jsonb_agg(c.relname order by c.relname)
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relkind in ('r', 'p')
        and c.relrowsecurity
        and c.relname not in ('security_rate_limits', 'security_events')
        and not exists (
          select 1 from pg_policy p
          where p.polrelid = c.oid and p.polname = 'staff_mfa_required'
        )
    ), '[]'::jsonb),
    'checked_at', clock_timestamp()
  );
$$;

revoke all on function public.security_posture_report() from public, anon, authenticated;
grant execute on function public.security_posture_report() to service_role;

commit;
