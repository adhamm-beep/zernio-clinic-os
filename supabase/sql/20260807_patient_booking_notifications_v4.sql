begin;

create or replace function public.patient_booking_providers()
returns table(id bigint,name text,role text)
language sql stable security definer set search_path=public as $$
  select q.provider_id,q.provider_name,q.provider_role from (
    select st.id::bigint provider_id,st.staff_name::text provider_name,'doctor'::text provider_role,10 sort_order from public.staff st
    where st.is_active and lower(coalesce(st.role,''))='doctor' and exists(select 1 from public.staff_services ss where ss.staff_id=st.id and ss.is_active)
    union all select -103::bigint,'Bleaching'::text,'service'::text,20 where exists(select 1 from public.services where is_active and provider_type='department' and category='Bleaching')
    union all select -101::bigint,'Laser Hair Removal'::text,'service'::text,30 where exists(select 1 from public.services where is_active and provider_type='department' and category='Laser Hair Removal')
    union all select -102::bigint,'ProFacial'::text,'service'::text,40 where exists(select 1 from public.services where is_active and provider_type='department' and category='ProFacial')
  )q order by q.sort_order,q.provider_name
$$;

create or replace function public.notify_patient_appointment_status()
returns trigger language plpgsql security definer set search_path=public as $$
declare v_title text;v_message text;
begin
  if old.status is not distinct from new.status then return new;end if;
  if lower(coalesce(new.status,'')) in('booked','confirmed') then
    v_title:='Appointment confirmed';v_message:='Your appointment has been confirmed by Panthera Clinics.';
  elsif lower(coalesce(new.status,''))='cancelled' then
    v_title:='Appointment cancelled';v_message:='Your appointment has been cancelled. Please contact Panthera Clinics if you need assistance.';
  elsif lower(coalesce(new.status,''))='completed' then
    v_title:='Visit completed';v_message:='Your visit is complete. Thank you for choosing Panthera Clinics.';
  else return new;end if;
  insert into public.patient_notifications(customer_id,title,message,notification_type)
  select new.customer_id,v_title,v_message,'appointment_status'
  where new.customer_id is not null and not exists(select 1 from public.patient_notifications n where n.customer_id=new.customer_id and n.notification_type='appointment_status' and n.title=v_title and n.created_at>now()-interval '5 minutes');
  return new;
end $$;

drop trigger if exists appointments_notify_patient_status on public.appointments;
create trigger appointments_notify_patient_status after update of status on public.appointments for each row execute function public.notify_patient_appointment_status();

do $$begin
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='patient_notifications') then
    alter publication supabase_realtime add table public.patient_notifications;
  end if;
end $$;

commit;
