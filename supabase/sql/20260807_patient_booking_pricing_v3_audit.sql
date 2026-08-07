with checks(check_name,value,expected) as (
 select 'booking_providers'::text,count(*)::bigint,6::bigint from public.patient_booking_providers()
 union all select 'department_providers',count(*)::bigint,3 from public.patient_booking_providers() where role='department'
 union all select 'doctor_providers',count(*)::bigint,3 from public.patient_booking_providers() where role='doctor'
 union all select 'department_services_without_full_price',count(*)::bigint,0 from public.services s where s.is_active and s.provider_type='department' and s.category in('Laser Hair Removal','ProFacial','Bleaching') and not exists(select 1 from public.service_prices sp where sp.service_id=s.id and sp.is_active)
 union all select 'doctors_without_consultation_price',count(*)::bigint,0 from public.staff st where st.is_active and lower(coalesce(st.role,''))='doctor' and not exists(select 1 from public.services cs join public.service_variants cv on cv.service_id=cs.id and cv.is_active join public.service_variant_prices cp on cp.service_variant_id=cv.id and cp.staff_id=st.id and cp.is_active where cs.code='CONSULTATION' and cs.is_active)
)
select case when value=expected then 'OK' else 'CHECK' end status,check_name,value,expected from checks order by check_name;
