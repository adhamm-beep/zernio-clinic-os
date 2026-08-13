begin;
alter table public.clinic_operational_settings add column if not exists tax_number text;
commit;
