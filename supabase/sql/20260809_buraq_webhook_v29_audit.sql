select
  case when to_regclass('public.integration_webhook_events') is not null then 'OK' else 'CHECK' end as status,
  'integration_webhook_events_table' as check_name,
  case when to_regclass('public.integration_webhook_events') is not null then 1 else 0 end as value,
  1 as expected
union all
select
  case when coalesce((select relrowsecurity from pg_class where oid='public.integration_webhook_events'::regclass),false) then 'OK' else 'CHECK' end,
  'integration_webhook_events_rls',
  case when coalesce((select relrowsecurity from pg_class where oid='public.integration_webhook_events'::regclass),false) then 1 else 0 end,
  1
union all
select
  case when count(*)=0 then 'OK' else 'CHECK' end,
  'integration_webhook_client_policies',
  count(*)::int,
  0
from pg_policies
where schemaname='public' and tablename='integration_webhook_events';
