begin;

create or replace function public.staff_update_appointment_status(
  p_appointment_id bigint,
  p_status text
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_appointment_id bigint;
  v_clinic_id bigint;
begin
  v_clinic_id := public.current_clinic_id();

  if public.current_staff_id() is null or v_clinic_id is null then
    raise exception 'Staff access required';
  end if;

  if p_status not in ('booked', 'confirmed', 'arrived', 'completed', 'cancelled', 'no_show') then
    raise exception 'Unsupported appointment status: %', p_status;
  end if;

  update public.appointments
     set status = p_status
   where id = p_appointment_id
     and clinic_id = v_clinic_id
  returning id into v_appointment_id;

  if v_appointment_id is null then
    raise exception 'Appointment not found in your clinic';
  end if;

  return v_appointment_id;
end;
$$;

revoke all on function public.staff_update_appointment_status(bigint, text) from public;
grant execute on function public.staff_update_appointment_status(bigint, text) to authenticated;

commit;

select
  case when count(*) = 1 then 'OK' else 'CHECK' end as status,
  'staff_status_function' as check_name,
  count(*) as value,
  1 as expected
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'staff_update_appointment_status';
