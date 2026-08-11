begin;

-- A paid invoice is the source of truth for completing its linked visit.
-- Do not require paid_amount to have been populated by older integrations:
-- payment_status = paid already means the cashier/payment gateway confirmed it.
create or replace function public.complete_appointment_after_full_payment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.appointment_id is null
     or lower(coalesce(new.payment_status, '')) <> 'paid'
     or coalesce(new.amount, 0) <= 0 then
    return new;
  end if;

  -- Keep legacy and online-payment rows financially consistent as well.
  if coalesce(new.paid_amount, 0) < coalesce(new.amount, 0)
     or coalesce(new.balance_due, 0) <> 0 then
    update public.payments
       set paid_amount = greatest(coalesce(paid_amount, 0), coalesce(amount, 0)),
           balance_due = 0
     where id = new.id;
  end if;

  update public.appointments a
     set status = 'completed'
   where a.id = new.appointment_id
     and a.customer_id = new.customer_id
     and a.clinic_id = new.clinic_id
     and (new.branch_id is null or a.branch_id is null or a.branch_id = new.branch_id)
     and lower(coalesce(a.status, '')) not in ('completed', 'cancelled', 'canceled', 'no_show');

  return new;
end;
$$;

drop trigger if exists payments_complete_appointment_after_full_payment on public.payments;
create trigger payments_complete_appointment_after_full_payment
after insert or update of payment_status, paid_amount, balance_due, amount, appointment_id
on public.payments
for each row
when (new.appointment_id is not null)
execute function public.complete_appointment_after_full_payment();

-- Repair already-paid invoices and their appointments.
update public.payments
   set paid_amount = greatest(coalesce(paid_amount, 0), coalesce(amount, 0)),
       balance_due = 0
 where appointment_id is not null
   and lower(coalesce(payment_status, '')) = 'paid'
   and coalesce(amount, 0) > 0
   and (coalesce(paid_amount, 0) < coalesce(amount, 0) or coalesce(balance_due, 0) <> 0);

update public.appointments a
   set status = 'completed'
  from public.payments p
 where p.appointment_id = a.id
   and p.customer_id = a.customer_id
   and p.clinic_id = a.clinic_id
   and lower(coalesce(p.payment_status, '')) = 'paid'
   and coalesce(p.amount, 0) > 0
   and lower(coalesce(a.status, '')) not in ('completed', 'cancelled', 'canceled', 'no_show');

commit;

with checks as (
  select 'paid_invoice_completion_trigger' check_name,
         count(*)::bigint value,
         1::bigint expected
    from pg_trigger
   where tgrelid = 'public.payments'::regclass
     and tgname = 'payments_complete_appointment_after_full_payment'
     and not tgisinternal
  union all
  select 'paid_invoice_open_appointments', count(*)::bigint, 0::bigint
    from public.payments p
    join public.appointments a on a.id = p.appointment_id
   where lower(coalesce(p.payment_status, '')) = 'paid'
     and coalesce(p.amount, 0) > 0
     and lower(coalesce(a.status, '')) not in ('completed', 'cancelled', 'canceled', 'no_show')
)
select case when value = expected then 'OK' else 'CHECK' end status,
       check_name, value, expected
  from checks
 order by check_name;
