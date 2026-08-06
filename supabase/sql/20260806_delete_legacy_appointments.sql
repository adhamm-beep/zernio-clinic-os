begin;

create temporary table legacy_appointment_ids (
  id bigint primary key
) on commit drop;

insert into legacy_appointment_ids (id)
select distinct a.id
from public.appointments a
left join public.staff st on st.id = a.doctor_id
left join public.rooms r on r.id = a.room_id
left join public.services s on s.id = a.service_id
where a.clinic_id = 1
  and a.branch_id = 2
  and (
    lower(trim(coalesce(st.staff_name, ''))) in ('adham', 'dr fatima')
    or lower(trim(coalesce(r.name, ''))) in ('room 1', 'room 2', 'laser room')
    or coalesce(s.is_active, false) = false
  );

update public.treatment_sessions
set appointment_id = null
where appointment_id in (select id from legacy_appointment_ids);

update public.payments
set appointment_id = null
where appointment_id in (select id from legacy_appointment_ids);

update public.follow_ups
set appointment_id = null
where appointment_id in (select id from legacy_appointment_ids);

with deleted as (
  delete from public.appointments
  where id in (select id from legacy_appointment_ids)
  returning id
)
select 'deleted_legacy_appointments' check_name, count(*) row_count
from deleted;

commit;
