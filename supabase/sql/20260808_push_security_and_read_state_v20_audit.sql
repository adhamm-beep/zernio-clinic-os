with checks(check_name,value,expected)as(
 select 'mark_notifications_read_function',count(*)::bigint,1::bigint from pg_proc where proname='patient_mark_notifications_read'
 union all select 'push_dispatch_secret',count(*),1 from vault.secrets where name='push_dispatch_secret'
 union all select 'push_dispatch_cron',count(*),1 from cron.job where jobname='zernio-patient-push-dispatch'
 union all select 'duplicate_push_jobs',greatest(count(*)-1,0),0 from cron.job where jobname='zernio-patient-push-dispatch'
 union all select 'active_tokens_without_customer',count(*),0 from public.patient_push_tokens t left join public.customers c on c.id=t.customer_id where t.is_active and c.id is null
 union all select 'orphan_push_deliveries',count(*),0 from public.patient_push_deliveries d left join public.patient_notifications n on n.id=d.notification_id where n.id is null
)
select case when value=expected then 'OK' else 'CHECK' end status,check_name,value,expected from checks order by check_name;

-- Copy the returned value directly into the Edge Function secret. Do not share it in chat or screenshots.
select decrypted_secret as push_dispatch_secret_for_edge_function
from vault.decrypted_secrets where name='push_dispatch_secret';
