begin;

create temporary table zernio_legacy_treatment_target on commit drop as
select id
from public.treatments
where lower(trim(service_name))='laser'
  and lower(trim(coalesce(doctor_name,'')))='laser'
  and status='planned'
  and price=1550
  and discount=300;

do $$
declare v_count integer;
begin
 select count(*) into v_count from zernio_legacy_treatment_target;
 if v_count<>1 then
  raise exception 'Safety stop: expected exactly 1 legacy laser treatment, found %',v_count;
 end if;
end $$;

with deleted_followups as (
 delete from public.follow_ups f
 using zernio_legacy_treatment_target t
 where f.treatment_id=t.id
 returning f.id
), deleted_payments as (
 delete from public.payments p
 using zernio_legacy_treatment_target t
 where p.treatment_id=t.id
 returning p.id
), deleted_treatments as (
 delete from public.treatments tr
 using zernio_legacy_treatment_target t
 where tr.id=t.id
 returning tr.id
)
select
 (select count(*) from deleted_treatments) deleted_treatments,
 (select count(*) from deleted_payments) deleted_payments,
 (select count(*) from deleted_followups) deleted_followups;

commit;
