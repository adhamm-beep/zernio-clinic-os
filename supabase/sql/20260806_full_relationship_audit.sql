with ctx as (
  select c.id clinic_id,b.id branch_id from public.clinics c join public.branches b on b.clinic_id=c.id
  where c.code='PANTHERA' and b.code='MAIN' limit 1
), approved_doctors as (
  select s.id from public.staff s,ctx where s.clinic_id=ctx.clinic_id and s.is_active=true
  and lower(trim(s.staff_name)) in ('dr fatima alsatouf','dr maram','dr fatima khaled')
), operational_rooms as (
  select r.id from public.rooms r,ctx where r.branch_id=ctx.branch_id and r.is_active=true and lower(trim(r.name)) in
  ('clinic 1','clinic 2','clinic 3','clinic 4','clinic 5','clinic 6','laser 1','laser 2','fraxis room','picoway room','profacial room')
), operational_devices as (
  select d.id from public.devices d,ctx where d.clinic_id=ctx.clinic_id and d.is_active=true
  and d.code in ('CLARITY-II-1','CLARITY-II-2','FRAXIS','PICOWAY')
), active_appointments as (
  select a.* from public.appointments a,ctx where a.clinic_id=ctx.clinic_id and a.branch_id=ctx.branch_id
  and a.status not in ('cancelled','no_show')
)
select * from (
  select 'approved_doctors' check_name,(select count(*) from approved_doctors) issue_count,'expected 3' details
  union all select 'operational_rooms',(select count(*) from operational_rooms),'expected 11'
  union all select 'operational_devices',(select count(*) from operational_devices),'expected 4'
  union all select 'doctor_room_links',(select count(*) from public.staff_rooms sr where sr.staff_id in(select id from approved_doctors)),'expected 6'
  union all select 'doctor_working_days',(select count(*) from public.staff_working_hours wh where wh.staff_id in(select id from approved_doctors) and wh.is_working),'expected 18'
  union all select 'doctor_device_links',(select count(*) from public.staff_devices sd where sd.staff_id in(select id from approved_doctors)),'expected 6 (Fraxis + PicoWay only)'
  union all select 'laser_services',(select count(*) from public.services s,ctx where s.clinic_id=ctx.clinic_id and s.is_active and s.category='Laser Hair Removal'),'expected 9'
  union all select 'laser_prices',(select count(*) from public.service_prices sp join public.services s on s.id=sp.service_id,ctx where s.clinic_id=ctx.clinic_id and s.is_active and s.category='Laser Hair Removal' and sp.is_active),'expected 9'
  union all select 'laser_device_links',(select count(*) from public.service_devices sd join public.services s on s.id=sd.service_id join public.devices d on d.id=sd.device_id,ctx where s.clinic_id=ctx.clinic_id and s.is_active and s.category='Laser Hair Removal' and d.code in('CLARITY-II-1','CLARITY-II-2')),'expected 18'
  union all select 'doctor_main_services',(select count(*) from public.services s,ctx where s.clinic_id=ctx.clinic_id and s.is_active and s.code in('CONSULTATION','PICOWAY-LASER','FILLER','LIPS-FILLER','BOTOX','SKIN-BOOSTER','PEELING','POLYLACTIC-ACID','THREADS','HAIR-THERAPY','FRAXIS')),'expected 11'
  union all select 'doctor_service_variants',(select count(*) from public.service_variants sv join public.services s on s.id=sv.service_id,ctx where s.clinic_id=ctx.clinic_id and s.is_active and sv.is_active),'expected 90'
  union all select 'orphan_staff_services',(select count(*) from public.staff_services ss left join public.staff st on st.id=ss.staff_id left join public.services s on s.id=ss.service_id where st.id is null or s.id is null),'expected 0'
  union all select 'orphan_staff_rooms',(select count(*) from public.staff_rooms sr left join public.staff st on st.id=sr.staff_id left join public.rooms r on r.id=sr.room_id where st.id is null or r.id is null),'expected 0'
  union all select 'orphan_staff_devices',(select count(*) from public.staff_devices sd left join public.staff st on st.id=sd.staff_id left join public.devices d on d.id=sd.device_id where st.id is null or d.id is null),'expected 0'
  union all select 'orphan_service_devices',(select count(*) from public.service_devices sd left join public.services s on s.id=sd.service_id left join public.devices d on d.id=sd.device_id where s.id is null or d.id is null),'expected 0'
  union all select 'orphan_prices',(select count(*) from public.service_prices sp left join public.services s on s.id=sp.service_id left join public.staff st on st.id=sp.staff_id where s.id is null or (sp.staff_id is not null and st.id is null)),'expected 0'
  union all select 'orphan_variants',(select count(*) from public.service_variants sv left join public.services s on s.id=sv.service_id where s.id is null),'expected 0'
  union all select 'active_services_without_booking_route',(select count(*) from public.services s,ctx where s.clinic_id=ctx.clinic_id and s.is_active and not exists(select 1 from public.staff_services ss where ss.service_id=s.id and ss.is_active) and not(s.provider_type='department' and s.category in('Laser Hair Removal','Bleaching','ProFacial'))),'must be 0'
  union all select 'doctor_services_without_variants',(select count(*) from public.services s,ctx where s.clinic_id=ctx.clinic_id and s.is_active and s.provider_type='doctor' and not exists(select 1 from public.service_variants sv where sv.service_id=s.id and sv.is_active)),'must be 0'
  union all select 'department_services_without_price',(select count(*) from public.services s,ctx where s.clinic_id=ctx.clinic_id and s.is_active and s.provider_type='department' and not exists(select 1 from public.service_prices sp where sp.service_id=s.id and sp.is_active)),'must be 0'
  union all select 'devices_without_room',(select count(*) from public.devices d where d.id in(select id from operational_devices) and d.room_id is null),'must be 0'
  union all select 'appointments_invalid_doctor',(select count(*) from active_appointments a where a.doctor_id is not null and a.doctor_id not in(select id from approved_doctors)),'must be 0'
  union all select 'appointments_invalid_room',(select count(*) from active_appointments a where a.room_id is null or a.room_id not in(select id from operational_rooms)),'must be 0'
  union all select 'appointments_inactive_service',(select count(*) from active_appointments a left join public.services s on s.id=a.service_id where s.id is null or not s.is_active),'must be 0'
  union all select 'appointments_device_room_mismatch',(select count(*) from active_appointments a join public.devices d on d.id=a.device_id where d.room_id is distinct from a.room_id),'must be 0'
  union all select 'doctor_appointment_room_mismatch',(select count(*) from active_appointments a where a.doctor_id is not null and not exists(select 1 from public.staff_rooms sr where sr.staff_id=a.doctor_id and sr.room_id=a.room_id) and a.device_id is null),'must be 0'
  union all select 'friday_appointments',(select count(*) from active_appointments where extract(dow from appointment_at at time zone 'Asia/Riyadh')=5),'must be 0'
  union all select 'doctor_outside_hours',(select count(*) from active_appointments where doctor_id is not null and (extract(hour from appointment_at at time zone 'Asia/Riyadh')<14 or extract(hour from appointment_at at time zone 'Asia/Riyadh')>=22)),'must be 0'
  union all select 'laser_outside_hours',(select count(*) from active_appointments where doctor_id is null and (extract(hour from appointment_at at time zone 'Asia/Riyadh')<10 or extract(hour from appointment_at at time zone 'Asia/Riyadh')>=22)),'must be 0'
  union all select 'doctor_time_conflicts',(select count(*) from active_appointments a join active_appointments b on a.id<b.id and a.doctor_id=b.doctor_id and a.doctor_id is not null and a.appointment_at<b.appointment_at+coalesce((select duration_minutes from public.services where id=b.service_id),30)*interval '1 minute' and b.appointment_at<a.appointment_at+coalesce((select duration_minutes from public.services where id=a.service_id),30)*interval '1 minute'),'must be 0'
  union all select 'room_time_conflicts',(select count(*) from active_appointments a join active_appointments b on a.id<b.id and a.room_id=b.room_id and a.room_id is not null and a.appointment_at<b.appointment_at+coalesce((select duration_minutes from public.services where id=b.service_id),30)*interval '1 minute' and b.appointment_at<a.appointment_at+coalesce((select duration_minutes from public.services where id=a.service_id),30)*interval '1 minute'),'must be 0'
  union all select 'device_time_conflicts',(select count(*) from active_appointments a join active_appointments b on a.id<b.id and a.device_id=b.device_id and a.device_id is not null and a.appointment_at<b.appointment_at+coalesce((select duration_minutes from public.services where id=b.service_id),30)*interval '1 minute' and b.appointment_at<a.appointment_at+coalesce((select duration_minutes from public.services where id=a.service_id),30)*interval '1 minute'),'must be 0'
) audit order by check_name;

select s.id,s.code,s.name,s.category,s.provider_type
from public.services s join public.clinics c on c.id=s.clinic_id
where c.code='PANTHERA' and s.is_active and not exists(
  select 1 from public.staff_services ss where ss.service_id=s.id and ss.is_active
) and not(s.provider_type='department' and s.category in('Laser Hair Removal','Bleaching','ProFacial'))
order by s.category,s.name;
