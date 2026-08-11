with checks(check_name, value, expected) as (
  select 'panthera_public_profile', count(*)::bigint, 1::bigint from public.clinic_public_profiles p join public.clinics c on c.id=p.clinic_id where upper(coalesce(c.code,''))='PANTHERA'
  union all select 'support_phone_ready', count(*)::bigint, 1::bigint from public.clinic_public_profiles p join public.clinics c on c.id=p.clinic_id where upper(coalesce(c.code,''))='PANTHERA' and p.support_phone='+966553367977'
  union all select 'whatsapp_ready', count(*)::bigint, 1::bigint from public.clinic_public_profiles p join public.clinics c on c.id=p.clinic_id where upper(coalesce(c.code,''))='PANTHERA' and p.whatsapp_number='+966553367977'
  union all select 'support_email_hidden', count(*)::bigint, 1::bigint from public.clinic_public_profiles p join public.clinics c on c.id=p.clinic_id where upper(coalesce(c.code,''))='PANTHERA' and p.support_email is null
  union all select 'bilingual_address_ready', count(*)::bigint, 1::bigint from public.clinic_public_profiles p join public.clinics c on c.id=p.clinic_id where upper(coalesce(c.code,''))='PANTHERA' and nullif(trim(p.address_ar),'') is not null and nullif(trim(p.address_en),'') is not null
  union all select 'bilingual_hours_ready', count(*)::bigint, 1::bigint from public.clinic_public_profiles p join public.clinics c on c.id=p.clinic_id where upper(coalesce(c.code,''))='PANTHERA' and nullif(trim(p.working_hours_ar),'') is not null and nullif(trim(p.working_hours_en),'') is not null
  union all select 'legal_name_ready', count(*)::bigint, 1::bigint from public.clinic_public_profiles p join public.clinics c on c.id=p.clinic_id where upper(coalesce(c.code,''))='PANTHERA' and p.legal_name_ar='شركة النمور الطبية'
  union all select 'maps_ready', count(*)::bigint, 1::bigint from public.clinic_public_profiles p join public.clinics c on c.id=p.clinic_id where upper(coalesce(c.code,''))='PANTHERA' and nullif(trim(p.maps_url),'') is not null
  union all select 'google_review_ready', count(*)::bigint, 1::bigint from public.clinic_public_profiles p join public.clinics c on c.id=p.clinic_id where upper(coalesce(c.code,''))='PANTHERA' and p.google_review_url='https://g.page/r/Cc8KdBQ0s_-MEBM/review'
)
select case when value=expected then 'OK' else 'CHECK' end status, check_name, value, expected from checks order by check_name;
