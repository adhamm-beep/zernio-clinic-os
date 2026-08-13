begin;

create or replace function public.patient_select_payment_method(
  p_appointment_id bigint,
  p_payment_method text,
  p_quoted_amount numeric default null
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer_id bigint := public.current_patient_customer_id();
  v_id bigint;
  v_amount numeric;
begin
  if p_payment_method not in ('pay_at_clinic', 'online') then
    raise exception 'Invalid payment method';
  end if;

  if p_quoted_amount is not null and p_quoted_amount < 0 then
    raise exception 'Quoted amount cannot be negative';
  end if;

  select case
    when a.doctor_id is not null then (
      select min(cp.price)
      from public.services cs
      join public.service_variants cv
        on cv.service_id = cs.id and cv.is_active
      join public.service_variant_prices cp
        on cp.service_variant_id = cv.id
       and cp.staff_id = a.doctor_id
       and cp.is_active
      where cs.code = 'CONSULTATION' and cs.is_active
    )
    else (
      select min(sp.price)
      from public.service_prices sp
      where sp.service_id = a.service_id and sp.is_active
    )
  end
  into v_amount
  from public.appointments a
  where a.id = p_appointment_id
    and a.customer_id = v_customer_id;

  if v_amount is null then
    raise exception 'Booking price is not configured';
  end if;

  insert into public.patient_appointment_payments (
    appointment_id,
    customer_id,
    payment_method,
    payment_status,
    quoted_amount
  )
  values (
    p_appointment_id,
    v_customer_id,
    p_payment_method,
    case when p_payment_method = 'online' then 'processing' else 'pending' end,
    v_amount
  )
  on conflict (appointment_id) do update
    set payment_method = excluded.payment_method,
        payment_status = excluded.payment_status,
        quoted_amount = excluded.quoted_amount,
        updated_at = now()
  returning id into v_id;

  return v_id;
end;
$$;

commit;
