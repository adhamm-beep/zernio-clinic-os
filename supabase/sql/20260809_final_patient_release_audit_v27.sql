create temp table if not exists zernio_final_audit(status text,check_name text,issue_count bigint,details text) on commit drop;
truncate zernio_final_audit;

insert into zernio_final_audit
select case when count(*)=3 then 'OK' else 'CHECK' end,'approved_doctors',abs(count(*)-3),format('found=%s expected=3',count(*)) from staff where lower(staff_name) in('dr fatima alsatouf','dr maram','dr fatima khaled') and coalesce(is_active,true)
union all select case when count(*)=1 then 'OK' else 'CHECK' end,'live_booking_function',abs(count(*)-1),format('found=%s expected=1',count(*)) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='patient_available_slots'
union all select case when count(*)=1 then 'OK' else 'CHECK' end,'new_patient_registration',abs(count(*)-1),format('found=%s expected=1',count(*)) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='patient_register_new_account'
union all select case when count(*)=1 then 'OK' else 'CHECK' end,'privacy_request_function',abs(count(*)-1),format('found=%s expected=1',count(*)) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='patient_submit_privacy_request'
union all select case when count(*)=1 then 'OK' else 'CHECK' end,'staff_membership_function',abs(count(*)-1),format('found=%s expected=1',count(*)) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='staff_customer_membership_summary'
union all select case when count(*)=1 then 'OK' else 'CHECK' end,'patient_contact_function',abs(count(*)-1),format('found=%s expected=1',count(*)) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='patient_clinic_contact'
union all select case when count(*)=1 then 'OK' else 'CHECK' end,'google_review_function',abs(count(*)-1),format('found=%s expected=1',count(*)) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='patient_google_review_destination'
union all select case when count(*)=0 then 'OK' else 'CHECK' end,'unsafe_true_patient_policies',count(*),'patient policies must be scoped' from pg_policies where schemaname='public' and tablename like 'patient_%' and coalesce(qual,'')='true';

do $$ declare v bigint;
begin
 if exists(select 1 from information_schema.columns where table_schema='public' and table_name='staff' and column_name='staff_name_ar') then
  execute 'select count(*) from staff where lower(staff_name) in(''dr fatima alsatouf'',''dr maram'',''dr fatima khaled'') and nullif(trim(staff_name_ar),'''') is not null and staff_name_ar<>staff_name' into v;
  insert into zernio_final_audit values(case when v=3 then 'OK' else 'CHECK' end,'doctor_arabic_names',abs(v-3),format('translated=%s expected=3',v));
 else insert into zernio_final_audit values('CHECK','doctor_arabic_names',3,'run v23'); end if;

 if to_regclass('public.clinic_public_profiles') is null then
  insert into zernio_final_audit values('CHECK','clinic_public_profiles',1,'run v25');
 else
  execute 'select count(*) from clinic_public_profiles where nullif(trim(support_phone),'''') is null' into v; insert into zernio_final_audit values(case when v=0 then 'OK' else 'CHECK' end,'support_phone_missing',v,'must be 0');
  execute 'select count(*) from clinic_public_profiles where nullif(trim(whatsapp_number),'''') is null' into v; insert into zernio_final_audit values(case when v=0 then 'OK' else 'CHECK' end,'whatsapp_missing',v,'must be 0');
  execute 'select count(*) from clinic_public_profiles where nullif(trim(support_email),'''') is null' into v; insert into zernio_final_audit values(case when v=0 then 'OK' else 'CHECK' end,'support_email_missing',v,'must be 0');
  execute 'select count(*) from clinic_public_profiles where nullif(trim(address_ar),'''') is null or nullif(trim(address_en),'''') is null' into v; insert into zernio_final_audit values(case when v=0 then 'OK' else 'CHECK' end,'bilingual_address_missing',v,'must be 0');
  if exists(select 1 from information_schema.columns where table_schema='public' and table_name='clinic_public_profiles' and column_name='google_review_url') then
   execute 'select count(*) from clinic_public_profiles where nullif(trim(google_review_url),'''') is null and nullif(trim(google_place_id),'''') is null' into v; insert into zernio_final_audit values(case when v=0 then 'OK' else 'CHECK' end,'google_review_link_missing',v,'must be 0');
  else insert into zernio_final_audit values('CHECK','google_review_columns',1,'run v26'); end if;
 end if;

 if to_regclass('public.patient_messages') is null then insert into zernio_final_audit values('CHECK','patient_messages',1,'concierge migration is missing');
 elsif not exists(select 1 from information_schema.columns where table_schema='public' and table_name='patient_messages' and column_name='metadata') then insert into zernio_final_audit values('CHECK','patient_message_metadata',1,'run v26');
 else insert into zernio_final_audit values('OK','patient_message_metadata',0,'ready'); end if;

 if to_regclass('cron.job') is not null then
  execute 'select count(*) from cron.job where jobname=''zernio-patient-push-dispatch'' and active' into v; insert into zernio_final_audit values(case when v=1 then 'OK' else 'CHECK' end,'push_dispatch_cron',abs(v-1),format('active jobs=%s expected=1',v));
 else insert into zernio_final_audit values('CHECK','push_dispatch_cron',1,'pg_cron is unavailable'); end if;

 if to_regclass('vault.decrypted_secrets') is not null then
  execute 'select count(*) from vault.decrypted_secrets where name=''push_dispatch_secret'' and length(coalesce(decrypted_secret,''''))>=32' into v; insert into zernio_final_audit values(case when v=1 then 'OK' else 'CHECK' end,'database_push_secret',abs(v-1),'must contain one non-empty secret');
 else insert into zernio_final_audit values('CHECK','database_push_secret',1,'Vault is unavailable'); end if;

 if to_regclass('public.patient_push_deliveries') is not null then
  execute 'select count(*) from patient_push_deliveries where status=''processing'' and created_at<now()-interval ''10 minutes''' into v; insert into zernio_final_audit values(case when v=0 then 'OK' else 'CHECK' end,'stale_push_deliveries',v,'must be 0');
 end if;
end $$;

select status,check_name,issue_count,details from zernio_final_audit order by case status when 'CHECK' then 0 else 1 end,check_name;
