-- Zernio v40: tenant hardening and final release audit. Safe after v39.
begin;
set local lock_timeout='20s';

-- Keep this release audit self-contained when v39 was not run separately.
alter table public.customers add column if not exists national_id text;
alter table public.customers add column if not exists nationality text not null default 'saudi';
update public.customers set nationality='saudi' where nationality is null or nationality not in('saudi','non_saudi');
alter table public.customers drop constraint if exists customers_nationality_check;
alter table public.customers add constraint customers_nationality_check check(nationality in('saudi','non_saudi'));

create or replace function public.prevent_duplicate_customer_identity()
returns trigger language plpgsql set search_path=public as $$
declare
 v_phone text:=right(regexp_replace(coalesce(new.phone_normalized,new.phone,''),'\D','','g'),9);
 v_national_id text:=regexp_replace(coalesce(new.national_id,''),'\s','','g');
 v_customer_code text:=trim(coalesce(new.customer_code,''));
begin
 if v_customer_code='' then raise exception using errcode='23514',message='CUSTOMER_CODE_REQUIRED';end if;
 if exists(select 1 from public.customers c where c.id is distinct from new.id and lower(trim(coalesce(c.customer_code,'')))=lower(v_customer_code)) then raise exception using errcode='23505',message='CUSTOMER_CODE_ALREADY_EXISTS';end if;
 if v_phone<>'' and exists(select 1 from public.customers c where c.id is distinct from new.id and right(regexp_replace(coalesce(c.phone_normalized,c.phone,''),'\D','','g'),9)=v_phone) then raise exception using errcode='23505',message='CUSTOMER_PHONE_ALREADY_EXISTS';end if;
 if v_national_id<>'' and exists(select 1 from public.customers c where c.id is distinct from new.id and regexp_replace(coalesce(c.national_id,''),'\s','','g')=v_national_id) then raise exception using errcode='23505',message='CUSTOMER_NATIONAL_ID_ALREADY_EXISTS';end if;
 new.customer_code:=v_customer_code;
 new.national_id:=nullif(v_national_id,'');
 new.nationality:=case when new.nationality='non_saudi' then 'non_saudi' else 'saudi' end;
 return new;
end;$$;
drop trigger if exists customers_prevent_duplicate_identity on public.customers;
create trigger customers_prevent_duplicate_identity before insert or update of customer_code,phone,phone_normalized,national_id,nationality on public.customers for each row execute function public.prevent_duplicate_customer_identity();

create or replace function public.enforce_invoice_vat_15_percent()
returns trigger language plpgsql set search_path=public as $$
declare v_base numeric;v_vat_rate numeric:=0;
begin
 if new.subtotal_amount is not null then
  select case when c.nationality='non_saudi' then .15 else 0 end into v_vat_rate from public.customers c where c.id=new.customer_id;
  v_vat_rate:=coalesce(v_vat_rate,0);
  new.discount_amount:=least(greatest(coalesce(new.discount_amount,0),0),greatest(new.subtotal_amount,0));
  v_base:=greatest(new.subtotal_amount-new.discount_amount,0);
  new.tax_amount:=round(v_base*v_vat_rate,2);
  new.amount:=round(v_base+new.tax_amount,2);
  new.paid_amount:=least(greatest(coalesce(new.paid_amount,0),0),new.amount);
  if new.payment_status='paid' then new.paid_amount:=new.amount;end if;
  new.balance_due:=greatest(new.amount-new.paid_amount,0);
 end if;
 return new;
end;$$;
drop trigger if exists payments_enforce_invoice_vat_15 on public.payments;
create trigger payments_enforce_invoice_vat_15 before insert or update of customer_id,subtotal_amount,discount_amount,tax_amount,amount,paid_amount,payment_status on public.payments for each row execute function public.enforce_invoice_vat_15_percent();

drop policy if exists "Authenticated users manage invoice items" on public.payment_invoice_items;
drop policy if exists payment_invoice_items_staff_scope on public.payment_invoice_items;
create policy payment_invoice_items_staff_scope on public.payment_invoice_items for all to authenticated
using(clinic_id=public.current_clinic_id() and exists(select 1 from public.payments p where p.id=payment_id and p.clinic_id=public.current_clinic_id()))
with check(clinic_id=public.current_clinic_id() and exists(select 1 from public.payments p where p.id=payment_id and p.clinic_id=public.current_clinic_id()));

do $$declare t text;begin
 foreach t in array array['inventory_suppliers','inventory_products','inventory_purchase_orders','inventory_movements','marketing_campaigns','marketing_leads','marketing_messages','marketing_source_costs','hr_attendance','hr_shifts'] loop
  execute format('drop policy if exists "Authenticated users manage %1$s" on public.%1$I',t);
  execute format('drop policy if exists %I on public.%I',t||'_staff_scope',t);
  execute format('create policy %I on public.%I for all to authenticated using(clinic_id=public.current_clinic_id()) with check(clinic_id=public.current_clinic_id())',t||'_staff_scope',t);
 end loop;
end$$;

drop policy if exists "Authenticated users manage inventory_purchase_order_items" on public.inventory_purchase_order_items;
drop policy if exists inventory_purchase_order_items_staff_scope on public.inventory_purchase_order_items;
create policy inventory_purchase_order_items_staff_scope on public.inventory_purchase_order_items for all to authenticated
using(exists(select 1 from public.inventory_purchase_orders po where po.id=purchase_order_id and po.clinic_id=public.current_clinic_id()))
with check(exists(select 1 from public.inventory_purchase_orders po where po.id=purchase_order_id and po.clinic_id=public.current_clinic_id()));

drop policy if exists "Authenticated users manage hr_permissions" on public.hr_permissions;
drop policy if exists hr_permissions_read on public.hr_permissions;
create policy hr_permissions_read on public.hr_permissions for select to authenticated using(public.current_staff_id() is not null);
drop policy if exists "Authenticated users manage hr_roles" on public.hr_roles;
drop policy if exists hr_roles_staff_scope on public.hr_roles;
create policy hr_roles_staff_scope on public.hr_roles for all to authenticated
using(clinic_id=public.current_clinic_id()) with check(clinic_id=public.current_clinic_id() and public.has_hr_permission('staff.manage'));
drop policy if exists "Authenticated users manage hr_role_permissions" on public.hr_role_permissions;
drop policy if exists hr_role_permissions_staff_scope on public.hr_role_permissions;
create policy hr_role_permissions_staff_scope on public.hr_role_permissions for all to authenticated
using(exists(select 1 from public.hr_roles r where r.id=role_id and r.clinic_id=public.current_clinic_id()))
with check(exists(select 1 from public.hr_roles r where r.id=role_id and r.clinic_id=public.current_clinic_id()) and public.has_hr_permission('staff.manage'));
drop policy if exists "Authenticated users manage hr_staff_roles" on public.hr_staff_roles;
drop policy if exists hr_staff_roles_staff_scope on public.hr_staff_roles;
create policy hr_staff_roles_staff_scope on public.hr_staff_roles for all to authenticated
using(exists(select 1 from public.staff s where s.id=staff_id and s.clinic_id=public.current_clinic_id()))
with check(exists(select 1 from public.staff s where s.id=staff_id and s.clinic_id=public.current_clinic_id()) and public.has_hr_permission('staff.manage'));

drop policy if exists "Authenticated users manage staff rooms" on public.staff_rooms;
drop policy if exists staff_rooms_staff_scope on public.staff_rooms;
create policy staff_rooms_staff_scope on public.staff_rooms for all to authenticated
using(exists(select 1 from public.staff s where s.id=staff_id and s.clinic_id=public.current_clinic_id()))
with check(exists(select 1 from public.staff s where s.id=staff_id and s.clinic_id=public.current_clinic_id()));
drop policy if exists "Authenticated users manage staff devices" on public.staff_devices;
drop policy if exists staff_devices_staff_scope on public.staff_devices;
create policy staff_devices_staff_scope on public.staff_devices for all to authenticated
using(exists(select 1 from public.staff s where s.id=staff_id and s.clinic_id=public.current_clinic_id()))
with check(exists(select 1 from public.staff s where s.id=staff_id and s.clinic_id=public.current_clinic_id()));
drop policy if exists "Authenticated users manage working hours" on public.staff_working_hours;
drop policy if exists staff_working_hours_staff_scope on public.staff_working_hours;
create policy staff_working_hours_staff_scope on public.staff_working_hours for all to authenticated
using(exists(select 1 from public.staff s where s.id=staff_id and s.clinic_id=public.current_clinic_id()))
with check(exists(select 1 from public.staff s where s.id=staff_id and s.clinic_id=public.current_clinic_id()));

drop policy if exists patient_requests_access on public.patient_appointment_requests;
create policy patient_requests_access on public.patient_appointment_requests for select to authenticated
using(customer_id=public.current_patient_customer_id() or(public.current_staff_id() is not null and clinic_id=public.current_clinic_id()));
drop policy if exists patient_requests_staff_manage on public.patient_appointment_requests;
create policy patient_requests_staff_manage on public.patient_appointment_requests for update to authenticated
using(public.current_staff_id() is not null and clinic_id=public.current_clinic_id())
with check(public.current_staff_id() is not null and clinic_id=public.current_clinic_id());

drop policy if exists patient_consents_access on public.patient_consents;
create policy patient_consents_access on public.patient_consents for select to authenticated
using(customer_id=public.current_patient_customer_id() or(public.current_staff_id() is not null and clinic_id=public.current_clinic_id()));
drop policy if exists patient_consents_staff_manage on public.patient_consents;
create policy patient_consents_staff_manage on public.patient_consents for all to authenticated
using(public.current_staff_id() is not null and clinic_id=public.current_clinic_id())
with check(public.current_staff_id() is not null and clinic_id=public.current_clinic_id());

drop policy if exists patient_messages_access on public.patient_messages;
create policy patient_messages_access on public.patient_messages for select to authenticated
using(customer_id=public.current_patient_customer_id() or(public.current_staff_id() is not null and clinic_id=public.current_clinic_id()));
drop policy if exists patient_messages_staff_manage on public.patient_messages;
create policy patient_messages_staff_manage on public.patient_messages for all to authenticated
using(public.current_staff_id() is not null and clinic_id=public.current_clinic_id())
with check(public.current_staff_id() is not null and clinic_id=public.current_clinic_id());

drop policy if exists patient_packages_access on public.patient_packages;
create policy patient_packages_access on public.patient_packages for select to authenticated
using(customer_id=public.current_patient_customer_id() or(public.current_staff_id() is not null and clinic_id=public.current_clinic_id()));
drop policy if exists patient_packages_staff_manage on public.patient_packages;
create policy patient_packages_staff_manage on public.patient_packages for all to authenticated
using(public.current_staff_id() is not null and clinic_id=public.current_clinic_id())
with check(public.current_staff_id() is not null and clinic_id=public.current_clinic_id());

drop policy if exists patient_suggestions_staff on public.patient_automation_suggestions;
create policy patient_suggestions_staff on public.patient_automation_suggestions for all to authenticated
using(public.current_staff_id() is not null and clinic_id=public.current_clinic_id())
with check(public.current_staff_id() is not null and clinic_id=public.current_clinic_id());

drop policy if exists patient_payment_intents_access on public.patient_payment_intents;
create policy patient_payment_intents_access on public.patient_payment_intents for select to authenticated
using(customer_id=public.current_patient_customer_id() or(public.current_staff_id() is not null and clinic_id=public.current_clinic_id()));

drop policy if exists patient_push_deliveries_staff on public.patient_push_deliveries;
create policy patient_push_deliveries_staff on public.patient_push_deliveries for select to authenticated
using(public.current_staff_id() is not null and exists(select 1 from public.customers c where c.id=customer_id and c.clinic_id=public.current_clinic_id()));

drop policy if exists patient_legal_acceptances_self on public.patient_legal_acceptances;
create policy patient_legal_acceptances_self on public.patient_legal_acceptances for select to authenticated
using(auth_user_id=auth.uid() or(public.current_staff_id() is not null and exists(select 1 from public.customers c where c.id=customer_id and c.clinic_id=public.current_clinic_id())));
drop policy if exists patient_privacy_requests_self on public.patient_privacy_requests;
create policy patient_privacy_requests_self on public.patient_privacy_requests for select to authenticated
using(auth_user_id=auth.uid() or(public.current_staff_id() is not null and exists(select 1 from public.customers c where c.id=customer_id and c.clinic_id=public.current_clinic_id())));

-- Patient wallet descriptions in both languages.
create or replace function public.patient_finance_health_hub()
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_customer_id bigint:=public.current_patient_customer_id();v_record jsonb;v_filled integer:=0;
begin
 if v_customer_id is null then raise exception 'Patient account is not linked';end if;
 select to_jsonb(mr),(case when nullif(mr.blood_type,'') is not null then 1 else 0 end+case when nullif(mr.allergies,'') is not null then 1 else 0 end+case when nullif(mr.chronic_diseases,'') is not null then 1 else 0 end+case when nullif(mr.medications,'') is not null then 1 else 0 end+case when nullif(mr.medical_notes,'') is not null then 1 else 0 end) into v_record,v_filled from medical_records mr where mr.customer_id=v_customer_id;
 return jsonb_build_object('wallet',jsonb_build_object(
  'totalPaid',coalesce((select sum(paid_amount) from payments where customer_id=v_customer_id),0),
  'outstanding',coalesce((select sum(balance_due) from payments where customer_id=v_customer_id and lower(coalesce(payment_status,'')) not in('cancelled','refunded')),0),
  'currency',coalesce((select currency from payments where customer_id=v_customer_id and currency is not null order by created_at desc limit 1),'SAR'),
  'transactions',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'invoiceNumber',p.invoice_number,'subtotal',p.subtotal_amount,'taxAmount',p.tax_amount,'discountAmount',p.discount_amount,'amount',p.amount,'paidAmount',p.paid_amount,'outstanding',p.balance_due,'status',p.payment_status,'method',p.payment_method,'date',coalesce(p.payment_date,p.created_at),'reference',p.reference_number,'notes',p.notes,'items',coalesce((select jsonb_agg(jsonb_build_object('description',i.description,'descriptionEn',concat_ws(' - ',coalesce(s.name_en,s.name),case when v.id is null then null else coalesce(v.name_en,v.name) end),'descriptionAr',concat_ws(' - ',coalesce(s.name_ar,s.name_en,s.name),case when v.id is null then null else coalesce(v.name_ar,v.name_en,v.name) end),'quantity',i.quantity,'unit',i.unit,'unitPrice',i.unit_price,'lineTotal',i.line_total) order by i.id) from payment_invoice_items i left join services s on s.id=i.service_id left join service_variants v on v.id=i.service_variant_id where i.payment_id=p.id),'[]'::jsonb)) order by coalesce(p.payment_date,p.created_at) desc) from payments p where p.customer_id=v_customer_id),'[]'::jsonb)),
  'health',jsonb_build_object('record',v_record,'completeness',round((v_filled::numeric/5)*100),'updateRequests',coalesce((select jsonb_agg(jsonb_build_object('id',r.id,'fields',r.requested_fields,'note',r.patient_note,'status',r.status,'createdAt',r.created_at) order by r.created_at desc) from patient_medical_update_requests r where r.customer_id=v_customer_id),'[]'::jsonb)));
end;$$;

commit;

with checks as(
 select 'approved_doctors' check_name,count(*)::bigint value,3::bigint expected,'Exactly three active doctors' details from staff where is_active and lower(trim(staff_name)) in('dr fatima alsatouf','dr maram','dr fatima khaled')
 union all select 'duplicate_customer_file_numbers',count(*)::bigint,0,'Must be zero' from(select lower(trim(customer_code)) from customers where nullif(trim(customer_code),'') is not null group by 1 having count(*)>1)d
 union all select 'duplicate_customer_phones',count(*)::bigint,0,'Must be zero' from(select right(regexp_replace(coalesce(phone_normalized,phone,''),'\D','','g'),9) k from customers group by 1 having count(*)>1 and min(right(regexp_replace(coalesce(phone_normalized,phone,''),'\D','','g'),9))<>'')d
 union all select 'duplicate_customer_national_ids',count(*)::bigint,0,'Must be zero' from(select regexp_replace(coalesce(national_id,''),'\s','','g') k from customers group by 1 having count(*)>1 and min(regexp_replace(coalesce(national_id,''),'\s','','g'))<>'')d
 union all select 'invalid_customer_nationality',count(*)::bigint,0,'Only saudi or non_saudi' from customers where nationality not in('saudi','non_saudi')
 union all select 'invoice_item_scope_mismatch',count(*)::bigint,0,'Line and invoice scope must match' from payment_invoice_items i join payments p on p.id=i.payment_id where i.clinic_id<>p.clinic_id or i.branch_id<>p.branch_id
 union all select 'invoice_line_total_mismatch',count(*)::bigint,0,'Quantity times price equals total' from payment_invoice_items where abs(line_total-round(quantity*unit_price,2))>.01
 union all select 'invoice_subtotal_mismatch',count(*)::bigint,0,'Subtotal equals invoice lines' from payments p where exists(select 1 from payment_invoice_items i where i.payment_id=p.id) and abs(p.subtotal_amount-coalesce((select sum(i.line_total) from payment_invoice_items i where i.payment_id=p.id),0))>.01
 union all select 'invoice_vat_mismatch',count(*)::bigint,0,'Saudi 0%; non-Saudi 15%' from payments p join customers c on c.id=p.customer_id where abs(coalesce(p.tax_amount,0)-round(greatest(coalesce(p.subtotal_amount,0)-coalesce(p.discount_amount,0),0)*(case when c.nationality='non_saudi' then .15 else 0 end),2))>.01
 union all select 'invoice_balance_mismatch',count(*)::bigint,0,'Balance equals total minus paid' from payments where abs(coalesce(balance_due,0)-greatest(coalesce(amount,0)-coalesce(paid_amount,0),0))>.01
 union all select 'appointment_customer_scope_mismatch',count(*)::bigint,0,'Must be zero' from appointments a join customers c on c.id=a.customer_id where a.clinic_id<>c.clinic_id
 union all select 'payment_customer_scope_mismatch',count(*)::bigint,0,'Must be zero' from payments p join customers c on c.id=p.customer_id where p.clinic_id<>c.clinic_id
 union all select 'active_services_missing_arabic',count(*)::bigint,0,'Services and categories bilingual' from services where is_active and(nullif(trim(name_ar),'') is null or nullif(trim(name_en),'') is null or nullif(trim(category_ar),'') is null or nullif(trim(category_en),'') is null)
 union all select 'active_materials_missing_arabic',count(*)::bigint,0,'Materials bilingual' from service_variants where is_active and(nullif(trim(name_ar),'') is null or nullif(trim(name_en),'') is null)
 union all select 'unsafe_tenant_true_policies',count(*)::bigint,0,'No unrestricted authenticated tenant policies' from pg_policies where schemaname='public' and tablename in('payment_invoice_items','inventory_suppliers','inventory_products','inventory_purchase_orders','inventory_purchase_order_items','inventory_movements','marketing_campaigns','marketing_leads','marketing_messages','marketing_source_costs','hr_roles','hr_role_permissions','hr_staff_roles','hr_attendance','hr_shifts','staff_rooms','staff_devices','staff_working_hours','patient_appointment_requests','patient_consents','patient_messages','patient_packages','patient_automation_suggestions','patient_payment_intents','patient_push_deliveries','patient_legal_acceptances','patient_privacy_requests') and roles::text like '%authenticated%' and(regexp_replace(coalesce(qual,''),'[()[:space:]]','','g')='true' or regexp_replace(coalesce(with_check,''),'[()[:space:]]','','g')='true')
 union all select 'required_database_triggers',count(*)::bigint,8,'Core automation triggers' from pg_trigger where not tgisinternal and tgname in('customers_prevent_duplicate_identity','payments_enforce_invoice_vat_15','appointments_zernio_integrity','appointments_invoice_due_notify','payments_invoice_due_resolve','patient_request_status_notify','inventory_movement_stock_trigger','treatment_item_inventory_trigger')
 union all select 'push_dispatch_cron',count(*)::bigint,1,'Push dispatcher enabled' from cron.job where jobname='zernio-patient-push-dispatch' and active
 union all select 'push_dispatch_secret',count(*)::bigint,1,'Dispatcher secret exists' from vault.decrypted_secrets where name='push_dispatch_secret' and nullif(decrypted_secret,'') is not null
)
select case when value=expected then 'OK' else 'CHECK' end status,check_name,value,expected,details from checks order by status desc,check_name;
