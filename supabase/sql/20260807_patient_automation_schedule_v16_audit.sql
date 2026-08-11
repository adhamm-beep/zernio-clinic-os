with checks as (
  select 'claim_push_function' check_name,count(*)::bigint value,1::bigint expected
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='claim_patient_push_deliveries'
  union all
  select 'reminder_cron_job',count(*)::bigint,1::bigint
  from cron.job where jobname='zernio-patient-appointment-reminders' and active
  union all
  select 'push_dispatch_cron_job',count(*)::bigint,1::bigint
  from cron.job where jobname='zernio-patient-push-dispatch' and active
  union all
  select 'project_url_vault_secret',count(*)::bigint,1::bigint
  from vault.secrets where name='project_url'
  union all
  select 'publishable_key_vault_secret',count(*)::bigint,1::bigint
  from vault.secrets where name='publishable_key'
  union all
  select 'stale_processing_deliveries',count(*)::bigint,0::bigint
  from public.patient_push_deliveries
  where status='processing' and processing_started_at<now()-interval '20 minutes'
)
select case when value=expected then 'OK' else 'CHECK' end status,check_name,value,expected
from checks
order by check_name;
