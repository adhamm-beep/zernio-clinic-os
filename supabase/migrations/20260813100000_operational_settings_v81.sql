begin;

create table if not exists public.clinic_operational_settings (
  clinic_id bigint primary key references public.clinics(id) on delete cascade,
  invoice_header text,
  invoice_footer text,
  tax_number text,
  invoice_show_qr boolean not null default true,
  invoice_show_barcode boolean not null default true,
  invoice_show_tax_number boolean not null default true,
  appointment_confirmation_template text not null default 'تم تأكيد موعدك في {{clinic}} يوم {{date}} الساعة {{time}}.',
  payment_receipt_template text not null default 'تم استلام مبلغ {{amount}} ر.س. رقم الفاتورة {{invoice}}.',
  follow_up_template text not null default 'نذكرك بموعد المتابعة في {{clinic}} يوم {{date}}.',
  whatsapp_enabled boolean not null default false,
  email_enabled boolean not null default true,
  sms_enabled boolean not null default false,
  auto_confirm_appointments boolean not null default false,
  auto_create_follow_up boolean not null default true,
  require_national_id boolean not null default false,
  require_patient_phone boolean not null default true,
  updated_by_staff_id bigint references public.staff(id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.clinic_operational_settings enable row level security;

insert into public.hr_permissions(code,name,module) values
('settings.templates.manage','Manage message templates','Settings'),
('settings.integrations.manage','Manage communication integrations','Settings'),
('settings.processes.manage','Manage operational processes','Settings'),
('settings.print.manage','Manage print and invoice layout','Settings')
on conflict(code) do update set name=excluded.name,module=excluded.module;

insert into public.hr_role_permissions(role_id,permission_id)
select r.id,p.id from public.hr_roles r cross join public.hr_permissions p
where r.name='Admin' and p.code in(
  'settings.templates.manage','settings.integrations.manage',
  'settings.processes.manage','settings.print.manage'
) on conflict do nothing;

drop policy if exists clinic_operational_settings_read on public.clinic_operational_settings;
drop policy if exists clinic_operational_settings_manage on public.clinic_operational_settings;
create policy clinic_operational_settings_read on public.clinic_operational_settings
for select to authenticated using(clinic_id=public.current_clinic_id());
create policy clinic_operational_settings_manage on public.clinic_operational_settings
for all to authenticated
using(clinic_id=public.current_clinic_id() and public.has_any_hr_permission(array[
  'settings.manage','settings.templates.manage','settings.integrations.manage',
  'settings.processes.manage','settings.print.manage'
]))
with check(clinic_id=public.current_clinic_id() and public.has_any_hr_permission(array[
  'settings.manage','settings.templates.manage','settings.integrations.manage',
  'settings.processes.manage','settings.print.manage'
]));

create or replace function public.touch_clinic_operational_settings()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  new.updated_at=now();
  new.updated_by_staff_id=public.current_staff_id();
  return new;
end$$;
drop trigger if exists touch_clinic_operational_settings_trigger on public.clinic_operational_settings;
create trigger touch_clinic_operational_settings_trigger before insert or update
on public.clinic_operational_settings for each row execute function public.touch_clinic_operational_settings();

do $$begin
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='clinic_operational_settings') then
    alter publication supabase_realtime add table public.clinic_operational_settings;
  end if;
end$$;

commit;
