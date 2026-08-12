begin;

create or replace function public.accounting_payment_post()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  j jsonb:=to_jsonb(new);
  eid bigint;
  cash_id bigint;
  ar_id bigint;
  revenue_id bigint;
  vat_id bigint;
  discount_id bigint;
  doctor_id bigint;
  invoice_ref text:=coalesce(nullif(j->>'invoice_number',''),'#'||new.id::text);
  paid numeric:=coalesce(nullif(j->>'paid_amount','')::numeric,nullif(j->>'amount','')::numeric,0);
  subtotal numeric:=coalesce(nullif(j->>'subtotal_amount','')::numeric,greatest(coalesce(nullif(j->>'amount','')::numeric,0)-coalesce(nullif(j->>'tax_amount','')::numeric,0),0));
  tax numeric:=coalesce(nullif(j->>'tax_amount','')::numeric,0);
  discount numeric:=coalesce(nullif(j->>'discount_amount','')::numeric,0);
  total numeric;
  balance numeric;
begin
  select a.doctor_id into doctor_id
  from public.appointments a
  where a.id=new.appointment_id and a.clinic_id=new.clinic_id;

  total:=greatest(subtotal-discount+tax,0);
  balance:=greatest(total-paid,0);
  delete from public.accounting_journal_entries where clinic_id=new.clinic_id and source_type='payment' and source_id=new.id;
  if total=0 then return new; end if;

  cash_id:=public.accounting_account_id(new.clinic_id,case when lower(coalesce(j->>'payment_method','cash')) in('cash','نقدا','نقداً') then 'cash' else 'bank' end);
  ar_id:=public.accounting_account_id(new.clinic_id,'accounts_receivable');
  revenue_id:=public.accounting_account_id(new.clinic_id,'service_revenue');
  vat_id:=public.accounting_account_id(new.clinic_id,'vat_payable');
  discount_id:=public.accounting_account_id(new.clinic_id,'sales_discounts');

  insert into public.accounting_journal_entries(clinic_id,branch_id,entry_number,entry_date,description_en,description_ar,status,source_type,source_id)
  values(new.clinic_id,new.branch_id,'PAY-'||new.id,coalesce(nullif(j->>'payment_date','')::timestamptz::date,current_date),'Patient invoice '||invoice_ref,'فاتورة مريض '||invoice_ref,'draft','payment',new.id)
  returning id into eid;

  if paid>0 then insert into public.accounting_journal_lines(entry_id,clinic_id,account_id,customer_id,staff_id,debit,credit) values(eid,new.clinic_id,cash_id,new.customer_id,doctor_id,least(paid,total),0); end if;
  if balance>0 then insert into public.accounting_journal_lines(entry_id,clinic_id,account_id,customer_id,staff_id,debit,credit) values(eid,new.clinic_id,ar_id,new.customer_id,doctor_id,balance,0); end if;
  if discount>0 then insert into public.accounting_journal_lines(entry_id,clinic_id,account_id,customer_id,staff_id,debit,credit) values(eid,new.clinic_id,discount_id,new.customer_id,doctor_id,discount,0); end if;
  if subtotal>0 then insert into public.accounting_journal_lines(entry_id,clinic_id,account_id,customer_id,staff_id,debit,credit) values(eid,new.clinic_id,revenue_id,new.customer_id,doctor_id,0,subtotal); end if;
  if tax>0 then insert into public.accounting_journal_lines(entry_id,clinic_id,account_id,customer_id,staff_id,debit,credit) values(eid,new.clinic_id,vat_id,new.customer_id,doctor_id,0,tax); end if;
  update public.accounting_journal_entries set status='posted',posted_at=now() where id=eid;
  return new;
end
$$;

update public.accounting_journal_lines l
set staff_id=a.doctor_id,
    customer_id=p.customer_id
from public.accounting_journal_entries e
join public.payments p on p.id=e.source_id
join public.appointments a on a.id=p.appointment_id and a.clinic_id=p.clinic_id
where l.entry_id=e.id
  and e.source_type='payment'
  and (l.staff_id is distinct from a.doctor_id or l.customer_id is distinct from p.customer_id);

commit;
