begin;

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;
create extension if not exists supabase_vault with schema vault;

alter table public.patient_push_deliveries
  add column if not exists processing_started_at timestamptz;

create or replace function public.claim_patient_push_deliveries(p_limit integer default 100)
returns setof public.patient_push_deliveries
language plpgsql
security definer
set search_path=public
as $$
begin
  return query
  with candidates as (
    select d.id
    from public.patient_push_deliveries d
    where d.attempts < 5
      and (
        d.status in ('pending','failed')
        or (d.status='processing' and d.processing_started_at < now()-interval '10 minutes')
      )
    order by d.created_at
    for update skip locked
    limit greatest(1,least(coalesce(p_limit,100),100))
  )
  update public.patient_push_deliveries d
  set status='processing',processing_started_at=now()
  from candidates c
  where d.id=c.id
  returning d.*;
end;
$$;

revoke all on function public.claim_patient_push_deliveries(integer) from public,anon,authenticated;
grant execute on function public.claim_patient_push_deliveries(integer) to service_role;

select cron.schedule(
  'zernio-patient-appointment-reminders',
  '*/15 * * * *',
  'select public.generate_patient_appointment_reminders();'
);

do $$
begin
  if not exists(select 1 from vault.secrets where name='project_url') then
    perform vault.create_secret(
      'https://smkyqnukliuckemrmndr.supabase.co',
      'project_url',
      'Zernio Supabase project URL used by scheduled Edge Functions'
    );
  end if;
end;
$$;

do $$
begin
  if exists(select 1 from vault.secrets where name='publishable_key') then
    perform cron.schedule(
      'zernio-patient-push-dispatch',
      '* * * * *',
      $job$
        select net.http_post(
          url := (select decrypted_secret from vault.decrypted_secrets where name='project_url') || '/functions/v1/patient-push',
          headers := jsonb_build_object(
            'Content-Type','application/json',
            'apikey',(select decrypted_secret from vault.decrypted_secrets where name='publishable_key')
          ),
          body := jsonb_build_object('scheduled_at',now()),
          timeout_milliseconds := 10000
        );
      $job$
    );
  else
    raise notice 'Add the publishable_key secret to Vault, then run this file again to enable push dispatch.';
  end if;
end;
$$;

commit;
