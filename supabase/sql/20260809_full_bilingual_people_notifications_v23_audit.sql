with checks(check_name,value,expected) as (
  select 'approved_doctors_with_arabic_name',count(*)::bigint,3::bigint from public.staff where is_active and lower(coalesce(role,''))='doctor' and nullif(staff_name_ar,'') is not null and staff_name_ar<>staff_name_en
  union all select 'approved_doctors_with_english_name',count(*)::bigint,3::bigint from public.staff where is_active and lower(coalesce(role,''))='doctor' and nullif(staff_name_en,'') is not null
  union all select 'patient_language_function',count(*)::bigint,1::bigint from pg_proc where proname='patient_set_language'
  union all select 'patient_notification_translation_trigger',count(*)::bigint,1::bigint from pg_trigger where tgname='patient_notification_bilingual_fields' and not tgisinternal
  union all select 'patient_push_language_function',count(*)::bigint,1::bigint from pg_proc where proname='queue_patient_push_notification'
  union all select 'notifications_missing_english',count(*)::bigint,0::bigint from public.patient_notifications where nullif(title_en,'') is null or nullif(message_en,'') is null
  union all select 'notifications_missing_arabic',count(*)::bigint,0::bigint from public.patient_notifications where nullif(title_ar,'') is null or nullif(message_ar,'') is null
)
select case when value=expected then 'OK' else 'CHECK' end status,check_name,value,expected from checks order by check_name;
