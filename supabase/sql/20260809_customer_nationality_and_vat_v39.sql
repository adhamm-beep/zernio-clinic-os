-- Zernio v39: unique customer file numbers and nationality-based VAT.
begin;

alter table public.customers
  add column if not exists nationality text not null default 'saudi';

update public.customers
set nationality='saudi'
where nationality is null or nationality not in ('saudi','non_saudi');

alter table public.customers drop constraint if exists customers_nationality_check;
alter table public.customers
  add constraint customers_nationality_check
  check (nationality in ('saudi','non_saudi'));

create or replace function public.prevent_duplicate_customer_identity()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_phone text := right(regexp_replace(coalesce(new.phone_normalized,new.phone,''),'\D','','g'),9);
  v_national_id text := regexp_replace(coalesce(new.national_id,''),'\s','','g');
  v_customer_code text := trim(coalesce(new.customer_code,''));
begin
  if v_customer_code = '' then
    raise exception using errcode='23514', message='CUSTOMER_CODE_REQUIRED';
  end if;
  if exists(
    select 1 from public.customers c
    where c.id is distinct from new.id
      and lower(trim(coalesce(c.customer_code,'')))=lower(v_customer_code)
  ) then
    raise exception using errcode='23505', message='CUSTOMER_CODE_ALREADY_EXISTS';
  end if;
  if v_phone <> '' and exists(
    select 1 from public.customers c
    where c.id is distinct from new.id
      and right(regexp_replace(coalesce(c.phone_normalized,c.phone,''),'\D','','g'),9)=v_phone
  ) then
    raise exception using errcode='23505', message='CUSTOMER_PHONE_ALREADY_EXISTS';
  end if;
  if v_national_id <> '' and exists(
    select 1 from public.customers c
    where c.id is distinct from new.id
      and regexp_replace(coalesce(c.national_id,''),'\s','','g')=v_national_id
  ) then
    raise exception using errcode='23505', message='CUSTOMER_NATIONAL_ID_ALREADY_EXISTS';
  end if;
  new.customer_code := v_customer_code;
  new.national_id := nullif(v_national_id,'');
  new.nationality := case when new.nationality='non_saudi' then 'non_saudi' else 'saudi' end;
  return new;
end;
$$;

drop trigger if exists customers_prevent_duplicate_identity on public.customers;
create trigger customers_prevent_duplicate_identity
before insert or update of customer_code,phone,phone_normalized,national_id,nationality
on public.customers
for each row execute function public.prevent_duplicate_customer_identity();

create or replace function public.enforce_invoice_vat_15_percent()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_base numeric;
  v_vat_rate numeric := 0;
begin
  if new.subtotal_amount is not null then
    select case when c.nationality='non_saudi' then 0.15 else 0 end
      into v_vat_rate
    from public.customers c
    where c.id=new.customer_id;
    v_vat_rate := coalesce(v_vat_rate,0);
    new.discount_amount := least(greatest(coalesce(new.discount_amount,0),0),greatest(new.subtotal_amount,0));
    v_base := greatest(new.subtotal_amount-new.discount_amount,0);
    new.tax_amount := round(v_base*v_vat_rate,2);
    new.amount := round(v_base+new.tax_amount,2);
    new.paid_amount := least(greatest(coalesce(new.paid_amount,0),0),new.amount);
    if new.payment_status='paid' then new.paid_amount:=new.amount; end if;
    new.balance_due := greatest(new.amount-new.paid_amount,0);
  end if;
  return new;
end;
$$;

drop trigger if exists payments_enforce_invoice_vat_15 on public.payments;
create trigger payments_enforce_invoice_vat_15
before insert or update of customer_id,subtotal_amount,discount_amount,tax_amount,amount,paid_amount,payment_status
on public.payments
for each row execute function public.enforce_invoice_vat_15_percent();

commit;

with checks as (
  select 'customer_nationality_column' check_name,count(*)::bigint value,1::bigint expected
  from information_schema.columns where table_schema='public' and table_name='customers' and column_name='nationality'
  union all
  select 'duplicate_customer_file_numbers',count(*)::bigint,0::bigint
  from (select lower(trim(customer_code)) from public.customers group by lower(trim(customer_code)) having count(*)>1) d
  union all
  select 'customer_identity_trigger',count(*)::bigint,1::bigint
  from pg_trigger where tgname='customers_prevent_duplicate_identity' and not tgisinternal
  union all
  select 'nationality_vat_trigger',count(*)::bigint,1::bigint
  from pg_trigger where tgname='payments_enforce_invoice_vat_15' and not tgisinternal
)
select case when value=expected then 'OK' else 'CHECK' end status,check_name,value,expected
from checks order by check_name;
