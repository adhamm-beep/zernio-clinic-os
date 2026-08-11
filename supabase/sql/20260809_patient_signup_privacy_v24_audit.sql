with checks(check_name,value,expected) as(
 select 'privacy_tables',count(*)::bigint,2::bigint from information_schema.tables where table_schema='public' and table_name in('patient_legal_acceptances','patient_privacy_requests')
 union all select 'privacy_rls',count(*)::bigint,2::bigint from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname in('patient_legal_acceptances','patient_privacy_requests') and c.relrowsecurity
 union all select 'signup_privacy_functions',count(*)::bigint,2::bigint from pg_proc where proname in('patient_register_new_account','patient_submit_privacy_request')
 union all select 'duplicate_patient_account_phone_links',count(*)::bigint,0::bigint from patient_accounts a join customers c on c.id=a.customer_id join patient_accounts a2 on a2.customer_id<>a.customer_id join customers c2 on c2.id=a2.customer_id where right(regexp_replace(coalesce(c.phone_normalized,c.phone,''),'\D','','g'),9)=right(regexp_replace(coalesce(c2.phone_normalized,c2.phone,''),'\D','','g'),9)
 union all select 'open_duplicate_deletion_requests',count(*)::bigint,0::bigint from(select customer_id from patient_privacy_requests group by customer_id having count(*) filter(where request_type='deletion' and status in('submitted','in_review'))>1)q
)
select case when value=expected then 'OK' else 'CHECK' end status,check_name,value,expected from checks order by check_name;
