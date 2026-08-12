-- Granular access control and patient mobile presence analytics.
begin;

insert into public.hr_permissions(code,name,module) values
('dashboard.finance.view','View dashboard income','Dashboard'),
('customers.details.view','View full patient profile','Patients'),('customers.create','Create patient','Patients'),('customers.edit','Edit patient','Patients'),('customers.deactivate','Deactivate patient','Patients'),('customers.export','Export patients','Patients'),
('patient_app.analytics','View patient app analytics','Patient app'),('patient_app.identity.view','View active patient identity','Patient app'),
('appointments.create','Create appointments','Appointments'),('appointments.edit','Edit appointments','Appointments'),('appointments.cancel','Cancel appointments','Appointments'),('appointments.patient_requests.manage','Manage patient app requests','Appointments'),
('treatments.create','Start treatments','Treatments'),('treatments.edit','Edit treatments','Treatments'),('treatments.complete','Complete treatments','Treatments'),
('medical.view','View medical records','Medical record'),('medical.edit','Edit medical records','Medical record'),
('payments.amounts.view','View amounts and collections','Finance'),('payments.create','Record payments','Finance'),('payments.refund','Refund payments','Finance'),('payments.invoice.print','Print invoices','Finance'),
('reports.finance.view','View financial reports','Reports'),('reports.doctor_revenue.view','View doctor revenue','Reports'),('reports.export','Export reports','Reports'),
('inventory.cost.view','View inventory cost','Inventory'),('staff.salary.view','View salaries','Staff'),('staff.attendance.manage','Manage attendance','Staff'),('staff.schedule.manage','Manage schedules','Staff'),
('marketing.spend.view','View marketing spend and ROI','Marketing'),('audit.view','View audit log','Enterprise')
on conflict(code) do update set name=excluded.name,module=excluded.module;

-- Preserve existing role behavior while allowing every item to be overridden per user.
insert into public.hr_role_permissions(role_id,permission_id)
select r.id,p.id from public.hr_roles r cross join public.hr_permissions p where lower(r.name)='admin'
on conflict do nothing;
insert into public.hr_role_permissions(role_id,permission_id)
select r.id,p.id from public.hr_roles r join public.hr_permissions p on
 (lower(r.name)='doctor' and p.code in('customers.details.view','medical.view','medical.edit','appointments.create','appointments.edit','treatments.create','treatments.edit','treatments.complete')) or
 (lower(r.name)='nurse' and p.code in('customers.details.view','medical.view','appointments.create','appointments.edit','treatments.create','treatments.edit')) or
 (lower(r.name) in('reception','coordinator') and p.code in('customers.details.view','customers.create','customers.edit','appointments.create','appointments.edit','appointments.cancel','appointments.patient_requests.manage')) or
 (lower(r.name)='finance' and p.code in('payments.amounts.view','payments.create','payments.invoice.print','reports.finance.view','reports.doctor_revenue.view'))
on conflict do nothing;

create table if not exists public.patient_app_presence(
 id bigint generated always as identity primary key,
 customer_id bigint not null references public.customers(id) on delete cascade,
 clinic_id bigint not null references public.clinics(id) on delete cascade,
 branch_id bigint references public.branches(id) on delete set null,
 device_id text not null,
 session_key text not null,
 platform text,
 app_version text,
 app_state text not null default 'active' check(app_state in('active','background','inactive')),
 first_seen_at timestamptz not null default now(),
 last_opened_at timestamptz not null default now(),
 last_seen_at timestamptz not null default now(),
 last_closed_at timestamptz,
 total_opens integer not null default 1,
 unique(customer_id,device_id)
);
create index if not exists patient_app_presence_clinic_active_idx on public.patient_app_presence(clinic_id,last_seen_at desc);
alter table public.patient_app_presence enable row level security;

create table if not exists public.patient_app_sessions(
 id bigint generated always as identity primary key,
 customer_id bigint not null references public.customers(id) on delete cascade,
 clinic_id bigint not null references public.clinics(id) on delete cascade,
 branch_id bigint references public.branches(id) on delete set null,
 device_id text not null,
 session_key text not null unique,
 platform text,
 app_version text,
 opened_at timestamptz not null default now(),
 last_seen_at timestamptz not null default now(),
 closed_at timestamptz
);
create index if not exists patient_app_sessions_clinic_opened_idx on public.patient_app_sessions(clinic_id,opened_at desc);
alter table public.patient_app_sessions enable row level security;

create or replace function public.patient_app_heartbeat(p_device_id text,p_session_key text,p_state text default 'active',p_platform text default null,p_app_version text default null)
returns void language plpgsql security definer set search_path=public as $$
declare v_customer_id bigint:=public.current_patient_customer_id();v_clinic_id bigint;v_branch_id bigint;v_existing_session text;
begin
 if v_customer_id is null then raise exception 'Patient account required';end if;
 if nullif(trim(p_device_id),'') is null or nullif(trim(p_session_key),'') is null then raise exception 'Device and session are required';end if;
 select clinic_id,branch_id into v_clinic_id,v_branch_id from customers where id=v_customer_id;
 insert into patient_app_sessions(customer_id,clinic_id,branch_id,device_id,session_key,platform,app_version,opened_at,last_seen_at,closed_at)
 values(v_customer_id,v_clinic_id,v_branch_id,left(p_device_id,120),left(p_session_key,160),left(p_platform,30),left(p_app_version,30),now(),now(),case when p_state='active' then null else now() end)
 on conflict(session_key) do update set last_seen_at=now(),closed_at=case when p_state='active' then null else now() end;
 select session_key into v_existing_session from patient_app_presence where customer_id=v_customer_id and device_id=left(p_device_id,120);
 insert into patient_app_presence(customer_id,clinic_id,branch_id,device_id,session_key,platform,app_version,app_state,first_seen_at,last_opened_at,last_seen_at,last_closed_at,total_opens)
 values(v_customer_id,v_clinic_id,v_branch_id,left(p_device_id,120),left(p_session_key,160),left(p_platform,30),left(p_app_version,30),case when p_state in('active','background','inactive') then p_state else 'inactive' end,now(),now(),now(),case when p_state='active' then null else now() end,1)
 on conflict(customer_id,device_id) do update set session_key=excluded.session_key,platform=excluded.platform,app_version=excluded.app_version,app_state=excluded.app_state,last_seen_at=now(),last_closed_at=excluded.last_closed_at,last_opened_at=case when patient_app_presence.session_key<>excluded.session_key then now() else patient_app_presence.last_opened_at end,total_opens=patient_app_presence.total_opens+case when patient_app_presence.session_key<>excluded.session_key then 1 else 0 end;
 update patient_accounts set last_seen_at=now() where customer_id=v_customer_id;
end$$;
revoke all on function public.patient_app_heartbeat(text,text,text,text,text) from public;
grant execute on function public.patient_app_heartbeat(text,text,text,text,text) to authenticated;

drop policy if exists patient_app_presence_staff_read on public.patient_app_presence;
create policy patient_app_presence_staff_read on public.patient_app_presence for select to authenticated
using(clinic_id=public.current_clinic_id() and public.has_hr_permission('patient_app.analytics'));
drop policy if exists patient_app_sessions_staff_read on public.patient_app_sessions;
create policy patient_app_sessions_staff_read on public.patient_app_sessions for select to authenticated
using(clinic_id=public.current_clinic_id() and public.has_hr_permission('patient_app.analytics'));

commit;
