begin;
alter table public.customers add column if not exists title text,add column if not exists secondary_phone text,add column if not exists emergency_contact_name text,add column if not exists emergency_contact_phone text,add column if not exists family_members_count integer not null default 0,add column if not exists expected_delivery_date date;
commit;
