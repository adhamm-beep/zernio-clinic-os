-- Zernio v41: repair historical VAT and produce a safe duplicate-customer review.
-- This does not delete or merge any customer record.
begin;
set local lock_timeout='20s';

-- Re-run the protected VAT calculation for every historical invoice.
update public.payments
set subtotal_amount=coalesce(subtotal_amount,0)
where customer_id is not null;

commit;

with normalized_customers as(
 select
  c.*,
  right(regexp_replace(coalesce(c.phone_normalized,c.phone,''),'\D','','g'),9) normalized_phone
 from public.customers c
), duplicate_phones as(
 select normalized_phone
 from normalized_customers
 where normalized_phone<>''
 group by normalized_phone
 having count(*)>1
)
select
 n.normalized_phone,
 n.id customer_id,
 n.customer_code,
 concat_ws(' ',n.first_name,n.last_name) customer_name,
 n.phone,
 n.national_id,
 n.nationality,
 n.created_at,
 (select count(*) from public.appointments a where a.customer_id=n.id) appointment_count,
 (select count(*) from public.payments p where p.customer_id=n.id) invoice_count,
 (select count(*) from public.treatments t where t.customer_id=n.id) treatment_count,
 (select count(*) from public.follow_ups f where f.customer_id=n.id) follow_up_count,
 (select count(*) from public.patient_accounts pa where pa.customer_id=n.id) patient_account_count
from normalized_customers n
join duplicate_phones d using(normalized_phone)
order by n.normalized_phone,n.created_at,n.id;

-- After the duplicate review above, this second result must report zero VAT issues.
select
 case when count(*)=0 then 'OK' else 'CHECK' end status,
 'invoice_vat_mismatch' check_name,
 count(*)::bigint value,
 0::bigint expected
from public.payments p
join public.customers c on c.id=p.customer_id
where abs(coalesce(p.tax_amount,0)-round(
 greatest(coalesce(p.subtotal_amount,0)-coalesce(p.discount_amount,0),0)
 *(case when c.nationality='non_saudi' then .15 else 0 end),2
))>.01;
