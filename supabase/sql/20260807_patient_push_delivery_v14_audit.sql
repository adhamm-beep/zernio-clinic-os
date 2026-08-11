with checks as (
 select 'push_delivery_table' check_name,count(*)::bigint value,1::bigint expected from information_schema.tables where table_schema='public' and table_name='patient_push_deliveries'
 union all select 'push_delivery_rls',count(*)::bigint,1::bigint from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname='patient_push_deliveries' and c.relrowsecurity
 union all select 'push_queue_trigger',count(*)::bigint,1::bigint from pg_trigger where tgname='patient_notification_queue_push' and not tgisinternal
 union all select 'push_reminder_function',count(*)::bigint,1::bigint from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='generate_patient_appointment_reminders'
 union all select 'orphan_push_deliveries',count(*)::bigint,0::bigint from patient_push_deliveries d left join patient_notifications n on n.id=d.notification_id where n.id is null
)
select case when value=expected then 'OK' else 'CHECK' end status,check_name,value,expected from checks order by check_name;
