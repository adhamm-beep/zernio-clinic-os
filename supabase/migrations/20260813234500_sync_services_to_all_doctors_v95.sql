begin;

create or replace function public.sync_clinic_doctor_services(p_clinic_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.staff_services (staff_id, service_id, is_active, duration_minutes)
  select doctor.id, service.id, true, greatest(coalesce(service.duration_minutes, 30), 1)
  from public.staff doctor
  join public.services service on service.clinic_id = doctor.clinic_id and service.is_active
  where doctor.clinic_id = p_clinic_id
    and doctor.is_active
    and lower(trim(coalesce(doctor.role, ''))) = 'doctor'
  on conflict (staff_id, service_id) do update
  set is_active = true,
      duration_minutes = excluded.duration_minutes;

  insert into public.service_variant_prices (
    clinic_id, branch_id, service_variant_id, staff_id,
    price, is_starting_from, is_active
  )
  select
    doctor.clinic_id,
    coalesce(doctor.branch_id, branch.id),
    variant.id,
    doctor.id,
    variant.price,
    variant.is_starting_from,
    true
  from public.staff doctor
  join public.services service on service.clinic_id = doctor.clinic_id and service.is_active
  join public.service_variants variant on variant.service_id = service.id and variant.is_active
  join lateral (
    select b.id
    from public.branches b
    where b.clinic_id = doctor.clinic_id and b.is_active
    order by (b.id = doctor.branch_id) desc, b.id
    limit 1
  ) branch on true
  where doctor.clinic_id = p_clinic_id
    and doctor.is_active
    and lower(trim(coalesce(doctor.role, ''))) = 'doctor'
  on conflict (service_variant_id, staff_id) do update
  set is_active = true;
end;
$$;

create or replace function public.sync_doctor_service_catalog_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_clinic_id bigint;
begin
  if tg_table_name = 'service_variants' then
    select clinic_id into target_clinic_id from public.services where id = new.service_id;
  else
    target_clinic_id := new.clinic_id;
  end if;
  if target_clinic_id is not null then
    perform public.sync_clinic_doctor_services(target_clinic_id);
  end if;
  return new;
end;
$$;

drop trigger if exists sync_doctor_catalog_after_staff on public.staff;
create trigger sync_doctor_catalog_after_staff
after insert or update of is_active, role, clinic_id, branch_id on public.staff
for each row execute function public.sync_doctor_service_catalog_trigger();

drop trigger if exists sync_doctor_catalog_after_service on public.services;
create trigger sync_doctor_catalog_after_service
after insert or update of is_active, clinic_id, duration_minutes on public.services
for each row execute function public.sync_doctor_service_catalog_trigger();

drop trigger if exists sync_doctor_catalog_after_variant on public.service_variants;
create trigger sync_doctor_catalog_after_variant
after insert or update of is_active, service_id, price, is_starting_from on public.service_variants
for each row execute function public.sync_doctor_service_catalog_trigger();

do $$
declare clinic_row record;
begin
  for clinic_row in select id from public.clinics loop
    perform public.sync_clinic_doctor_services(clinic_row.id);
  end loop;
end;
$$;

grant execute on function public.sync_clinic_doctor_services(bigint) to authenticated;

commit;
