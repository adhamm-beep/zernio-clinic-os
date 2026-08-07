with checks as (
  select 'patient_payment_table' check_name,count(*)::bigint value,1::bigint expected from information_schema.tables where table_schema='public' and table_name='patient_appointment_payments'
  union all select 'booking_v2_functions',count(distinct p.proname)::bigint,4 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in('patient_booking_providers','patient_provider_services','patient_book_appointment','patient_select_payment_method')
  union all select 'approved_booking_doctors',count(distinct st.id)::bigint,3 from public.staff st join public.staff_services ss on ss.staff_id=st.id and ss.is_active where st.is_active and lower(coalesce(st.role,''))='doctor'
  union all select 'doctors_without_services',count(*)::bigint,0 from public.staff st where st.is_active and lower(coalesce(st.role,''))='doctor' and not exists(select 1 from public.staff_services ss where ss.staff_id=st.id and ss.is_active)
  union all select 'doctor_services_without_price',count(*)::bigint,0 from public.staff_services ss join public.staff st on st.id=ss.staff_id and st.is_active and lower(coalesce(st.role,''))='doctor' where ss.is_active and not exists(select 1 from public.service_variants sv join public.service_variant_prices svp on svp.service_variant_id=sv.id and svp.staff_id=st.id and svp.is_active where sv.service_id=ss.service_id and sv.is_active)
)
select case when value=expected then 'OK' else 'CHECK' end status,check_name,value,expected from checks order by check_name;
