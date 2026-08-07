with checks(check_name,value,expected) as (
 select 'booking_provider_labels'::text,count(*)::bigint,6::bigint from public.patient_booking_providers() where name in('Dr Fatima Alsatouf','Dr Maram','Dr Fatima Khaled','Bleaching','Laser Hair Removal','ProFacial')
 union all select 'status_notification_trigger',count(*)::bigint,1 from pg_trigger where tgname='appointments_notify_patient_status' and not tgisinternal
 union all select 'status_notification_function',count(*)::bigint,1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='notify_patient_appointment_status'
 union all select 'patient_notifications_realtime',count(*)::bigint,1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='patient_notifications'
)
select case when value=expected then 'OK' else 'CHECK' end status,check_name,value,expected from checks order by check_name;
