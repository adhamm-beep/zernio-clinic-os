  begin;
  
  alter table public.clinic_public_profiles add column if not exists legal_name_ar text;
  alter table public.clinic_public_profiles add column if not exists legal_name_en text;
  
  insert into public.clinic_public_profiles (
    clinic_id, support_phone, whatsapp_number, support_email,
    address_ar, address_en, working_hours_ar, working_hours_en,
    legal_name_ar, legal_name_en, maps_url, google_review_url, updated_at
  )
  select
    c.id,
    '+966553367977',
    '+966553367977',
    null,
    'عيادات بانثيرا جلدية تجميل ليزر',
    'Panthera Clinics – Dermatology, Aesthetics & Laser',
    'يوميًا من 10:00 صباحًا إلى 10:00 مساءً',
    'Daily, 10:00 AM–10:00 PM',
    'شركة النمور الطبية',
    'Al Nomour Medical Company',
    'https://www.google.com/maps/place/%D8%B9%D9%8A%D8%A7%D8%AF%D8%A7%D8%AA+%D8%A8%D8%A7%D9%86%D8%AB%D9%8A%D8%B1%D8%A7+%D8%AC%D9%84%D8%AF%D9%8A%D8%A9+%D8%AA%D8%AC%D9%85%D9%8A%D9%84+%D9%84%D9%8A%D8%B2%D8%B1+panthera+clinics%E2%80%AD/@24.7996636,46.5920414,14z/data=!4m15!1m8!3m7!1s0x3e2ee5002f0463ab:0x8cffb33414740acf!2z2LnZitin2K_Yp9iqINio2KfZhtir2YrYsdinINis2YTYr9mK2Kkg2KrYrNmF2YrZhCDZhNmK2LLYsSBwYW50aGVyYSBjbGluaWNz!8m2!3d24.8002039!4d46.5997792!10e1!16s%2Fg%2F11whfk8ylj!3m5!1s0x3e2ee5002f0463ab:0x8cffb33414740acf!8m2!3d24.8002039!4d46.5997792!16s%2Fg%2F11whfk8ylj?entry=ttu&g_ep=EgoyMDI2MDgwNS4xIKXMDSoASAFQAw%3D%3D',
    'https://g.page/r/Cc8KdBQ0s_-MEBM/review',
    now()
  from public.clinics c
  where upper(coalesce(c.code, '')) = 'PANTHERA'
  on conflict (clinic_id) do update set
    support_phone = excluded.support_phone,
    whatsapp_number = excluded.whatsapp_number,
    support_email = null,
    address_ar = excluded.address_ar,
    address_en = excluded.address_en,
    working_hours_ar = excluded.working_hours_ar,
    working_hours_en = excluded.working_hours_en,
    legal_name_ar = excluded.legal_name_ar,
    legal_name_en = excluded.legal_name_en,
    maps_url = excluded.maps_url,
    google_review_url = excluded.google_review_url,
    updated_at = now();
  
  create or replace function public.patient_clinic_contact()
  returns jsonb language plpgsql security definer set search_path=public as $$
  declare v_customer_id bigint:=public.current_patient_customer_id();v_language text:='en';
  begin
   if v_customer_id is null then raise exception 'Patient account is not linked';end if;
   select coalesce(preferred_language,'en') into v_language from patient_accounts where customer_id=v_customer_id;
   return (select jsonb_build_object(
    'clinicName',case when v_language='ar' then 'عيادات بانثيرا' else c.name end,
    'branchName',b.name,
    'phone',coalesce(nullif(p.support_phone,''),nullif(b.phone,''),nullif(c.phone,'')),
    'whatsapp',p.whatsapp_number,
    'email',null,
    'address',case when v_language='ar' then coalesce(nullif(p.address_ar,''),b.address) else coalesce(nullif(p.address_en,''),b.address) end,
    'mapsUrl',p.maps_url,
    'workingHours',case when v_language='ar' then p.working_hours_ar else p.working_hours_en end)
   from customers x join clinics c on c.id=x.clinic_id left join branches b on b.id=x.branch_id left join clinic_public_profiles p on p.clinic_id=x.clinic_id where x.id=v_customer_id);
  end;$$;
  
  revoke all on function public.patient_clinic_contact() from public;
  grant execute on function public.patient_clinic_contact() to authenticated;
  
  commit;
  
  select c.code clinic_code, p.support_phone, p.whatsapp_number,
    nullif(trim(p.maps_url), '') is not null maps_ready,
    nullif(trim(p.google_review_url), '') is not null google_review_ready
  from public.clinic_public_profiles p
  join public.clinics c on c.id = p.clinic_id
  where upper(coalesce(c.code, '')) = 'PANTHERA';
