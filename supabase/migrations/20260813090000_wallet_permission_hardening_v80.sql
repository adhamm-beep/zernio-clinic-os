begin;

drop policy if exists patient_wallet_staff_scope on public.patient_wallet_transactions;
drop policy if exists patient_wallet_staff_read on public.patient_wallet_transactions;
drop policy if exists patient_wallet_staff_write on public.patient_wallet_transactions;

create policy patient_wallet_staff_read
on public.patient_wallet_transactions for select to authenticated
using(
  customer_id=public.current_patient_customer_id()
  or (
    clinic_id=public.current_clinic_id()
    and public.has_any_hr_permission(array[
      'loyalty.view','customers.manage','payments.amounts.view','payments.manage'
    ])
  )
);

create policy patient_wallet_staff_write
on public.patient_wallet_transactions for all to authenticated
using(
  clinic_id=public.current_clinic_id()
  and public.has_any_hr_permission(array[
    'customers.edit','customers.manage','payments.create','payments.manage'
  ])
)
with check(
  clinic_id=public.current_clinic_id()
  and public.has_any_hr_permission(array[
    'customers.edit','customers.manage','payments.create','payments.manage'
  ])
);

commit;
