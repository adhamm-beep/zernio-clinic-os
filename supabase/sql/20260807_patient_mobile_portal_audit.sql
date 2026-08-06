with checks as (
  select 'patient_accounts_table' check_name, count(*)::bigint value, 1::bigint expected
  from information_schema.tables where table_schema='public' and table_name='patient_accounts'
  union all select 'patient_notifications_table',count(*)::bigint,1 from information_schema.tables where table_schema='public' and table_name='patient_notifications'
  union all select 'patient_rpc_functions',count(*)::bigint,6 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in('current_patient_customer_id','link_my_patient_account','patient_mobile_dashboard','patient_booking_catalog','patient_book_appointment','patient_cancel_appointment')
  union all select 'patient_rls_tables',count(*)::bigint,2 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname in('patient_accounts','patient_notifications') and c.relrowsecurity
  union all select 'unsafe_authenticated_true_policies',count(*)::bigint,0 from pg_policies where schemaname='public' and 'authenticated'=any(roles) and (coalesce(qual,'') in('true','(true)') or coalesce(with_check,'') in('true','(true)'))
)
select case when value=expected then 'OK' else 'CHECK' end status,check_name,value,expected
from checks order by check_name;
