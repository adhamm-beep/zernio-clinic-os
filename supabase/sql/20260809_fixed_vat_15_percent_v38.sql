-- Zernio v38: invoices always use Saudi VAT at 15% after discount.
create or replace function public.enforce_invoice_vat_15_percent()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_base numeric;
begin
  if new.subtotal_amount is not null then
    new.discount_amount := least(greatest(coalesce(new.discount_amount,0),0),greatest(new.subtotal_amount,0));
    v_base := greatest(new.subtotal_amount-new.discount_amount,0);
    new.tax_amount := round(v_base*0.15,2);
    new.amount := round(v_base+new.tax_amount,2);
    new.paid_amount := least(greatest(coalesce(new.paid_amount,0),0),new.amount);
    if new.payment_status='paid' then new.paid_amount:=new.amount; end if;
    new.balance_due := greatest(new.amount-new.paid_amount,0);
  end if;
  return new;
end;
$$;

drop trigger if exists payments_enforce_invoice_vat_15 on public.payments;
create trigger payments_enforce_invoice_vat_15
before insert or update of subtotal_amount,discount_amount,tax_amount,amount,paid_amount,payment_status
on public.payments
for each row execute function public.enforce_invoice_vat_15_percent();

select 'fixed_vat_15_percent_ready' as status;
