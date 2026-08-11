with checks as(
 select 'clinic_public_profile_table' check_name,count(*)::bigint value,1::bigint expected from information_schema.tables where table_schema='public' and table_name='clinic_public_profiles'
 union all select 'clinic_public_profile_seeded',count(*)::bigint,(select count(*)::bigint from clinics) from clinic_public_profiles
 union all select 'membership_staff_function',count(*)::bigint,1::bigint from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='staff_customer_membership_summary'
 union all select 'patient_contact_function',count(*)::bigint,1::bigint from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='patient_clinic_contact'
 union all select 'support_phone_missing',count(*)::bigint,0::bigint from clinic_public_profiles where nullif(trim(support_phone),'') is null
 union all select 'whatsapp_missing',count(*)::bigint,0::bigint from clinic_public_profiles where nullif(trim(whatsapp_number),'') is null
 union all select 'address_ar_missing',count(*)::bigint,0::bigint from clinic_public_profiles where nullif(trim(address_ar),'') is null
)
select case when value=expected then 'OK' else 'CHECK' end status,check_name,value,expected from checks order by check_name;
