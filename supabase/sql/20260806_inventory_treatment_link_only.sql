-- Run after the main Phase 5 inventory file. Safe to retry.
begin;
set local lock_timeout = '20s';

-- Lock in a stable order so concurrent app reads cannot create a DDL deadlock.
lock table public.inventory_products in access exclusive mode;
lock table public.treatment_items in share row exclusive mode;

alter table public.inventory_products
  add column if not exists service_variant_id bigint
  references public.service_variants(id) on delete set null;

create unique index if not exists inventory_product_variant_unique
  on public.inventory_products(clinic_id, branch_id, service_variant_id)
  where service_variant_id is not null;

create or replace function public.consume_inventory_from_treatment_item()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.treatment_sessions%rowtype;
  v_product_id bigint;
begin
  select * into v_session
  from public.treatment_sessions
  where id = new.session_id;

  if new.product_id is not null then
    select id into v_product_id
    from public.inventory_products
    where id = new.product_id
      and clinic_id = v_session.clinic_id
      and branch_id = v_session.branch_id
      and is_active;
  end if;

  if v_product_id is null and new.service_variant_id is not null then
    select id into v_product_id
    from public.inventory_products
    where clinic_id = v_session.clinic_id
      and branch_id = v_session.branch_id
      and service_variant_id = new.service_variant_id
      and is_active
    limit 1;
  end if;

  if v_product_id is not null then
    insert into public.inventory_movements(
      clinic_id, branch_id, product_id, movement_type, quantity,
      doctor_id, service_id, treatment_session_id, notes
    ) values (
      v_session.clinic_id, v_session.branch_id, v_product_id, 'consumption',
      coalesce(nullif(new.quantity, 0), 1), v_session.doctor_id,
      new.service_id, new.session_id, 'Automatic treatment consumption'
    );
  end if;

  return new;
end;
$$;

drop trigger if exists treatment_item_inventory_trigger
  on public.treatment_items;

create trigger treatment_item_inventory_trigger
after insert on public.treatment_items
for each row execute function public.consume_inventory_from_treatment_item();

commit;

select
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'inventory_products'
      and column_name = 'service_variant_id'
  ) as material_link_ready,
  exists (
    select 1 from pg_trigger
    where tgname = 'treatment_item_inventory_trigger'
      and not tgisinternal
  ) as automatic_consumption_ready;
