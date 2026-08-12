-- Per-user access control and complete page permissions. Safe to run repeatedly.
begin;

insert into public.hr_permissions(code,name,module) values
('dashboard.view','View dashboard','Dashboard'),('customers.view','View customers','Customers'),
('customers.manage','Manage customers','Customers'),('appointments.view','View appointments','Appointments'),
('appointments.manage','Manage appointments','Appointments'),('calendar.view','View calendar','Appointments'),
('followups.view','View follow-ups','Follow-ups'),('followups.manage','Manage follow-ups','Follow-ups'),
('treatments.view','View treatments','Treatments'),('treatments.manage','Manage treatments','Treatments'),
('payments.view','View payments','Finance'),('payments.manage','Manage payments','Finance'),
('services.view','View services and prices','Services'),('services.manage','Manage services and prices','Services'),
('inventory.view','View inventory','Inventory'),('inventory.manage','Manage inventory','Inventory'),
('staff.view','View team and HR','Staff'),('staff.manage','Manage team and HR','Staff'),
('marketing.view','View marketing','Marketing'),('marketing.manage','Manage marketing','Marketing'),
('reports.view','View reports','Reports'),('ai.view','View Zernio intelligence','Intelligence'),
('ai.use','Use Zernio intelligence','Intelligence'),('enterprise.view','View enterprise workspace','Enterprise'),
('enterprise.manage','Manage enterprise workflows','Enterprise'),('settings.view','View settings','Settings'),
('settings.manage','Manage clinic settings','Settings'),('users.manage','Manage users and permissions','Settings')
on conflict(code) do update set name=excluded.name,module=excluded.module;

create table if not exists public.hr_staff_permission_overrides(
 staff_id bigint not null references public.staff(id) on delete cascade,
 permission_id bigint not null references public.hr_permissions(id) on delete cascade,
 granted boolean not null,updated_at timestamptz not null default now(),primary key(staff_id,permission_id));
alter table public.hr_staff_permission_overrides enable row level security;

create or replace function public.has_hr_permission(permission_code text) returns boolean
language sql stable security definer set search_path=public as $$
 with identity as(select public.current_staff_id() staff_id),direct as(
  select o.granted from identity i join hr_staff_permission_overrides o on o.staff_id=i.staff_id
  join hr_permissions p on p.id=o.permission_id where p.code=permission_code)
 select coalesce((select granted from direct limit 1),exists(
  select 1 from identity i join hr_staff_roles sr on sr.staff_id=i.staff_id
  join hr_role_permissions rp on rp.role_id=sr.role_id join hr_permissions p on p.id=rp.permission_id
  where p.code=permission_code),false)$$;

create or replace function public.current_staff_permissions() returns table(code text)
language sql stable security definer set search_path=public as $$
 select p.code from hr_permissions p where public.has_hr_permission(p.code)$$;
grant execute on function public.has_hr_permission(text) to authenticated;
grant execute on function public.current_staff_permissions() to authenticated;

drop policy if exists hr_staff_permission_overrides_read on public.hr_staff_permission_overrides;
create policy hr_staff_permission_overrides_read on public.hr_staff_permission_overrides for select to authenticated
using(staff_id=public.current_staff_id() or public.has_hr_permission('users.manage'));
drop policy if exists hr_staff_permission_overrides_manage on public.hr_staff_permission_overrides;
create policy hr_staff_permission_overrides_manage on public.hr_staff_permission_overrides for all to authenticated
using(public.has_hr_permission('users.manage')) with check(public.has_hr_permission('users.manage') and exists(
 select 1 from staff s where s.id=staff_id and s.clinic_id=public.current_clinic_id()));

insert into hr_role_permissions(role_id,permission_id) select r.id,p.id from hr_roles r cross join hr_permissions p
where lower(r.name)='admin' on conflict do nothing;
insert into hr_role_permissions(role_id,permission_id) select r.id,p.id from hr_roles r join hr_permissions p on
 (lower(r.name)='doctor' and p.code in('dashboard.view','customers.view','appointments.view','calendar.view','treatments.view','treatments.manage','services.view')) or
 (lower(r.name)='nurse' and p.code in('dashboard.view','customers.view','appointments.view','calendar.view','treatments.view','inventory.view')) or
 (lower(r.name) in('reception','coordinator') and p.code in('dashboard.view','customers.view','customers.manage','appointments.view','appointments.manage','calendar.view','followups.view','followups.manage','services.view')) or
 (lower(r.name)='finance' and p.code in('dashboard.view','customers.view','payments.view','payments.manage','reports.view'))
on conflict do nothing;
commit;
