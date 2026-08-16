begin;

drop trigger if exists sync_doctor_catalog_after_staff on public.staff;
drop trigger if exists sync_doctor_catalog_after_service on public.services;
drop trigger if exists sync_doctor_catalog_after_variant on public.service_variants;
drop function if exists public.sync_doctor_service_catalog_trigger();
drop function if exists public.sync_clinic_doctor_services(bigint);

commit;
