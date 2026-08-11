begin;

alter table public.payments add column if not exists service_id bigint references public.services(id) on delete set null;
alter table public.payments add column if not exists service_variant_id bigint references public.service_variants(id) on delete set null;
alter table public.payments add column if not exists material_quantity numeric(12,3);
alter table public.payments add column if not exists material_unit text;
alter table public.payments add column if not exists material_unit_price numeric(12,2);
alter table public.payments add column if not exists material_line_total numeric(12,2);

create or replace function public.price_payment_material()
returns trigger language plpgsql security definer set search_path=public as $$
declare
  v_service_id bigint;v_doctor_id bigint;v_variant_service_id bigint;
  v_variant_name text;v_list_price numeric;v_package_ml numeric:=1;v_match text[];
begin
  if new.appointment_id is null then return new;end if;
  select a.service_id,a.doctor_id into v_service_id,v_doctor_id from appointments a
  where a.id=new.appointment_id and a.customer_id=new.customer_id and a.clinic_id=new.clinic_id and a.branch_id=new.branch_id;
  if v_service_id is null then raise exception 'Appointment does not belong to this customer and clinic';end if;
  if new.service_variant_id is null then
    select coalesce(sp_doctor.price,sp_general.price,s.default_price) into v_list_price
    from services s
    left join service_prices sp_doctor on sp_doctor.service_id=s.id and sp_doctor.staff_id=v_doctor_id
    left join service_prices sp_general on sp_general.service_id=s.id and sp_general.staff_id is null
    where s.id=v_service_id and s.is_active;
    if v_list_price is null or v_list_price<=0 then raise exception 'Appointment service has no active price';end if;
    new.service_id:=v_service_id;new.material_quantity:=null;new.material_unit:=null;
    new.material_unit_price:=null;new.material_line_total:=round(v_list_price,2);new.amount:=round(v_list_price,2);
    return new;
  end if;
  select sv.service_id,sv.name,coalesce(svp.price,sv.price) into v_variant_service_id,v_variant_name,v_list_price
  from service_variants sv left join service_variant_prices svp on svp.service_variant_id=sv.id and svp.staff_id=v_doctor_id and svp.is_active
  where sv.id=new.service_variant_id and sv.is_active;
  if v_variant_service_id is null or v_variant_service_id<>v_service_id then raise exception 'Selected material is not linked to the appointment service';end if;
  if v_list_price is null or v_list_price<=0 then raise exception 'Selected material has no active price';end if;
  if coalesce(new.material_quantity,0)<=0 then raise exception 'Material quantity must be greater than zero';end if;
  v_match:=regexp_match(v_variant_name,'^\s*([0-9]+(?:\.[0-9]+)?)\s*ML(\s|$)','i');
  if v_match is not null then v_package_ml:=v_match[1]::numeric;end if;
  new.service_id:=v_service_id;new.material_unit:='ml';new.material_unit_price:=round(v_list_price/v_package_ml,2);
  new.material_line_total:=round(new.material_quantity*new.material_unit_price,2);new.amount:=new.material_line_total;
  return new;
end;$$;

drop trigger if exists payments_price_material on public.payments;
create trigger payments_price_material before insert or update
on public.payments for each row execute function public.price_payment_material();
commit;

with checks(check_name,value,expected) as(
 select 'payment_material_columns',count(*)::bigint,6::bigint from information_schema.columns where table_schema='public' and table_name='payments' and column_name in('service_id','service_variant_id','material_quantity','material_unit','material_unit_price','material_line_total')
 union all select 'payment_material_pricing_trigger',count(*)::bigint,1::bigint from pg_trigger where tgname='payments_price_material' and not tgisinternal
)
select case when value=expected then 'OK' else 'CHECK' end status,check_name,value,expected from checks order by check_name;
