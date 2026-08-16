begin;

create or replace function public.record_invoice_balance_payment(
  p_payment_id bigint,
  p_tenders jsonb,
  p_reference_number text default null,
  p_notes text default null
)
returns public.payments
language plpgsql
security definer
set search_path=public
as $$
declare
  invoice public.payments%rowtype;
  tender jsonb;
  tender_method text;
  tender_amount numeric(14,2);
  received numeric(14,2):=0;
  previous_paid numeric(14,2):=0;
  total_paid numeric(14,2):=0;
  method_count integer:=0;
  final_method text;
begin
  if not public.has_any_hr_permission(array['payments.create','payments.manage']) then
    raise exception 'You do not have permission to collect invoice payments';
  end if;

  select * into invoice
  from public.payments
  where id=p_payment_id and clinic_id=public.current_clinic_id()
  for update;

  if not found then raise exception 'Invoice not found'; end if;
  if lower(coalesce(invoice.payment_status,'')) in ('cancelled','canceled','refunded') then
    raise exception 'This invoice cannot receive payments';
  end if;
  if coalesce(invoice.balance_due,0)<=0 then raise exception 'Invoice is already paid'; end if;
  if jsonb_typeof(p_tenders)<>'array' or jsonb_array_length(p_tenders)=0 then
    raise exception 'Add at least one payment method';
  end if;

  for tender in select value from jsonb_array_elements(p_tenders) loop
    tender_method:=lower(coalesce(tender->>'method',''));
    tender_amount:=round(coalesce(nullif(tender->>'amount','')::numeric,0),2);
    if tender_method not in ('cash','bank_transfer','card','online','tabby','tamara','other') then
      raise exception 'Unsupported payment method';
    end if;
    if tender_amount<=0 then raise exception 'Payment amount must be greater than zero'; end if;
    received:=received+tender_amount;
  end loop;

  if received>coalesce(invoice.balance_due,0) then
    raise exception 'Payment exceeds the remaining invoice balance';
  end if;

  select coalesce(sum(amount),0) into previous_paid
  from public.payment_tenders where payment_id=invoice.id;

  -- Preserve older invoices that stored the first collection only on payments.
  if previous_paid=0 and coalesce(invoice.paid_amount,0)>0 then
    insert into public.payment_tenders(payment_id,clinic_id,method,amount,reference_number)
    values(invoice.id,invoice.clinic_id,
      case when lower(coalesce(invoice.payment_method,'cash')) in ('cash','bank_transfer','card','online','tabby','tamara','other')
        then lower(invoice.payment_method) else 'other' end,
      least(invoice.paid_amount,invoice.amount),invoice.reference_number);
  end if;

  for tender in select value from jsonb_array_elements(p_tenders) loop
    insert into public.payment_tenders(payment_id,clinic_id,method,amount,reference_number)
    values(invoice.id,invoice.clinic_id,lower(tender->>'method'),round((tender->>'amount')::numeric,2),nullif(trim(p_reference_number),''));
  end loop;

  select coalesce(sum(amount),0),count(distinct method),min(method)
  into total_paid,method_count,final_method
  from public.payment_tenders where payment_id=invoice.id;

  update public.payments
  set paid_amount=least(total_paid,amount),
      balance_due=greatest(amount-total_paid,0),
      payment_status=case when total_paid>=amount then 'paid' else 'partial' end,
      payment_method=case when method_count>1 then 'split' else final_method end,
      reference_number=coalesce(nullif(trim(p_reference_number),''),reference_number),
      notes=case when nullif(trim(p_notes),'') is null then notes
        when nullif(trim(notes),'') is null then trim(p_notes)
        else notes||E'\n'||trim(p_notes) end
  where id=invoice.id
  returning * into invoice;

  return invoice;
end
$$;

revoke all on function public.record_invoice_balance_payment(bigint,jsonb,text,text) from public;
grant execute on function public.record_invoice_balance_payment(bigint,jsonb,text,text) to authenticated;

commit;
