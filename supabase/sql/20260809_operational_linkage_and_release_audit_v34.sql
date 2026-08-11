begin;

create or replace function public.notify_staff_operational_event()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  v_new jsonb:=case when tg_op='DELETE' then '{}'::jsonb else to_jsonb(new) end;
  v_old jsonb:=case when tg_op='INSERT' then '{}'::jsonb else to_jsonb(old) end;
  v_clinic_id bigint:=nullif(v_new->>'clinic_id','')::bigint;
  v_branch_id bigint:=nullif(v_new->>'branch_id','')::bigint;
  v_customer_id bigint:=nullif(v_new->>'customer_id','')::bigint;
  v_customer_name text;
  v_title text;
  v_message text;
  v_type text;
  v_href text;
begin
  if v_clinic_id is null and v_customer_id is not null then
    select clinic_id,branch_id into v_clinic_id,v_branch_id from public.customers where id=v_customer_id;
  end if;
  if v_clinic_id is null then return new; end if;

  select nullif(trim(concat_ws(' ',first_name,last_name)),'') into v_customer_name
  from public.customers where id=v_customer_id;
  v_customer_name:=coalesce(v_customer_name,'#'||coalesce(v_customer_id::text,'—'));

  if tg_table_name='payments' then
    if tg_op='INSERT' then
      v_title:='دفعة جديدة · New payment';
      v_message:=format('تم تسجيل دفعة بقيمة %s ر.س للعميل %s. · A payment of SAR %s was recorded for %s.',coalesce(v_new->>'amount','0'),v_customer_name,coalesce(v_new->>'amount','0'),v_customer_name);
      v_type:='payment_recorded';
    elsif (v_old->>'payment_status') is distinct from (v_new->>'payment_status') then
      v_title:='تحديث حالة دفعة · Payment status updated';
      v_message:=format('تغيرت حالة دفعة العميل %s من %s إلى %s. · Payment status changed from %s to %s.',v_customer_name,coalesce(v_old->>'payment_status','—'),coalesce(v_new->>'payment_status','—'),coalesce(v_old->>'payment_status','—'),coalesce(v_new->>'payment_status','—'));
      v_type:='payment_status';
    else return new; end if;
    v_href:='/payments';
  elsif tg_table_name='treatments' then
    if tg_op='INSERT' then
      v_title:='إجراء جديد · New treatment';
      v_message:=format('تم إنشاء إجراء للعميل %s. · A treatment was created for %s.',v_customer_name,v_customer_name);
      v_type:='treatment_created';
    elsif (v_old->>'status') is distinct from (v_new->>'status') then
      v_title:='تحديث حالة إجراء · Treatment status updated';
      v_message:=format('تغيرت حالة إجراء العميل %s من %s إلى %s. · Treatment status changed from %s to %s.',v_customer_name,coalesce(v_old->>'status','—'),coalesce(v_new->>'status','—'),coalesce(v_old->>'status','—'),coalesce(v_new->>'status','—'));
      v_type:='treatment_status';
    else return new; end if;
    v_href:='/treatments';
  elsif tg_table_name='follow_ups' then
    if tg_op='INSERT' then
      v_title:='متابعة جديدة · New follow-up';
      v_message:=format('تمت جدولة متابعة للعميل %s. · A follow-up was scheduled for %s.',v_customer_name,v_customer_name);
      v_type:='follow_up_created';
    elsif (v_old->>'status') is distinct from (v_new->>'status') or (v_old->>'scheduled_at') is distinct from (v_new->>'scheduled_at') then
      v_title:='تحديث متابعة · Follow-up updated';
      v_message:=format('تم تحديث متابعة العميل %s. · The follow-up for %s was updated.',v_customer_name,v_customer_name);
      v_type:='follow_up_updated';
    else return new; end if;
    v_href:='/follow-ups';
  else return new; end if;

  insert into public.enterprise_notifications(clinic_id,branch_id,title,message,type,href)
  values(v_clinic_id,v_branch_id,v_title,v_message,v_type,v_href);
  return new;
end;
$$;

drop trigger if exists payments_staff_operational_notify on public.payments;
create trigger payments_staff_operational_notify after insert or update on public.payments
for each row execute function public.notify_staff_operational_event();

drop trigger if exists treatments_staff_operational_notify on public.treatments;
create trigger treatments_staff_operational_notify after insert or update on public.treatments
for each row execute function public.notify_staff_operational_event();

drop trigger if exists followups_staff_operational_notify on public.follow_ups;
create trigger followups_staff_operational_notify after insert or update on public.follow_ups
for each row execute function public.notify_staff_operational_event();

do $$
declare v_table text;
begin
  foreach v_table in array array['appointments','payments','treatments','follow_ups','enterprise_notifications','patient_appointment_requests','patient_push_deliveries'] loop
    if to_regclass('public.'||v_table) is not null and not exists(
      select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename=v_table
    ) then execute format('alter publication supabase_realtime add table public.%I',v_table); end if;
  end loop;
end $$;

commit;

create temp table if not exists zernio_release_audit(status text,check_name text,value bigint,expected bigint,details text);
truncate zernio_release_audit;

insert into zernio_release_audit
select case when count(*)=3 then 'OK' else 'CHECK' end,'approved_doctors',count(*),3,'Active approved doctors' from public.staff where lower(staff_name) in('dr fatima alsatouf','dr maram','dr fatima khaled') and coalesce(is_active,true)
union all select case when count(*)=3 then 'OK' else 'CHECK' end,'operational_notification_triggers',count(*),3,'Payments, treatments and follow-ups' from pg_trigger where not tgisinternal and tgname in('payments_staff_operational_notify','treatments_staff_operational_notify','followups_staff_operational_notify')
union all select case when count(*)=2 then 'OK' else 'CHECK' end,'completed_billing_triggers',count(*),2,'Appointment completion creates billing work and payment resolves it' from pg_trigger where not tgisinternal and tgname in('appointments_invoice_due_notify','payments_invoice_due_resolve')
union all select case when count(*)=1 then 'OK' else 'CHECK' end,'appointment_integrity_trigger',count(*),1,'Booking constraints enforced in database' from pg_trigger where not tgisinternal and tgname='appointments_zernio_integrity'
union all select case when count(*)>=4 then 'OK' else 'CHECK' end,'core_staff_notification_triggers',count(*),4,'Appointment, patient request, message and customer events' from pg_trigger where not tgisinternal and tgname in('appointments_staff_event_notify','patient_requests_staff_event_notify','patient_messages_staff_event_notify','customers_staff_event_notify')
union all select case when count(*)=7 then 'OK' else 'CHECK' end,'realtime_operational_tables',count(*),7,'All operational screens refresh automatically' from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename in('appointments','payments','treatments','follow_ups','enterprise_notifications','patient_appointment_requests','patient_push_deliveries')
union all select case when count(*)=0 then 'OK' else 'CHECK' end,'appointment_customer_scope_mismatch',count(*),0,'Must be zero' from appointments a join customers c on c.id=a.customer_id where (a.clinic_id,a.branch_id) is distinct from (c.clinic_id,c.branch_id)
union all select case when count(*)=0 then 'OK' else 'CHECK' end,'payment_customer_scope_mismatch',count(*),0,'Must be zero' from payments p join customers c on c.id=p.customer_id where (p.clinic_id,p.branch_id) is distinct from (c.clinic_id,c.branch_id)
union all select case when count(*)=0 then 'OK' else 'CHECK' end,'treatment_customer_scope_mismatch',count(*),0,'Must be zero' from treatments t join customers c on c.id=t.customer_id where (t.clinic_id,t.branch_id) is distinct from (c.clinic_id,c.branch_id)
union all select case when count(*)=0 then 'OK' else 'CHECK' end,'negative_financial_amounts',count(*),0,'Must be zero' from payments where coalesce(amount,0)<0 or coalesce(tax_amount,0)<0
union all select case when count(*)=0 then 'OK' else 'CHECK' end,'orphan_treatment_items',count(*),0,'Must be zero' from treatment_items i left join treatment_sessions s on s.id=i.session_id where s.id is null
union all select 'INFO','completed_appointments_awaiting_invoice',count(*),null,'Work queue, not an integrity error' from appointments a where lower(coalesce(a.status,''))='completed' and not exists(select 1 from payments p where p.appointment_id=a.id and lower(coalesce(p.payment_status,'')) not in('cancelled','refunded'));

do $$ declare v bigint;
begin
  if to_regclass('cron.job') is null then insert into zernio_release_audit values('CHECK','push_dispatch_cron',0,1,'pg_cron unavailable');
  else execute 'select count(*) from cron.job where jobname=''zernio-patient-push-dispatch'' and active' into v; insert into zernio_release_audit values(case when v=1 then 'OK' else 'CHECK' end,'push_dispatch_cron',v,1,'Push dispatcher every minute'); end if;
  if to_regclass('vault.decrypted_secrets') is null then insert into zernio_release_audit values('CHECK','push_dispatch_secret',0,1,'Vault unavailable');
  else execute 'select count(*) from vault.decrypted_secrets where name=''push_dispatch_secret'' and length(coalesce(decrypted_secret,''''))>=32' into v; insert into zernio_release_audit values(case when v=1 then 'OK' else 'CHECK' end,'push_dispatch_secret',v,1,'Database and function secret must match'); end if;
  if exists(select 1 from information_schema.columns where table_schema='public' and table_name='services' and column_name='name_ar') then
    execute 'select count(*) from services where coalesce(is_active,true) and (nullif(trim(name_ar),'''') is null or nullif(trim(category_ar),'''') is null)' into v;
    insert into zernio_release_audit values(case when v=0 then 'OK' else 'CHECK' end,'active_services_missing_arabic',v,0,'Every active service and category must be bilingual');
  else insert into zernio_release_audit values('CHECK','active_services_missing_arabic',1,0,'Bilingual columns are missing'); end if;
  if exists(select 1 from information_schema.columns where table_schema='public' and table_name='service_variants' and column_name='name_ar') then
    execute 'select count(*) from service_variants where coalesce(is_active,true) and nullif(trim(name_ar),'''') is null' into v;
    insert into zernio_release_audit values(case when v=0 then 'OK' else 'CHECK' end,'active_materials_missing_arabic',v,0,'Every active material must be bilingual');
  else insert into zernio_release_audit values('CHECK','active_materials_missing_arabic',1,0,'Bilingual columns are missing'); end if;
end $$;

select status,check_name,value,expected,details from zernio_release_audit
order by case status when 'CHECK' then 0 when 'INFO' then 1 else 2 end,check_name;
