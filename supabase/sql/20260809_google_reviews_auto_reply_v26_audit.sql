with checks as(
 select 'google_review_referral_table' check_name,count(*)::bigint value,1::bigint expected from information_schema.tables where table_schema='public' and table_name='patient_google_review_referrals'
 union all select 'google_review_function',count(*)::bigint,1::bigint from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='patient_google_review_destination'
 union all select 'patient_message_metadata',count(*)::bigint,1::bigint from information_schema.columns where table_schema='public' and table_name='patient_messages' and column_name='metadata'
 union all select 'google_review_link_missing',count(*)::bigint,0::bigint from clinic_public_profiles where nullif(google_review_url,'') is null and nullif(google_place_id,'') is null
)
select case when value=expected then 'OK' else 'CHECK' end status,check_name,value,expected from checks order by check_name;
