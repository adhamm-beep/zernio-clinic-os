begin;

create or replace function public.advance_overdue_appointment_statuses()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  late_count integer := 0;
  no_show_count integer := 0;
begin
  update public.appointments
  set status = 'no_show'
  where status in ('booked', 'confirmed', 'late')
    and appointment_at <= now() - interval '15 minutes'
    and appointment_at >= now() - interval '2 days';
  get diagnostics no_show_count = row_count;

  update public.appointments
  set status = 'late'
  where status in ('booked', 'confirmed')
    and appointment_at <= now()
    and appointment_at > now() - interval '15 minutes';
  get diagnostics late_count = row_count;

  return jsonb_build_object('late', late_count, 'no_show', no_show_count);
end;
$$;

revoke all on function public.advance_overdue_appointment_statuses() from public, anon, authenticated;
grant execute on function public.advance_overdue_appointment_statuses() to service_role;

do $$
declare existing_job record;
begin
  for existing_job in
    select jobid from cron.job where jobname = 'panthera-overdue-appointments'
  loop
    perform cron.unschedule(existing_job.jobid);
  end loop;
  perform cron.schedule(
    'panthera-overdue-appointments',
    '* * * * *',
    'select public.advance_overdue_appointment_statuses();'
  );
end;
$$;

commit;
