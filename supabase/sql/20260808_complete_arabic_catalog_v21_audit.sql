with checks(check_name,value,expected) as (
  select 'active_services_missing_arabic',count(*)::bigint,0::bigint
  from public.services where is_active and (name_ar is null or trim(name_ar)='' or name_ar !~ '[ء-ي]')
  union all
  select 'active_service_categories_missing_arabic',count(*)::bigint,0::bigint
  from public.services where is_active and category is not null and (category_ar is null or trim(category_ar)='' or category_ar !~ '[ء-ي]')
  union all
  select 'active_materials_missing_arabic',count(*)::bigint,0::bigint
  from public.service_variants where is_active and (name_ar is null or trim(name_ar)='' or name_ar !~ '[ء-ي]')
)
select case when value=expected then 'OK' else 'CHECK' end status,check_name,value,expected
from checks order by check_name;
