begin;

create or replace function public.complete_appointment_after_full_payment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text := lower(coalesce(new.payment_status, ''));
  v_amount numeric := greatest(coalesce(new.amount, 0), 0);
  v_paid numeric := greatest(coalesce(new.paid_amount, 0), 0);
  v_balance numeric := greatest(coalesce(new.balance_due, v_amount - v_paid), 0);
begin
  if new.appointment_id is null then
    return new;
  end if;

  -- A partial, cancelled, refunded or zero-value invoice must never complete a visit.
  if v_status <> 'paid' or v_amount <= 0 or v_paid < v_amount or v_balance > 0 then
    return new;
  end if;

  update public.appointments
     set status = 'completed'
   where id = new.appointment_id
     and customer_id = new.customer_id
     and clinic_id = new.clinic_id
     and (new.branch_id is null or branch_id = new.branch_id)
     and lower(coalesce(status, '')) not in ('completed', 'cancelled', 'canceled', 'no_show');

  return new;
end;
$$;

drop trigger if exists payments_complete_appointment_after_full_payment on public.payments;
create trigger payments_complete_appointment_after_full_payment
after insert or update of payment_status, paid_amount, balance_due, amount
on public.payments
for each row
execute function public.complete_appointment_after_full_payment();

-- Bring already fully paid linked invoices into the same consistent state.
update public.appointments a
   set status = 'completed'
  from public.payments p
 where p.appointment_id = a.id
   and p.customer_id = a.customer_id
   and p.clinic_id = a.clinic_id
   and (p.branch_id is null or p.branch_id = a.branch_id)
   and lower(coalesce(p.payment_status, '')) = 'paid'
   and coalesce(p.amount, 0) > 0
   and coalesce(p.paid_amount, 0) >= coalesce(p.amount, 0)
   and coalesce(p.balance_due, 0) = 0
   and lower(coalesce(a.status, '')) not in ('completed', 'cancelled', 'canceled', 'no_show');

commit;

with checks as (
  select
    'full_payment_completion_trigger'::text as check_name,
    count(*)::bigint as value,
    1::bigint as expected
  from pg_trigger
  where tgname = 'payments_complete_appointment_after_full_payment'
    and not tgisinternal

  union all

  select
    'fully_paid_invoice_with_open_appointment',
    count(*)::bigint,
    0::bigint
  from public.payments p
  join public.appointments a on a.id = p.appointment_id
  where lower(coalesce(p.payment_status, '')) = 'paid'
    and coalesce(p.amount, 0) > 0
    and coalesce(p.paid_amount, 0) >= coalesce(p.amount, 0)
    and coalesce(p.balance_due, 0) = 0
    and lower(coalesce(a.status, '')) not in ('completed', 'cancelled', 'canceled', 'no_show')
)
select
  case when value = expected then 'OK' else 'CHECK' end as status,
  check_name,
  value,
  expected
from checks
order by check_name;
