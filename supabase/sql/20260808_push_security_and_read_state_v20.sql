begin;

create extension if not exists pgcrypto with schema extensions;
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;
create extension if not exists supabase_vault with schema vault;

create or replace function public.patient_mark_notifications_read() returns integer
language plpgsql security definer set search_path=public as $$
declare v_customer_id bigint:=public.current_patient_customer_id();v_count integer;
begin
  if v_customer_id is null then raise exception 'Patient account is not linked';end if;
  update public.patient_notifications set is_read=true where customer_id=v_customer_id and not is_read;
  get diagnostics v_count=row_count;return v_count;
end$$;
revoke all on function public.patient_mark_notifications_read() from public,anon;
grant execute on function public.patient_mark_notifications_read() to authenticated;

do $$begin
  if not exists(select 1 from vault.secrets where name='push_dispatch_secret')then
    perform vault.create_secret(encode(extensions.gen_random_bytes(32),'hex'),'push_dispatch_secret','Authenticates the scheduled patient push dispatcher');
  end if;
end$$;

do $$declare jid bigint;begin
  for jid in select jobid from cron.job where jobname='zernio-patient-push-dispatch' loop perform cron.unschedule(jid);end loop;
  perform cron.schedule('zernio-patient-push-dispatch','* * * * *',$job$
    select net.http_post(
      url:=(select decrypted_secret from vault.decrypted_secrets where name='project_url')||'/functions/v1/patient-push',
      headers:=jsonb_build_object('Content-Type','application/json','apikey',(select decrypted_secret from vault.decrypted_secrets where name='publishable_key'),'Authorization','Bearer '||(select decrypted_secret from vault.decrypted_secrets where name='push_dispatch_secret')),
      body:=jsonb_build_object('scheduled_at',now()),timeout_milliseconds:=10000);
  $job$);
end$$;

commit;
