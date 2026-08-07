begin;

create or replace function public.patient_booking_providers()
returns table(id bigint,name text,role text)
language sql stable security definer set search_path=public as $$
  select q.provider_id,q.provider_name,q.provider_role from (
    select st.id::bigint provider_id,st.staff_name::text provider_name,'doctor'::text provider_role from public.staff st
    where st.is_active and lower(coalesce(st.role,''))='doctor'
      and exists(select 1 from public.staff_services ss where ss.staff_id=st.id and ss.is_active)
    union all select -101::bigint,'Laser Department'::text,'department'::text where exists(select 1 from public.services where is_active and provider_type='department' and category='Laser Hair Removal')
    union all select -102::bigint,'ProFacial Department'::text,'department'::text where exists(select 1 from public.services where is_active and provider_type='department' and category='ProFacial')
    union all select -103::bigint,'Bleaching Department'::text,'department'::text where exists(select 1 from public.services where is_active and provider_type='department' and category='Bleaching')
  )q order by q.provider_role desc,q.provider_name
$$;

create or replace function public.patient_provider_services(p_provider_id bigint)
returns table(id bigint,name text,category text,duration_minutes integer,provider_type text,price_from numeric,is_starting_from boolean)
language sql stable security definer set search_path=public as $$
  select s.id,s.name,s.category,s.duration_minutes,s.provider_type,
    case when p_provider_id>0 then (select min(cp.price) from public.services cs join public.service_variants cv on cv.service_id=cs.id and cv.is_active join public.service_variant_prices cp on cp.service_variant_id=cv.id and cp.staff_id=p_provider_id and cp.is_active where cs.code='CONSULTATION' and cs.is_active)
         else (select min(sp.price) from public.service_prices sp where sp.service_id=s.id and sp.is_active) end,
    false
  from public.services s
  where s.is_active and (
    (p_provider_id>0 and s.code<>'CONSULTATION' and exists(select 1 from public.staff_services ss where ss.staff_id=p_provider_id and ss.service_id=s.id and ss.is_active))
    or (p_provider_id=-101 and s.provider_type='department' and s.category='Laser Hair Removal')
    or (p_provider_id=-102 and s.provider_type='department' and s.category='ProFacial')
    or (p_provider_id=-103 and s.provider_type='department' and s.category='Bleaching')
  ) order by s.category,s.name
$$;

create or replace function public.patient_book_appointment(p_service_id bigint,p_appointment_at timestamptz,p_notes text default null,p_doctor_id bigint default null)
returns bigint language plpgsql security definer set search_path=public as $$
declare c public.customers%rowtype;v_room_id bigint;v_device_id bigint;v_real_doctor_id bigint;v_id bigint;v_duration integer;v_category text;
begin
  select * into c from public.customers where id=public.current_patient_customer_id();if c.id is null then raise exception 'Patient account is not linked';end if;
  if p_doctor_id is null then raise exception 'Please select a provider';end if;if p_appointment_at<=now() then raise exception 'Appointment must be in the future';end if;
  select duration_minutes,category into v_duration,v_category from public.services where id=p_service_id and is_active;if v_duration is null then raise exception 'Service is not available';end if;
  if p_doctor_id>0 then
    if not exists(select 1 from public.staff_services ss join public.staff st on st.id=ss.staff_id where ss.staff_id=p_doctor_id and ss.service_id=p_service_id and ss.is_active and st.is_active) then raise exception 'The selected doctor does not provide this service';end if;
    v_real_doctor_id:=p_doctor_id;
    select sr.room_id into v_room_id from public.staff_rooms sr where sr.staff_id=p_doctor_id and not exists(select 1 from public.appointments a join public.services s on s.id=a.service_id where a.room_id=sr.room_id and coalesce(a.status,'') not in('cancelled','no_show') and p_appointment_at<a.appointment_at+s.duration_minutes*interval '1 minute' and a.appointment_at<p_appointment_at+v_duration*interval '1 minute') order by sr.room_id limit 1;
  else
    if not ((p_doctor_id=-101 and v_category='Laser Hair Removal') or (p_doctor_id=-102 and v_category='ProFacial') or (p_doctor_id=-103 and v_category='Bleaching')) then raise exception 'Service does not belong to the selected department';end if;
    select sd.device_id,d.room_id into v_device_id,v_room_id from public.service_devices sd join public.devices d on d.id=sd.device_id and d.is_active where sd.service_id=p_service_id and not exists(select 1 from public.appointments a join public.services s on s.id=a.service_id where a.device_id=d.id and coalesce(a.status,'') not in('cancelled','no_show') and p_appointment_at<a.appointment_at+s.duration_minutes*interval '1 minute' and a.appointment_at<p_appointment_at+v_duration*interval '1 minute') order by d.id limit 1;
    if v_room_id is null and p_doctor_id=-102 then select r.id into v_room_id from public.rooms r where r.branch_id=c.branch_id and r.is_active and lower(r.name) like 'profacial%' and not exists(select 1 from public.appointments a join public.services s on s.id=a.service_id where a.room_id=r.id and coalesce(a.status,'') not in('cancelled','no_show') and p_appointment_at<a.appointment_at+s.duration_minutes*interval '1 minute' and a.appointment_at<p_appointment_at+v_duration*interval '1 minute') limit 1;end if;
  end if;
  if v_room_id is null then raise exception 'No room or device is available at this time';end if;
  insert into public.appointments(customer_id,clinic_id,branch_id,service_id,doctor_id,device_id,room_id,appointment_at,status,notes,source,created_from_channel) values(c.id,c.clinic_id,c.branch_id,p_service_id,v_real_doctor_id,v_device_id,v_room_id,p_appointment_at,'requested',p_notes,'patient_app','mobile') returning id into v_id;
  insert into public.patient_notifications(customer_id,title,message,notification_type) values(c.id,'Appointment requested','Your appointment request was sent to Panthera Clinics.','appointment');return v_id;
end $$;

create or replace function public.patient_select_payment_method(p_appointment_id bigint,p_payment_method text,p_quoted_amount numeric default null)
returns bigint language plpgsql security definer set search_path=public as $$
declare v_customer_id bigint:=public.current_patient_customer_id();v_id bigint;v_amount numeric;
begin
  if p_payment_method not in('pay_at_clinic','online') then raise exception 'Invalid payment method';end if;
  select case when a.doctor_id is not null then (select min(cp.price) from public.services cs join public.service_variants cv on cv.service_id=cs.id and cv.is_active join public.service_variant_prices cp on cp.service_variant_id=cv.id and cp.staff_id=a.doctor_id and cp.is_active where cs.code='CONSULTATION' and cs.is_active) else (select min(sp.price) from public.service_prices sp where sp.service_id=a.service_id and sp.is_active) end into v_amount from public.appointments a where a.id=p_appointment_id and a.customer_id=v_customer_id;
  if v_amount is null then raise exception 'Booking price is not configured';end if;
  insert into public.patient_appointment_payments(appointment_id,customer_id,payment_method,payment_status,quoted_amount) values(p_appointment_id,v_customer_id,p_payment_method,case when p_payment_method='online' then 'processing' else 'pending' end,v_amount) on conflict(appointment_id) do update set payment_method=excluded.payment_method,payment_status=excluded.payment_status,quoted_amount=excluded.quoted_amount,updated_at=now() returning id into v_id;return v_id;
end $$;

commit;
