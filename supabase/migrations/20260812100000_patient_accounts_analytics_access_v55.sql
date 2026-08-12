begin;
drop policy if exists patient_accounts_staff_analytics_read on public.patient_accounts;
create policy patient_accounts_staff_analytics_read on public.patient_accounts for select to authenticated
using(public.has_hr_permission('patient_app.analytics') and exists(
 select 1 from public.customers c where c.id=customer_id and c.clinic_id=public.current_clinic_id()
));
commit;
