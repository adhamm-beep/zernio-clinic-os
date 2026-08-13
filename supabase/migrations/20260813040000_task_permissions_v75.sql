begin;
insert into public.hr_permissions(code,name,module) values
('tasks.view','View assigned tasks','Tasks'),
('tasks.create','Create and assign tasks','Tasks'),
('tasks.manage','Manage all clinic tasks','Tasks')
on conflict(code) do update set name=excluded.name,module=excluded.module;
insert into public.hr_role_permissions(role_id,permission_id)
select r.id,p.id from public.hr_roles r cross join public.hr_permissions p
where r.name='Admin' and p.code in('tasks.view','tasks.create','tasks.manage') on conflict do nothing;
drop policy if exists enterprise_tasks_access on public.enterprise_tasks;
drop policy if exists enterprise_tasks_read on public.enterprise_tasks;
drop policy if exists enterprise_tasks_create on public.enterprise_tasks;
drop policy if exists enterprise_tasks_update on public.enterprise_tasks;
create policy enterprise_tasks_read on public.enterprise_tasks for select to authenticated
using(clinic_id=public.current_clinic_id() and (assigned_to=public.current_staff_id() or created_by=public.current_staff_id() or public.has_any_hr_permission(array['tasks.view','tasks.manage'])));
create policy enterprise_tasks_create on public.enterprise_tasks for insert to authenticated
with check(clinic_id=public.current_clinic_id() and created_by=public.current_staff_id() and public.has_any_hr_permission(array['tasks.create','tasks.manage']));
create policy enterprise_tasks_update on public.enterprise_tasks for update to authenticated
using(clinic_id=public.current_clinic_id() and (assigned_to=public.current_staff_id() or public.has_hr_permission('tasks.manage')))
with check(clinic_id=public.current_clinic_id() and (assigned_to=public.current_staff_id() or public.has_hr_permission('tasks.manage')));
commit;
