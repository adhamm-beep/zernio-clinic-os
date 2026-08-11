-- Patient booking availability from the same doctor, room and device rules used by staff booking.
begin;

create or replace function public.patient_available_slots(
  p_provider_id bigint,
  p_service_id bigint,
  p_date date
) returns table(appointment_at timestamptz, label text)
language plpgsql stable security definer set search_path=public as $$
declare
  v_customer_id bigint:=public.current_patient_customer_id();
  v_duration integer;
  v_category text;
  v_start time;
  v_end time;
begin
  if v_customer_id is null then raise exception 'Patient account is not linked'; end if;
  if p_date is null or p_date<current_date then return; end if;
  if extract(dow from p_date)::integer=5 then return; end if;
  select s.duration_minutes,s.category into v_duration,v_category
  from public.services s where s.id=p_service_id and s.is_active;
  if v_duration is null then return; end if;

  if p_provider_id>0 then
    if not exists(select 1 from public.staff_services ss join public.staff st on st.id=ss.staff_id
      where ss.staff_id=p_provider_id and ss.service_id=p_service_id and ss.is_active and st.is_active) then return; end if;
    select wh.start_time,wh.end_time into v_start,v_end from public.staff_working_hours wh
    where wh.staff_id=p_provider_id and wh.is_working and wh.weekday=extract(dow from p_date)::integer limit 1;
  else
    if not ((p_provider_id=-101 and v_category='Laser Hair Removal')
      or (p_provider_id=-102 and v_category='ProFacial')
      or (p_provider_id=-103 and v_category='Bleaching')) then return; end if;
    v_start:=time '10:00';v_end:=time '22:00';
  end if;
  if v_start is null or v_end is null then return; end if;

  return query
  with candidates as (
    select gs slot_local,(gs at time zone 'Asia/Riyadh') slot_at
    from generate_series(p_date+v_start,p_date+v_end-v_duration*interval '1 minute',interval '30 minutes') gs
  )
  select c.slot_at,to_char(c.slot_local,'FMHH12:MI AM')
  from candidates c
  where c.slot_at>now()+interval '15 minutes'
    and (
      (p_provider_id>0
        and not exists(select 1 from public.appointments a join public.services s on s.id=a.service_id
          where a.doctor_id=p_provider_id and coalesce(a.status,'') not in('cancelled','no_show')
          and c.slot_at<a.appointment_at+s.duration_minutes*interval '1 minute'
          and a.appointment_at<c.slot_at+v_duration*interval '1 minute')
        and exists(select 1 from public.staff_rooms sr where sr.staff_id=p_provider_id
          and not exists(select 1 from public.appointments a join public.services s on s.id=a.service_id
            where a.room_id=sr.room_id and coalesce(a.status,'') not in('cancelled','no_show')
            and c.slot_at<a.appointment_at+s.duration_minutes*interval '1 minute'
            and a.appointment_at<c.slot_at+v_duration*interval '1 minute')))
      or
      (p_provider_id in(-101,-103)
        and exists(select 1 from public.service_devices sd join public.devices d on d.id=sd.device_id and d.is_active
          where sd.service_id=p_service_id
          and not exists(select 1 from public.appointments a join public.services s on s.id=a.service_id
            where (a.device_id=d.id or a.room_id=d.room_id) and coalesce(a.status,'') not in('cancelled','no_show')
            and c.slot_at<a.appointment_at+s.duration_minutes*interval '1 minute'
            and a.appointment_at<c.slot_at+v_duration*interval '1 minute')))
      or
      (p_provider_id=-102
        and exists(select 1 from public.rooms r where r.is_active and lower(r.name) like 'profacial%'
          and not exists(select 1 from public.appointments a join public.services s on s.id=a.service_id
            where a.room_id=r.id and coalesce(a.status,'') not in('cancelled','no_show')
            and c.slot_at<a.appointment_at+s.duration_minutes*interval '1 minute'
            and a.appointment_at<c.slot_at+v_duration*interval '1 minute')))
    )
  order by c.slot_at;
end$$;

revoke all on function public.patient_available_slots(bigint,bigint,date) from public;
grant execute on function public.patient_available_slots(bigint,bigint,date) to authenticated;

commit;

