begin;

create or replace function public.notify_staff_customer_event()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  v_new jsonb:=case when tg_op='DELETE' then '{}'::jsonb else to_jsonb(new) end;
  v_old jsonb:=case when tg_op='INSERT' then '{}'::jsonb else to_jsonb(old) end;
  v_clinic_id bigint;
  v_branch_id bigint;
  v_customer_id bigint;
  v_customer_name text;
  v_title text;
  v_message text;
  v_type text:='patient_activity';
  v_href text;
begin
  v_clinic_id:=nullif(v_new->>'clinic_id','')::bigint;
  v_branch_id:=nullif(v_new->>'branch_id','')::bigint;
  v_customer_id:=coalesce(nullif(v_new->>'customer_id','')::bigint,nullif(v_new->>'id','')::bigint);

  if v_clinic_id is null and v_customer_id is not null then
    select clinic_id,branch_id into v_clinic_id,v_branch_id from public.customers where id=v_customer_id;
  end if;
  if v_clinic_id is null then return new; end if;

  if v_customer_id is not null then
    select nullif(trim(concat_ws(' ',first_name,last_name)),'') into v_customer_name from public.customers where id=v_customer_id;
  end if;
  v_customer_name:=coalesce(v_customer_name,'#'||coalesce(v_customer_id::text,'—'));

  if tg_table_name='appointments' then
    v_href:='/appointments';
    if tg_op='INSERT' then
      v_title:='حجز جديد من العميل · New patient booking';
      v_message:=format('وصل حجز جديد من %s ويحتاج للمراجعة. · A new booking from %s needs review.',v_customer_name,v_customer_name);
      v_type:='appointment_created';
    elsif (v_old->>'appointment_at') is distinct from (v_new->>'appointment_at') then
      v_title:='تغيير في موعد · Appointment changed';
      v_message:=format('تم تغيير موعد العميل %s. راجع التاريخ والوقت الجديد. · %s appointment date or time changed.',v_customer_name,v_customer_name);
      v_type:='appointment_rescheduled';
    elsif (v_old->>'status') is distinct from (v_new->>'status') then
      v_title:='تحديث حالة حجز · Booking status updated';
      v_message:=format('حالة حجز %s تغيرت من %s إلى %s. · Booking status changed from %s to %s.',v_customer_name,coalesce(v_old->>'status','—'),coalesce(v_new->>'status','—'),coalesce(v_old->>'status','—'),coalesce(v_new->>'status','—'));
      v_type:='appointment_status';
    elsif (v_old->>'doctor_id') is distinct from (v_new->>'doctor_id') or (v_old->>'service_id') is distinct from (v_new->>'service_id') then
      v_title:='تعديل تفاصيل الحجز · Booking details changed';
      v_message:=format('تم تعديل الطبيب أو الخدمة في حجز %s. · Doctor or service changed for %s.',v_customer_name,v_customer_name);
      v_type:='appointment_updated';
    else
      return new;
    end if;
  elsif tg_table_name='patient_appointment_requests' and tg_op='INSERT' then
    v_href:='/appointments';
    v_title:='طلب جديد من المريض · New patient request';
    v_message:=format('أرسل %s طلب %s ويحتاج لإجراء. · %s submitted a %s request.',v_customer_name,coalesce(v_new->>'request_type','appointment'),v_customer_name,coalesce(v_new->>'request_type','appointment'));
    v_type:='patient_request';
  elsif tg_table_name='patient_messages' and tg_op='INSERT' and v_new->>'sender_type'='patient' then
    v_href:='/ai-agents';
    v_title:='رسالة جديدة من مريض · New patient message';
    v_message:=format('وصلت رسالة جديدة من %s. · New message received from %s.',v_customer_name,v_customer_name);
    v_type:='patient_message';
  elsif tg_table_name='medical_update_requests' and tg_op='INSERT' then
    v_href:='/customers/'||v_customer_id;
    v_title:='طلب تحديث بيانات طبية · Medical update request';
    v_message:=format('أرسل %s طلبًا لتحديث بياناته الطبية. · %s requested a medical profile update.',v_customer_name,v_customer_name);
    v_type:='medical_update_request';
  elsif tg_table_name='customers' and tg_op='INSERT' then
    v_href:='/customers/'||v_customer_id;
    v_title:='عميل جديد · New customer';
    v_message:=format('تم إنشاء ملف جديد للعميل %s. · A new customer profile was created for %s.',v_customer_name,v_customer_name);
    v_type:='customer_created';
  else
    return new;
  end if;

  insert into public.enterprise_notifications(clinic_id,branch_id,title,message,type,href)
  values(v_clinic_id,v_branch_id,v_title,v_message,v_type,v_href);
  return new;
end;
$$;

drop trigger if exists appointments_staff_event_notify on public.appointments;
create trigger appointments_staff_event_notify after insert or update on public.appointments
for each row execute function public.notify_staff_customer_event();

drop trigger if exists patient_requests_staff_event_notify on public.patient_appointment_requests;
create trigger patient_requests_staff_event_notify after insert on public.patient_appointment_requests
for each row execute function public.notify_staff_customer_event();

drop trigger if exists patient_messages_staff_event_notify on public.patient_messages;
create trigger patient_messages_staff_event_notify after insert on public.patient_messages
for each row execute function public.notify_staff_customer_event();

drop trigger if exists customers_staff_event_notify on public.customers;
create trigger customers_staff_event_notify after insert on public.customers
for each row execute function public.notify_staff_customer_event();

do $$
begin
  if to_regclass('public.medical_update_requests') is not null then
    execute 'drop trigger if exists medical_requests_staff_event_notify on public.medical_update_requests';
    execute 'create trigger medical_requests_staff_event_notify after insert on public.medical_update_requests for each row execute function public.notify_staff_customer_event()';
  end if;
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='enterprise_notifications') then
    alter publication supabase_realtime add table public.enterprise_notifications;
  end if;
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='patient_appointment_requests') then
    alter publication supabase_realtime add table public.patient_appointment_requests;
  end if;
end;
$$;

commit;

select 'OK' status,'staff_event_function' check_name,count(*) value,1 expected from pg_proc where proname='notify_staff_customer_event'
union all select case when count(*)=4 then 'OK' else 'CHECK' end,'core_staff_notification_triggers',count(*),4 from pg_trigger where not tgisinternal and tgname in('appointments_staff_event_notify','patient_requests_staff_event_notify','patient_messages_staff_event_notify','customers_staff_event_notify')
union all select case when count(*)=2 then 'OK' else 'CHECK' end,'realtime_staff_tables',count(*),2 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename in('enterprise_notifications','patient_appointment_requests');
