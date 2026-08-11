begin;
create or replace function public.patient_booking_providers_localized(p_locale text default 'en') returns table(id bigint,name text,role text) language sql stable security definer set search_path=public as $$
select q.provider_id,q.provider_name,q.provider_role from(
 select st.id::bigint,st.staff_name::text,'doctor'::text from public.staff st where st.is_active and lower(coalesce(st.role,''))='doctor' and exists(select 1 from public.staff_services ss where ss.staff_id=st.id and ss.is_active)
 union all select -101,case when p_locale='ar' then 'إزالة الشعر بالليزر' else 'Laser Hair Removal' end,'department' where exists(select 1 from public.services where is_active and provider_type='department' and category='Laser Hair Removal')
 union all select -102,case when p_locale='ar' then 'البروفاشيال' else 'ProFacial' end,'department' where exists(select 1 from public.services where is_active and provider_type='department' and category='ProFacial')
 union all select -103,case when p_locale='ar' then 'التشقير' else 'Bleaching' end,'department' where exists(select 1 from public.services where is_active and provider_type='department' and category='Bleaching')
)q(provider_id,provider_name,provider_role) order by q.provider_role desc,q.provider_name$$;
create or replace function public.patient_provider_services_localized(p_provider_id bigint,p_locale text default 'en') returns table(id bigint,name text,category text,duration_minutes integer,provider_type text,price_from numeric,is_starting_from boolean) language sql stable security definer set search_path=public as $$
select s.id,case when p_locale='ar' then s.name_ar else s.name_en end,case when p_locale='ar' then coalesce(s.category_ar,s.category) else coalesce(s.category_en,s.category) end,s.duration_minutes,s.provider_type,
 case when p_provider_id>0 then(select min(cp.price) from public.services cs join public.service_variants cv on cv.service_id=cs.id and cv.is_active join public.service_variant_prices cp on cp.service_variant_id=cv.id and cp.staff_id=p_provider_id and cp.is_active where cs.code='CONSULTATION' and cs.is_active)else(select min(sp.price) from public.service_prices sp where sp.service_id=s.id and sp.is_active)end,false
from public.services s where s.is_active and((p_provider_id>0 and s.code<>'CONSULTATION' and exists(select 1 from public.staff_services ss where ss.staff_id=p_provider_id and ss.service_id=s.id and ss.is_active))or(p_provider_id=-101 and s.provider_type='department' and s.category='Laser Hair Removal')or(p_provider_id=-102 and s.provider_type='department' and s.category='ProFacial')or(p_provider_id=-103 and s.provider_type='department' and s.category='Bleaching'))order by 3,2$$;
revoke all on function public.patient_booking_providers_localized(text) from public;
revoke all on function public.patient_provider_services_localized(bigint,text) from public;
grant execute on function public.patient_booking_providers_localized(text) to authenticated;
grant execute on function public.patient_provider_services_localized(bigint,text) to authenticated;
commit;
