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
  v_staff_id bigint;
begin
  v_staff_id := public.current_staff_id();
  v_clinic_id := public.current_clinic_id();

  if v_staff_id is null or v_clinic_id is null then
    raise exception 'Staff access required';
  end if;

  if not public.has_any_hr_permission(array[
    'appointments.status.update',
    'appointments.manage'
  ]) then
    raise exception 'Appointment status permission required';
  end if;

  p_status := lower(trim(coalesce(p_status, '')));
  if p_status not in (
    'booked', 'confirmed', 'arrived', 'in_progress', 'completed',
    'late', 'cancelled', 'no_show', 'waitlist', 'note'
  ) then
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
