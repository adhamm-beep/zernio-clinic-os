with checks(check_name,value,expected)as(
select 'localized_booking_functions',count(*)::bigint,2::bigint from pg_proc where proname in('patient_booking_providers_localized','patient_provider_services_localized')
union all select 'active_services_missing_arabic',count(*),0 from public.services where is_active and(name_ar is null or trim(name_ar)='')
union all select 'active_services_missing_english',count(*),0 from public.services where is_active and(name_en is null or trim(name_en)=''))
select case when value=expected then 'OK' else 'CHECK' end status,check_name,value,expected from checks order by check_name;
