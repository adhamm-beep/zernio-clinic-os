begin;
insert into public.hr_permissions(code,name,module) values
('dashboard.appointments_count.view','View dashboard appointment count','Dashboard'),('dashboard.completed_patients_count.view','View dashboard completed patient count','Dashboard'),('dashboard.invoice_count.view','View dashboard invoice count','Dashboard'),('dashboard.collections_total.view','View dashboard collected total','Dashboard'),
('dashboard.invoiced_total.view','View dashboard invoiced total','Dashboard'),('dashboard.paid_total.view','View dashboard paid total','Dashboard'),('dashboard.remaining_total.view','View dashboard remaining total','Dashboard'),
('payments.invoice_count.view','View payment invoice count','Finance'),('payments.total.view','View invoice total','Finance'),('payments.paid_total.view','View paid total','Finance'),('payments.remaining_total.view','View remaining total','Finance')
on conflict(code) do update set name=excluded.name,module=excluded.module;
insert into public.hr_role_permissions(role_id,permission_id) select r.id,p.id from public.hr_roles r cross join public.hr_permissions p where lower(r.name)='admin' and p.code in('dashboard.appointments_count.view','dashboard.completed_patients_count.view','dashboard.invoice_count.view','dashboard.collections_total.view','dashboard.invoiced_total.view','dashboard.paid_total.view','dashboard.remaining_total.view','payments.invoice_count.view','payments.total.view','payments.paid_total.view','payments.remaining_total.view') on conflict do nothing;
alter table public.hr_staff_permission_overrides add column if not exists updated_by bigint references public.staff(id) on delete set null;
create or replace function public.stamp_permission_override_actor() returns trigger language plpgsql security definer set search_path=public as $$begin new.updated_at=clock_timestamp();new.updated_by=public.current_staff_id();return new;end$$;
drop trigger if exists stamp_permission_override_actor_trigger on public.hr_staff_permission_overrides;create trigger stamp_permission_override_actor_trigger before insert or update on public.hr_staff_permission_overrides for each row execute function public.stamp_permission_override_actor();
create or replace function public.current_staff_header() returns table(id bigint,staff_name text,email text) language sql stable security definer set search_path=public as $$select s.id,s.staff_name,s.email from public.staff s where s.id=public.current_staff_id()$$;
grant execute on function public.current_staff_header() to authenticated;
commit;
