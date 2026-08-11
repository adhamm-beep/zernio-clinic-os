with checks as (
 select 'payment_intents_table' check_name,count(*)::bigint value,1::bigint expected from information_schema.tables where table_schema='public' and table_name='patient_payment_intents'
 union all select 'payment_intents_rls',count(*)::bigint,1::bigint from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname='patient_payment_intents' and c.relrowsecurity
 union all select 'payment_intent_functions',count(*)::bigint,2::bigint from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in('patient_prepare_online_payment','patient_attach_payment_invoice')
 union all select 'orphan_payment_intents',count(*)::bigint,0::bigint from patient_payment_intents i left join appointments a on a.id=i.appointment_id where a.id is null
 union all select 'invalid_payment_intent_amount',count(*)::bigint,0::bigint from patient_payment_intents where amount<=0
)
select case when value=expected then 'OK' else 'CHECK' end status,check_name,value,expected from checks order by check_name;
