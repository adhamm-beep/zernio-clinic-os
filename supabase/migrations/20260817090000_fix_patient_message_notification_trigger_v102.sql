begin;

create or replace function public.notify_patient_concierge_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_table_name = 'patient_appointment_requests' then
    if tg_op = 'UPDATE' and old.status is distinct from new.status then
      perform public.enqueue_patient_notification(
        new.customer_id,
        'Appointment request updated',
        'Your request is now ' || new.status || '.',
        'appointment_request',
        1
      );
    end if;
  elsif tg_table_name = 'patient_messages' then
    if tg_op = 'INSERT' and new.sender_type = 'staff' then
      perform public.enqueue_patient_notification(
        new.customer_id,
        'New message from Panthera',
        'Your care team sent you a new message.',
        'message',
        1
      );
    end if;
  end if;

  return new;
end;
$$;

commit;
