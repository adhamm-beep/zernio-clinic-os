begin;
create or replace function public.assign_customer_file_number()
returns trigger language plpgsql security definer set search_path=public as $$
declare next_code bigint;
begin
  if nullif(trim(coalesce(new.customer_code,'')),'') is not null then return new; end if;
  perform pg_advisory_xact_lock(94117,new.clinic_id::integer);
  select coalesce(max(case when trim(customer_code)~'^[0-9]+$' then trim(customer_code)::bigint end),0)+1
    into next_code from public.customers where clinic_id=new.clinic_id;
  new.customer_code:=next_code::text;
  return new;
end$$;
drop trigger if exists customers_00_assign_file_number on public.customers;
create trigger customers_00_assign_file_number before insert on public.customers for each row execute function public.assign_customer_file_number();
commit;
