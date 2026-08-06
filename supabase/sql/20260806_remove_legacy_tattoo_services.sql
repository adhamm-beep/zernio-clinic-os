begin;

create temporary table legacy_tattoo_service_ids(id bigint primary key) on commit drop;
create temporary table legacy_tattoo_appointment_ids(id bigint primary key) on commit drop;

insert into legacy_tattoo_service_ids
select id from public.services where clinic_id=1 and code in('P00101','P00102');

insert into legacy_tattoo_appointment_ids
select id from public.appointments where service_id in(select id from legacy_tattoo_service_ids);

update public.treatment_sessions set appointment_id=null
where appointment_id in(select id from legacy_tattoo_appointment_ids);
update public.payments set appointment_id=null
where appointment_id in(select id from legacy_tattoo_appointment_ids);
update public.follow_ups set appointment_id=null
where appointment_id in(select id from legacy_tattoo_appointment_ids);
update public.treatment_items set service_id=null
where service_id in(select id from legacy_tattoo_service_ids);

delete from public.appointments where id in(select id from legacy_tattoo_appointment_ids);
delete from public.services where id in(select id from legacy_tattoo_service_ids);

select 'legacy_tattoo_services' check_name,count(*) row_count
from public.services where clinic_id=1 and code in('P00101','P00102')
union all select 'doctor_services_without_variants',count(*)
from public.services s where s.clinic_id=1 and s.is_active and s.provider_type='doctor'
and not exists(select 1 from public.service_variants sv where sv.service_id=s.id and sv.is_active)
union all select 'remaining_active_services',count(*) from public.services where clinic_id=1 and is_active;

commit;
