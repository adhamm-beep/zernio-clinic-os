begin;

create or replace function public.enqueue_patient_notification(
  p_customer_id bigint,
  p_title text,
  p_message text,
  p_type text,
  p_dedup_minutes integer default 2
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_customer_id is null then return; end if;

  insert into public.patient_notifications(customer_id,title,message,notification_type)
  select p_customer_id,p_title,p_message,p_type
  where not exists (
    select 1 from public.patient_notifications n
    where n.customer_id=p_customer_id
      and n.notification_type=p_type
      and n.title=p_title
      and n.created_at>now()-make_interval(mins=>greatest(p_dedup_minutes,0))
  );
end;
$$;

revoke all on function public.enqueue_patient_notification(bigint,text,text,text,integer) from public;

create or replace function public.notify_patient_appointment_details()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.customer_id is null then return new; end if;

  if old.appointment_at is distinct from new.appointment_at then
    perform public.enqueue_patient_notification(new.customer_id,'Appointment rescheduled','Your appointment date or time was updated. Open My Visits to review the new details.','appointment_update',2);
  elsif old.doctor_id is distinct from new.doctor_id
     or old.service_id is distinct from new.service_id
     or old.room_id is distinct from new.room_id then
    perform public.enqueue_patient_notification(new.customer_id,'Appointment details updated','Your appointment details were updated by Panthera Clinics. Open My Visits to review them.','appointment_update',2);
  end if;
  return new;
end;
$$;

drop trigger if exists appointments_notify_patient_details on public.appointments;
create trigger appointments_notify_patient_details
after update of appointment_at,doctor_id,service_id,room_id on public.appointments
for each row execute function public.notify_patient_appointment_details();

create or replace function public.notify_patient_payment_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.customer_id is null then return new; end if;

  if tg_op='INSERT' then
    perform public.enqueue_patient_notification(new.customer_id,'Payment added','A payment or invoice was added to your Panthera wallet.','payment',2);
  elsif old.payment_status is distinct from new.payment_status
     or old.amount is distinct from new.amount then
    perform public.enqueue_patient_notification(new.customer_id,'Payment updated','Your payment status or amount was updated. Open your wallet for details.','payment',2);
  end if;
  return new;
end;
$$;

drop trigger if exists payments_notify_patient on public.payments;
create trigger payments_notify_patient
after insert or update of payment_status,amount on public.payments
for each row execute function public.notify_patient_payment_change();

create or replace function public.notify_patient_treatment_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.customer_id is null then return new; end if;

  if old.status is distinct from new.status and lower(coalesce(new.status,''))='completed' then
    perform public.enqueue_patient_notification(new.customer_id,'Treatment session completed','Your treatment session and care journey were updated.','treatment',2);
  elsif old.aftercare_instructions is distinct from new.aftercare_instructions
     and nullif(trim(coalesce(new.aftercare_instructions,'')),'') is not null then
    perform public.enqueue_patient_notification(new.customer_id,'New aftercare instructions','Your care team added aftercare instructions. Open My Journey to review them.','aftercare',2);
  elsif old.followup_date is distinct from new.followup_date
     or old.followup_required is distinct from new.followup_required then
    perform public.enqueue_patient_notification(new.customer_id,'Follow-up plan updated','Your follow-up plan was updated. Open My Journey for details.','followup',2);
  end if;
  return new;
end;
$$;

drop trigger if exists treatment_sessions_notify_patient on public.treatment_sessions;
create trigger treatment_sessions_notify_patient
after update of status,aftercare_instructions,followup_required,followup_date on public.treatment_sessions
for each row execute function public.notify_patient_treatment_change();

create or replace function public.notify_patient_medical_request_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status is distinct from new.status then
    perform public.enqueue_patient_notification(new.customer_id,'Medical profile request updated','Your medical profile update request is now '||replace(new.status,'_',' ')||'.','medical_update',2);
  end if;
  return new;
end;
$$;

drop trigger if exists medical_update_request_notify_patient on public.patient_medical_update_requests;
create trigger medical_update_request_notify_patient
after update of status on public.patient_medical_update_requests
for each row execute function public.notify_patient_medical_request_change();

create or replace function public.notify_patient_progress_media()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.enqueue_patient_notification(new.customer_id,'New private result','Your care team added a new item to your private results.','progress_media',2);
  return new;
end;
$$;

drop trigger if exists progress_media_notify_patient on public.patient_progress_media;
create trigger progress_media_notify_patient
after insert on public.patient_progress_media
for each row execute function public.notify_patient_progress_media();

do $$
declare
  v_table text;
  v_tables text[] := array[
    'appointments','customers','follow_ups','medical_records','payments',
    'treatments','treatment_sessions','treatment_items','services',
    'service_variants','service_variant_prices','staff','staff_services',
    'staff_rooms','staff_working_hours','rooms','devices','inventory_products',
    'inventory_movements','marketing_campaigns','marketing_leads',
    'marketing_messages','marketing_source_costs','enterprise_tasks',
    'enterprise_notifications','enterprise_workflow_runs','patient_notifications'
  ];
begin
  foreach v_table in array v_tables loop
    if to_regclass('public.'||v_table) is not null
       and not exists (
         select 1 from pg_publication_tables
         where pubname='supabase_realtime' and schemaname='public' and tablename=v_table
       ) then
      execute format('alter publication supabase_realtime add table public.%I',v_table);
    end if;
  end loop;
end;
$$;

commit;
