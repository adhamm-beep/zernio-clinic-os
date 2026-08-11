with sensitive(table_name)as(values('customers'),('appointments'),('treatments'),('payments'),('follow_ups'),('medical_records'),('treatment_sessions'),('treatment_items')),
checks(check_name,value,expected)as(
 select 'sensitive_tables_without_rls',count(*)::bigint,0::bigint from sensitive s join pg_class c on c.relname=s.table_name join pg_namespace n on n.oid=c.relnamespace and n.nspname='public' where not c.relrowsecurity
 union all select 'unsafe_true_policies',count(*),0 from pg_policies p join sensitive s on s.table_name=p.tablename where p.schemaname='public' and(coalesce(p.qual,'')='true' or coalesce(p.with_check,'')='true')
 union all select 'anonymous_sensitive_table_grants',count(*),0 from information_schema.role_table_grants g join sensitive s on s.table_name=g.table_name where g.table_schema='public' and g.grantee='anon'
 union all select 'tenant_scoped_policies',count(*),32 from pg_policies p join sensitive s on s.table_name=p.tablename where p.schemaname='public'
 union all select 'current_staff_without_clinic',count(*),0 from public.staff where is_active and email is not null and clinic_id is null
)
select case when value=expected then 'OK' else 'CHECK' end status,check_name,value,expected from checks order by check_name;
