begin;

create or replace function public.patient_mark_messages_read()
returns bigint
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_customer_id bigint := public.current_patient_customer_id();
  v_updated bigint := 0;
begin
  if v_customer_id is null then
    raise exception 'PATIENT_PROFILE_REQUIRED';
  end if;

  update public.patient_messages
  set is_read = true
  where customer_id = v_customer_id
    and sender_type in ('staff', 'system')
    and coalesce(is_read, false) = false;

  get diagnostics v_updated = row_count;
  return v_updated;
end;
$$;

revoke all on function public.patient_mark_messages_read() from public;
grant execute on function public.patient_mark_messages_read() to authenticated;

commit;
