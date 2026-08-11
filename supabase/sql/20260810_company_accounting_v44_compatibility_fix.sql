begin;

-- Compatibility repair for databases where the employee settlement table
-- already existed before the full accounting migration was introduced.
alter table if exists public.employee_financial_settlements
  add column if not exists clinic_id bigint references public.clinics(id) on delete restrict,
  add column if not exists transaction_id bigint references public.employee_financial_transactions(id) on delete cascade,
  add column if not exists settlement_date date not null default current_date,
  add column if not exists amount numeric(14,2) not null default 0,
  add column if not exists settlement_method text not null default 'cash',
  add column if not exists notes_en text,
  add column if not exists notes_ar text,
  add column if not exists journal_entry_id bigint,
  add column if not exists created_at timestamptz not null default now();

update public.employee_financial_settlements s
set clinic_id=t.clinic_id
from public.employee_financial_transactions t
where s.transaction_id=t.id and s.clinic_id is null;

alter table if exists public.employee_financial_transactions
  add column if not exists settled_amount numeric(14,2) not null default 0,
  add column if not exists outstanding_amount numeric(14,2) not null default 0,
  add column if not exists funding_method text not null default 'cash',
  add column if not exists journal_entry_id bigint,
  add column if not exists updated_at timestamptz not null default now();

commit;
