-- Zernio v43: resolve imported shared/placeholder phones without merging different patients.
-- Original values are retained in legacy_phone for staff review and correction.
begin;
set local lock_timeout='20s';

alter table public.customers add column if not exists legacy_phone text;

-- Placeholder numbers are not valid patient contact numbers.
update public.customers
set legacy_phone=coalesce(legacy_phone,phone),phone=null,phone_normalized=null
where right(regexp_replace(coalesce(phone_normalized,phone,''),'\D','','g'),9)='000000000';

-- Keep a shared real number on the record with the strongest operational identity.
-- Preserve it archivally on every other imported record instead of deleting patients.
with ranked as(
 select c.id,
  row_number() over(
   partition by right(regexp_replace(coalesce(c.phone_normalized,c.phone,''),'\D','','g'),9)
   order by
    (select count(*) from public.patient_accounts pa where pa.customer_id=c.id) desc,
    ((select count(*) from public.appointments a where a.customer_id=c.id)
     +(select count(*) from public.payments p where p.customer_id=c.id)
     +(select count(*) from public.treatments t where t.customer_id=c.id)
     +(select count(*) from public.follow_ups f where f.customer_id=c.id)) desc,
    c.created_at desc,c.id desc
  ) rn,
  count(*) over(partition by right(regexp_replace(coalesce(c.phone_normalized,c.phone,''),'\D','','g'),9)) duplicate_count
 from public.customers c
 where right(regexp_replace(coalesce(c.phone_normalized,c.phone,''),'\D','','g'),9)<>''
)
update public.customers c
set legacy_phone=coalesce(c.legacy_phone,c.phone),phone=null,phone_normalized=null
from ranked r
where r.id=c.id and r.duplicate_count>1 and r.rn>1;

commit;

with checks as(
 select 'duplicate_customer_phones' check_name,count(*)::bigint value,0::bigint expected
 from(
  select right(regexp_replace(coalesce(phone_normalized,phone,''),'\D','','g'),9)
  from public.customers
  where right(regexp_replace(coalesce(phone_normalized,phone,''),'\D','','g'),9)<>''
  group by 1 having count(*)>1
 )d
 union all
 select 'placeholder_customer_phones',count(*)::bigint,0::bigint
 from public.customers
 where right(regexp_replace(coalesce(phone_normalized,phone,''),'\D','','g'),9)='000000000'
 union all
 select 'archived_legacy_phones',count(*)::bigint,count(*)::bigint
 from public.customers where nullif(trim(legacy_phone),'') is not null
)
select case when value=expected then 'OK' else 'CHECK' end status,check_name,value,expected
from checks order by check_name;
