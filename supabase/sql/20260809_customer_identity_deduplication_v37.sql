-- Zernio v37: patient identity and duplicate prevention.
alter table public.customers add column if not exists national_id text;

create or replace function public.prevent_duplicate_customer_identity()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_phone text := right(regexp_replace(coalesce(new.phone_normalized,new.phone,''),'\D','','g'),9);
  v_national_id text := regexp_replace(coalesce(new.national_id,''),'\s','','g');
begin
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
  new.national_id := nullif(v_national_id,'');
  return new;
end;
$$;

drop trigger if exists customers_prevent_duplicate_identity on public.customers;
create trigger customers_prevent_duplicate_identity
before insert or update of phone,phone_normalized,national_id on public.customers
for each row execute function public.prevent_duplicate_customer_identity();

select 'customer_identity_deduplication_ready' as status;
