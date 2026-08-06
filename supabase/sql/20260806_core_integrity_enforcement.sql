begin;

alter table public.treatments add column if not exists doctor_id bigint;
alter table public.treatments add column if not exists service_id bigint;
alter table public.treatments add column if not exists service_variant_id bigint;

do $$ begin
 if not exists(select 1 from pg_constraint where conname='treatments_doctor_id_fkey') then
  alter table public.treatments add constraint treatments_doctor_id_fkey foreign key(doctor_id) references public.staff(id) on delete set null;
 end if;
 if not exists(select 1 from pg_constraint where conname='treatments_service_id_fkey') then
  alter table public.treatments add constraint treatments_service_id_fkey foreign key(service_id) references public.services(id) on delete set null;
 end if;
 if not exists(select 1 from pg_constraint where conname='treatments_service_variant_id_fkey') then
  alter table public.treatments add constraint treatments_service_variant_id_fkey foreign key(service_variant_id) references public.service_variants(id) on delete set null;
 end if;
end $$;

update public.treatments t set doctor_id=s.id
from public.staff s where t.doctor_id is null and t.clinic_id=s.clinic_id and lower(trim(t.doctor_name))=lower(trim(s.staff_name));
update public.treatments t set service_variant_id=v.id,service_id=v.service_id
from public.service_variants v join public.services s on s.id=v.service_id
where t.service_variant_id is null and t.clinic_id=s.clinic_id and lower(trim(t.service_name))=lower(trim(v.name));
update public.treatments t set service_id=s.id
from public.services s where t.service_id is null and t.clinic_id=s.clinic_id and lower(trim(t.service_name))=lower(trim(s.name));

create or replace function public.validate_zernio_appointment()
returns trigger language plpgsql security invoker set search_path=public as $$
declare
 v_service public.services%rowtype;
 v_device public.devices%rowtype;
 v_duration integer;
 v_open_hour integer;
 v_local timestamp;
 v_end timestamptz;
begin
 if new.status in('cancelled','no_show') then return new; end if;
 select * into v_service from public.services where id=new.service_id and is_active;
 if not found then raise exception 'Selected service is inactive or missing'; end if;
 if v_service.clinic_id is distinct from new.clinic_id then raise exception 'Service belongs to another clinic'; end if;

 if new.doctor_id is not null then
  if not exists(select 1 from public.staff_services where staff_id=new.doctor_id and service_id=new.service_id and is_active) then raise exception 'Doctor is not linked to this service'; end if;
 else
  if v_service.provider_type is distinct from 'department' then raise exception 'Doctor service requires a doctor'; end if;
 end if;

 if new.device_id is not null then
  select * into v_device from public.devices where id=new.device_id and is_active;
  if not found or v_device.clinic_id is distinct from new.clinic_id then raise exception 'Selected device is invalid'; end if;
  if not exists(select 1 from public.service_devices where service_id=new.service_id and device_id=new.device_id) then raise exception 'Device is not linked to this service'; end if;
  if v_device.room_id is distinct from new.room_id then raise exception 'Appointment room must match the device room'; end if;
  if new.doctor_id is not null and not exists(select 1 from public.staff_devices where staff_id=new.doctor_id and device_id=new.device_id) then raise exception 'Doctor is not allowed to use this device'; end if;
 elsif exists(select 1 from public.service_devices where service_id=new.service_id and is_required) then
  raise exception 'This service requires a device';
 elsif new.doctor_id is not null and not exists(select 1 from public.staff_rooms where staff_id=new.doctor_id and room_id=new.room_id) then
  raise exception 'Room is not assigned to this doctor';
 end if;

 v_duration:=coalesce(v_service.duration_minutes,30);
 v_open_hour:=case when new.doctor_id is null then 10 else 14 end;
 v_local:=new.appointment_at at time zone 'Asia/Riyadh';
 v_end:=new.appointment_at+v_duration*interval '1 minute';
 if extract(dow from v_local)=5 then raise exception 'Clinic is closed on Friday'; end if;
 if extract(hour from v_local) < v_open_hour then
  raise exception 'Appointment is before provider working hours';
 end if;
 if (v_end at time zone 'Asia/Riyadh')::time > time '22:00' then
  raise exception 'Appointment ends after provider working hours';
 end if;

 if exists(
  select 1 from public.appointments a join public.services s on s.id=a.service_id
  where a.id<>coalesce(new.id,0) and a.clinic_id=new.clinic_id and a.branch_id=new.branch_id and a.status not in('cancelled','no_show')
  and new.appointment_at<a.appointment_at+coalesce(s.duration_minutes,30)*interval '1 minute'
  and a.appointment_at<v_end
  and ((new.doctor_id is not null and a.doctor_id=new.doctor_id) or a.room_id=new.room_id or (new.device_id is not null and a.device_id=new.device_id))
 ) then raise exception 'Doctor, room, or device has a conflicting appointment'; end if;
 return new;
end $$;

drop trigger if exists appointments_zernio_integrity on public.appointments;
create trigger appointments_zernio_integrity before insert or update of clinic_id,branch_id,doctor_id,service_id,room_id,device_id,appointment_at,status
on public.appointments for each row execute function public.validate_zernio_appointment();

select 'treatment_doctor_links' check_name,count(*) row_count from public.treatments where doctor_id is not null
union all select 'treatment_service_links',count(*) from public.treatments where service_id is not null
union all select 'treatment_variant_links',count(*) from public.treatments where service_variant_id is not null
union all select 'appointment_integrity_trigger',count(*) from pg_trigger where tgname='appointments_zernio_integrity' and not tgisinternal;

commit;
