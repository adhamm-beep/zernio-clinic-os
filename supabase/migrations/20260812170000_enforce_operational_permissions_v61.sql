-- Enforce the permission catalogue on operational data, not only navigation.
begin;

-- Patients
drop policy if exists customers_staff_read on public.customers;
drop policy if exists customers_staff_insert on public.customers;
drop policy if exists customers_staff_update on public.customers;
drop policy if exists customers_staff_delete on public.customers;
create policy customers_staff_read on public.customers for select to authenticated using
 (clinic_id=public.current_clinic_id() and public.has_any_hr_permission(array['customers.view','customers.details.view','customers.manage','reports.view']));
create policy customers_staff_insert on public.customers for insert to authenticated with check
 (clinic_id=public.current_clinic_id() and public.has_any_hr_permission(array['customers.create','customers.manage']));
create policy customers_staff_update on public.customers for update to authenticated using
 (clinic_id=public.current_clinic_id() and public.has_any_hr_permission(array['customers.edit','customers.deactivate','customers.manage'])) with check
 (clinic_id=public.current_clinic_id() and public.has_any_hr_permission(array['customers.edit','customers.deactivate','customers.manage']));
create policy customers_staff_delete on public.customers for delete to authenticated using
 (clinic_id=public.current_clinic_id() and public.has_hr_permission('customers.manage'));

-- Appointments
drop policy if exists appointments_staff_read on public.appointments;
drop policy if exists appointments_staff_insert on public.appointments;
drop policy if exists appointments_staff_update on public.appointments;
drop policy if exists appointments_staff_delete on public.appointments;
create policy appointments_staff_read on public.appointments for select to authenticated using
 (clinic_id=public.current_clinic_id() and public.has_any_hr_permission(array['appointments.view','appointments.manage','calendar.view','reports.view']));
create policy appointments_staff_insert on public.appointments for insert to authenticated with check
 (clinic_id=public.current_clinic_id() and public.has_any_hr_permission(array['appointments.create','appointments.manage']));
create policy appointments_staff_update on public.appointments for update to authenticated using
 (clinic_id=public.current_clinic_id() and public.has_any_hr_permission(array['appointments.edit','appointments.cancel','appointments.manage'])) with check
 (clinic_id=public.current_clinic_id() and public.has_any_hr_permission(array['appointments.edit','appointments.cancel','appointments.manage']));
create policy appointments_staff_delete on public.appointments for delete to authenticated using
 (clinic_id=public.current_clinic_id() and public.has_hr_permission('appointments.manage'));

-- Follow-ups
drop policy if exists followups_staff_read on public.follow_ups;
drop policy if exists followups_staff_insert on public.follow_ups;
drop policy if exists followups_staff_update on public.follow_ups;
drop policy if exists followups_staff_delete on public.follow_ups;
create policy followups_staff_read on public.follow_ups for select to authenticated using
 (clinic_id=public.current_clinic_id() and public.has_any_hr_permission(array['followups.view','followups.manage']));
create policy followups_staff_insert on public.follow_ups for insert to authenticated with check
 (clinic_id=public.current_clinic_id() and public.has_hr_permission('followups.manage'));
create policy followups_staff_update on public.follow_ups for update to authenticated using
 (clinic_id=public.current_clinic_id() and public.has_hr_permission('followups.manage')) with check
 (clinic_id=public.current_clinic_id() and public.has_hr_permission('followups.manage'));
create policy followups_staff_delete on public.follow_ups for delete to authenticated using
 (clinic_id=public.current_clinic_id() and public.has_hr_permission('followups.manage'));

-- Treatments and medical records
drop policy if exists treatments_staff_read on public.treatments;
drop policy if exists treatments_staff_insert on public.treatments;
drop policy if exists treatments_staff_update on public.treatments;
drop policy if exists treatments_staff_delete on public.treatments;
create policy treatments_staff_read on public.treatments for select to authenticated using
 (clinic_id=public.current_clinic_id() and public.has_any_hr_permission(array['treatments.view','treatments.manage']));
create policy treatments_staff_insert on public.treatments for insert to authenticated with check
 (clinic_id=public.current_clinic_id() and public.has_any_hr_permission(array['treatments.create','treatments.manage']));
create policy treatments_staff_update on public.treatments for update to authenticated using
 (clinic_id=public.current_clinic_id() and public.has_any_hr_permission(array['treatments.edit','treatments.complete','treatments.manage'])) with check
 (clinic_id=public.current_clinic_id() and public.has_any_hr_permission(array['treatments.edit','treatments.complete','treatments.manage']));
create policy treatments_staff_delete on public.treatments for delete to authenticated using
 (clinic_id=public.current_clinic_id() and public.has_hr_permission('treatments.manage'));

drop policy if exists medical_records_staff_read on public.medical_records;
drop policy if exists medical_records_staff_insert on public.medical_records;
drop policy if exists medical_records_staff_update on public.medical_records;
drop policy if exists medical_records_staff_delete on public.medical_records;
create policy medical_records_staff_read on public.medical_records for select to authenticated using
 (clinic_id=public.current_clinic_id() and public.has_hr_permission('medical.view'));
create policy medical_records_staff_insert on public.medical_records for insert to authenticated with check
 (clinic_id=public.current_clinic_id() and public.has_hr_permission('medical.edit'));
create policy medical_records_staff_update on public.medical_records for update to authenticated using
 (clinic_id=public.current_clinic_id() and public.has_hr_permission('medical.edit')) with check
 (clinic_id=public.current_clinic_id() and public.has_hr_permission('medical.edit'));
create policy medical_records_staff_delete on public.medical_records for delete to authenticated using
 (clinic_id=public.current_clinic_id() and public.has_hr_permission('medical.edit'));

-- Finance
drop policy if exists payments_staff_read on public.payments;
drop policy if exists payments_staff_insert on public.payments;
drop policy if exists payments_staff_update on public.payments;
drop policy if exists payments_staff_delete on public.payments;
create policy payments_staff_read on public.payments for select to authenticated using
 (clinic_id=public.current_clinic_id() and public.has_any_hr_permission(array['payments.view','payments.manage','reports.finance.view']));
create policy payments_staff_insert on public.payments for insert to authenticated with check
 (clinic_id=public.current_clinic_id() and public.has_any_hr_permission(array['payments.create','payments.manage']));
create policy payments_staff_update on public.payments for update to authenticated using
 (clinic_id=public.current_clinic_id() and public.has_any_hr_permission(array['payments.create','payments.refund','payments.manage'])) with check
 (clinic_id=public.current_clinic_id() and public.has_any_hr_permission(array['payments.create','payments.refund','payments.manage']));
create policy payments_staff_delete on public.payments for delete to authenticated using
 (clinic_id=public.current_clinic_id() and public.has_hr_permission('payments.manage'));

drop policy if exists payment_invoice_items_staff_scope on public.payment_invoice_items;
drop policy if exists payment_invoice_items_insert on public.payment_invoice_items;
drop policy if exists payment_invoice_items_update on public.payment_invoice_items;
drop policy if exists payment_invoice_items_delete on public.payment_invoice_items;
create policy payment_invoice_items_staff_scope on public.payment_invoice_items for select to authenticated using
 (clinic_id=public.current_clinic_id() and public.has_any_hr_permission(array['payments.view','payments.manage','reports.finance.view']));
create policy payment_invoice_items_insert on public.payment_invoice_items for insert to authenticated with check
 (clinic_id=public.current_clinic_id() and public.has_any_hr_permission(array['payments.create','payments.manage']));
create policy payment_invoice_items_update on public.payment_invoice_items for update to authenticated using
 (clinic_id=public.current_clinic_id() and public.has_hr_permission('payments.manage')) with check
 (clinic_id=public.current_clinic_id() and public.has_hr_permission('payments.manage'));
create policy payment_invoice_items_delete on public.payment_invoice_items for delete to authenticated using
 (clinic_id=public.current_clinic_id() and public.has_hr_permission('payments.manage'));

-- Inventory and marketing: replace the previous broad ALL policy with separate read/write rules.
do $$declare t text;p record;begin
 foreach t in array array['inventory_suppliers','inventory_products','inventory_purchase_orders','inventory_movements'] loop
  for p in select policyname from pg_policies where schemaname='public' and tablename=t loop execute format('drop policy %I on public.%I',p.policyname,t);end loop;
  execute format('create policy %I on public.%I for select to authenticated using(clinic_id=public.current_clinic_id() and public.has_any_hr_permission(array[''inventory.view'',''inventory.manage'']))',t||'_permission_read',t);
  execute format('create policy %I on public.%I for all to authenticated using(clinic_id=public.current_clinic_id() and public.has_hr_permission(''inventory.manage'')) with check(clinic_id=public.current_clinic_id() and public.has_hr_permission(''inventory.manage''))',t||'_permission_manage',t);
 end loop;
 foreach t in array array['marketing_campaigns','marketing_leads','marketing_messages','marketing_source_costs'] loop
  for p in select policyname from pg_policies where schemaname='public' and tablename=t loop execute format('drop policy %I on public.%I',p.policyname,t);end loop;
  execute format('create policy %I on public.%I for select to authenticated using(clinic_id=public.current_clinic_id() and public.has_any_hr_permission(array[''marketing.view'',''marketing.manage'']))',t||'_permission_read',t);
  execute format('create policy %I on public.%I for all to authenticated using(clinic_id=public.current_clinic_id() and public.has_hr_permission(''marketing.manage'')) with check(clinic_id=public.current_clinic_id() and public.has_hr_permission(''marketing.manage''))',t||'_permission_manage',t);
 end loop;
end$$;

commit;
