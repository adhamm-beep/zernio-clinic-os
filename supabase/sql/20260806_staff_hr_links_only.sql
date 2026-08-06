-- Final Phase 6 links: role permissions + booking schedule synchronization.
begin;
set local lock_timeout = '20s';

insert into public.hr_role_permissions(role_id,permission_id)
select r.id,p.id
from public.hr_roles r
join public.hr_permissions p on
  (r.name='Doctor' and p.code in ('customers.manage','appointments.manage','treatments.manage','inventory.manage')) or
  (r.name='Nurse' and p.code in ('customers.manage','appointments.manage','treatments.manage','inventory.manage')) or
  (r.name='Reception' and p.code in ('customers.manage','appointments.manage')) or
  (r.name='Coordinator' and p.code in ('customers.manage','appointments.manage','reports.view')) or
  (r.name='Finance' and p.code in ('payments.manage','reports.view'))
on conflict do nothing;

insert into public.hr_staff_roles(staff_id,role_id)
select s.id,r.id from public.staff s
join public.hr_roles r on r.clinic_id=s.clinic_id and lower(r.name)=case
  when lower(coalesce(s.role,'')) like '%doctor%' then 'doctor'
  when lower(coalesce(s.role,'')) in ('admin','administrator') then 'admin'
  when lower(coalesce(s.role,'')) like '%nurse%' then 'nurse'
  when lower(coalesce(s.role,'')) like '%reception%' then 'reception'
  when lower(coalesce(s.role,'')) like '%coordinator%' then 'coordinator'
  when lower(coalesce(s.role,'')) like '%finance%' then 'finance'
  else lower(coalesce(s.role,'')) end
on conflict do nothing;

insert into public.hr_shifts(clinic_id,branch_id,staff_id,weekday,start_time,end_time,is_working)
select s.clinic_id,s.branch_id,w.staff_id,w.weekday,w.start_time,w.end_time,w.is_working
from public.staff_working_hours w join public.staff s on s.id=w.staff_id
where s.clinic_id is not null and s.branch_id is not null
on conflict(staff_id,weekday) do update set
  start_time=excluded.start_time,end_time=excluded.end_time,is_working=excluded.is_working;

create or replace function public.sync_hr_shift_to_booking_hours()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.staff_working_hours(staff_id,weekday,start_time,end_time,is_working)
  values(new.staff_id,new.weekday,new.start_time,new.end_time,new.is_working)
  on conflict(staff_id,weekday) do update set
    start_time=excluded.start_time,end_time=excluded.end_time,is_working=excluded.is_working;
  return new;
end $$;

drop trigger if exists hr_shift_booking_sync_trigger on public.hr_shifts;
create trigger hr_shift_booking_sync_trigger
after insert or update on public.hr_shifts
for each row execute function public.sync_hr_shift_to_booking_hours();

commit;

select
  (select count(*) from public.hr_role_permissions) as role_permission_links,
  (select count(*) from public.hr_staff_roles) as staff_role_links,
  (select count(*) from public.hr_shifts) as synchronized_shifts,
  exists(select 1 from pg_trigger where tgname='hr_shift_booking_sync_trigger' and not tgisinternal) as booking_schedule_sync;
