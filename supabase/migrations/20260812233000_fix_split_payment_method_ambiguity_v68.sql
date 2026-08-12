begin;

create or replace function public.accounting_payment_post()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  payload jsonb := to_jsonb(new);
  entry_id bigint;
  receipt_account_id bigint;
  receivable_account_id bigint;
  revenue_account_id bigint;
  vat_account_id bigint;
  discount_account_id bigint;
  doctor_staff_id bigint;
  tender_row record;
  allocated numeric := 0;
  payment_method_value text := lower(coalesce(payload->>'payment_method','cash'));
  payment_status_value text := lower(coalesce(payload->>'payment_status','pending'));
  invoice_ref text := coalesce(nullif(payload->>'invoice_number',''),'#'||new.id::text);
  paid numeric := coalesce(nullif(payload->>'paid_amount','')::numeric,nullif(payload->>'amount','')::numeric,0);
  subtotal numeric := coalesce(nullif(payload->>'subtotal_amount','')::numeric,greatest(coalesce(nullif(payload->>'amount','')::numeric,0)-coalesce(nullif(payload->>'tax_amount','')::numeric,0),0));
  tax numeric := coalesce(nullif(payload->>'tax_amount','')::numeric,0);
  discount numeric := coalesce(nullif(payload->>'discount_amount','')::numeric,0);
  total numeric;
  balance numeric;
begin
  select appointment.doctor_id into doctor_staff_id
  from public.appointments appointment
  where appointment.id=new.appointment_id and appointment.clinic_id=new.clinic_id;

  delete from public.accounting_journal_entries journal
  where journal.clinic_id=new.clinic_id and journal.source_type='payment' and journal.source_id=new.id;
  if payment_status_value in ('cancelled','canceled') then return new; end if;

  total := greatest(subtotal-discount+tax,0);
  if total=0 then return new; end if;
  receivable_account_id := public.accounting_account_id(new.clinic_id,'accounts_receivable');
  revenue_account_id := public.accounting_account_id(new.clinic_id,'service_revenue');
  vat_account_id := public.accounting_account_id(new.clinic_id,'vat_payable');
  discount_account_id := public.accounting_account_id(new.clinic_id,'sales_discounts');

  insert into public.accounting_journal_entries(clinic_id,branch_id,entry_number,entry_date,description_en,description_ar,status,source_type,source_id)
  values(new.clinic_id,new.branch_id,'PAY-'||new.id,coalesce(nullif(payload->>'payment_date','')::timestamptz::date,current_date),'Patient invoice '||invoice_ref,'فاتورة مريض '||invoice_ref,'draft','payment',new.id)
  returning id into entry_id;

  for tender_row in
    select tender.method as tender_method,tender.amount as tender_amount
    from public.payment_tenders tender
    where tender.payment_id=new.id
  loop
    receipt_account_id := public.accounting_account_id(new.clinic_id,case when tender_row.tender_method='cash' then 'cash' when tender_row.tender_method='bank_transfer' then 'bank' else 'gateway_clearing' end);
    insert into public.accounting_journal_lines(entry_id,clinic_id,account_id,customer_id,staff_id,debit,credit,memo_en,memo_ar)
    values(entry_id,new.clinic_id,receipt_account_id,new.customer_id,doctor_staff_id,tender_row.tender_amount,0,tender_row.tender_method,tender_row.tender_method);
    allocated := allocated+tender_row.tender_amount;
  end loop;

  if allocated=0 and paid>0 then
    receipt_account_id := public.accounting_account_id(new.clinic_id,case when payment_method_value='cash' then 'cash' when payment_method_value in ('bank','bank_transfer','transfer') then 'bank' else 'gateway_clearing' end);
    insert into public.accounting_journal_lines(entry_id,clinic_id,account_id,customer_id,staff_id,debit,credit)
    values(entry_id,new.clinic_id,receipt_account_id,new.customer_id,doctor_staff_id,least(paid,total),0);
    allocated := least(paid,total);
  end if;

  balance := greatest(total-allocated,0);
  if balance>0 then insert into public.accounting_journal_lines(entry_id,clinic_id,account_id,customer_id,staff_id,debit,credit) values(entry_id,new.clinic_id,receivable_account_id,new.customer_id,doctor_staff_id,balance,0); end if;
  if discount>0 then insert into public.accounting_journal_lines(entry_id,clinic_id,account_id,customer_id,staff_id,debit,credit) values(entry_id,new.clinic_id,discount_account_id,new.customer_id,doctor_staff_id,discount,0); end if;
  if subtotal>0 then insert into public.accounting_journal_lines(entry_id,clinic_id,account_id,customer_id,staff_id,debit,credit) values(entry_id,new.clinic_id,revenue_account_id,new.customer_id,doctor_staff_id,0,subtotal); end if;
  if tax>0 then insert into public.accounting_journal_lines(entry_id,clinic_id,account_id,customer_id,staff_id,debit,credit) values(entry_id,new.clinic_id,vat_account_id,new.customer_id,doctor_staff_id,0,tax); end if;
  update public.accounting_journal_entries journal set status='posted',posted_at=now() where journal.id=entry_id;
  return new;
end
$$;

commit;
