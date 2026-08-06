begin;

create temporary table legacy_staff_ids(id bigint primary key) on commit drop;
create temporary table legacy_room_ids(id bigint primary key) on commit drop;
create temporary table legacy_service_ids(id bigint primary key) on commit drop;
create temporary table legacy_appointment_ids(id bigint primary key) on commit drop;

insert into legacy_staff_ids
select id from public.staff
where clinic_id=1 and lower(trim(staff_name))='dr fatima';

insert into legacy_room_ids
select r.id from public.rooms r join public.branches b on b.id=r.branch_id
where b.clinic_id=1 and lower(trim(r.name)) in ('room 1','room 2','laser room');

insert into legacy_service_ids
select id from public.services
where clinic_id=1 and (code is null or is_active=false);

insert into legacy_appointment_ids
select id from public.appointments
where clinic_id=1 and (
  doctor_id in(select id from legacy_staff_ids)
  or room_id in(select id from legacy_room_ids)
  or service_id in(select id from legacy_service_ids)
);

update public.treatment_sessions set appointment_id=null
where appointment_id in(select id from legacy_appointment_ids);
update public.payments set appointment_id=null
where appointment_id in(select id from legacy_appointment_ids);
update public.follow_ups set appointment_id=null
where appointment_id in(select id from legacy_appointment_ids);

delete from public.appointments where id in(select id from legacy_appointment_ids);

update public.treatment_sessions set doctor_id=null
where doctor_id in(select id from legacy_staff_ids);
update public.treatment_sessions set completed_by=null
where completed_by in(select id from legacy_staff_ids);

update public.treatment_items set service_id=null
where service_id in(select id from legacy_service_ids);

delete from public.staff where id in(select id from legacy_staff_ids);
delete from public.rooms where id in(select id from legacy_room_ids);
delete from public.services where id in(select id from legacy_service_ids);

select 'remaining_approved_doctors' check_name,count(*) row_count from public.staff
where clinic_id=1 and lower(trim(staff_name)) in ('dr fatima alsatouf','dr maram','dr fatima khaled')
union all select 'remaining_operational_rooms',count(*) from public.rooms r join public.branches b on b.id=r.branch_id
where b.clinic_id=1 and lower(trim(r.name)) in
('clinic 1','clinic 2','clinic 3','clinic 4','clinic 5','clinic 6','laser 1','laser 2','fraxis room','picoway room')
union all select 'remaining_active_services',count(*) from public.services where clinic_id=1 and is_active=true
union all select 'legacy_staff',count(*) from public.staff where clinic_id=1 and lower(trim(staff_name))='dr fatima'
union all select 'legacy_rooms',count(*) from public.rooms r join public.branches b on b.id=r.branch_id
where b.clinic_id=1 and lower(trim(r.name)) in ('room 1','room 2','laser room')
union all select 'legacy_services',count(*) from public.services where clinic_id=1 and (code is null or is_active=false);

commit;
