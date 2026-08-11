with checks(check_name,value,expected) as (
  select 'services_missing_english',count(*)::bigint,0::bigint from public.services where name_en is null or trim(name_en)=''
  union all select 'services_missing_arabic',count(*),0 from public.services where name_ar is null or trim(name_ar)=''
  union all select 'variants_missing_english',count(*),0 from public.service_variants where name_en is null or trim(name_en)=''
  union all select 'variants_missing_arabic',count(*),0 from public.service_variants where name_ar is null or trim(name_ar)=''
  union all select 'bilingual_catalog_triggers',count(*),2 from pg_trigger where tgname in('services_bilingual_fields','service_variants_bilingual_fields') and not tgisinternal
)
select case when value=expected then 'OK' else 'CHECK' end status,check_name,value,expected from checks order by check_name;
