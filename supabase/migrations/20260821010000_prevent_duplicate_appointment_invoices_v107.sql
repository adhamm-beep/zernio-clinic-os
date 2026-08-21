begin;

create or replace function public.prevent_duplicate_appointment_invoice()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.appointment_id is null
    or lower(coalesce(new.payment_status, '')) in ('cancelled', 'refunded') then
    return new;
  end if;

  -- Serialize invoice creation for the same appointment so two simultaneous
  -- requests cannot both pass the duplicate check.
  perform pg_advisory_xact_lock(730000000000 + new.appointment_id);

  if exists (
    select 1
    from public.payments existing
    where existing.appointment_id = new.appointment_id
      and existing.id is distinct from new.id
      and lower(coalesce(existing.payment_status, '')) not in ('cancelled', 'refunded')
  ) then
    raise exception using
      errcode = '23505',
      message = 'An active invoice has already been issued for this appointment',
      detail = format('appointment_id=%s', new.appointment_id),
      hint = 'Record the remaining balance against the existing invoice instead.';
  end if;

  return new;
end;
$$;

drop trigger if exists payments_prevent_duplicate_appointment_invoice on public.payments;
create trigger payments_prevent_duplicate_appointment_invoice
before insert on public.payments
for each row execute function public.prevent_duplicate_appointment_invoice();

commit;

select
  appointment_id,
  count(*) as active_invoice_count,
  array_agg(id order by id) as payment_ids
from public.payments
where appointment_id is not null
  and lower(coalesce(payment_status, '')) not in ('cancelled', 'refunded')
group by appointment_id
having count(*) > 1
order by appointment_id;
