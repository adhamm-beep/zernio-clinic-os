begin;
insert into public.hr_permissions(code,name,module) values ('customers.archive','Archive patients','Patients'),('customers.restore','Restore archived patients','Patients') on conflict(code) do update set name=excluded.name,module=excluded.module;
insert into public.hr_role_permissions(role_id,permission_id) select r.id,p.id from public.hr_roles r cross join public.hr_permissions p where lower(r.name)='admin' and p.code in('customers.archive','customers.restore') on conflict do nothing;
commit;
