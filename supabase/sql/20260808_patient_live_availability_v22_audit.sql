with checks(check_name,value,expected) as (
  select 'patient_available_slots_function',count(*)::bigint,1::bigint
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='patient_available_slots'
  union all
  select 'friday_working_rows',count(*)::bigint,0::bigint
  from public.staff_working_hours where weekday=5 and is_working
  union all
  select 'active_doctors_without_schedule',count(*)::bigint,0::bigint
  from public.staff st where st.is_active and lower(coalesce(st.role,''))='doctor'
    and not exists(select 1 from public.staff_working_hours wh where wh.staff_id=st.id and wh.is_working)
)
select case when value=expected then 'OK' else 'CHECK' end status,check_name,value,expected
from checks order by check_name;
