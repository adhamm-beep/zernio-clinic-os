-- Complete bilingual doctor names and patient notifications.
begin;

alter table public.staff add column if not exists staff_name_en text;
alter table public.staff add column if not exists staff_name_ar text;

update public.staff set
  staff_name_en=coalesce(nullif(staff_name_en,''),staff_name),
  staff_name_ar=coalesce(nullif(staff_name_ar,''),case lower(trim(staff_name))
    when 'dr fatima alsatouf' then 'د. فاطمة الصطوف'
    when 'dr maram' then 'د. مرام'
    when 'dr fatima khaled' then 'د. فاطمة خالد'
    else staff_name end);

create or replace function public.sync_bilingual_staff_name() returns trigger
language plpgsql set search_path=public as $$
begin
  new.staff_name_en:=coalesce(nullif(trim(new.staff_name_en),''),new.staff_name);
  new.staff_name_ar:=coalesce(nullif(trim(new.staff_name_ar),''),new.staff_name_en,new.staff_name);
  return new;
end$$;
drop trigger if exists staff_bilingual_name on public.staff;
create trigger staff_bilingual_name before insert or update on public.staff
for each row execute function public.sync_bilingual_staff_name();

alter table public.patient_accounts add column if not exists preferred_language text not null default 'en';
alter table public.patient_accounts drop constraint if exists patient_accounts_preferred_language_check;
alter table public.patient_accounts add constraint patient_accounts_preferred_language_check check(preferred_language in('ar','en'));

alter table public.patient_notifications add column if not exists title_en text;
alter table public.patient_notifications add column if not exists title_ar text;
alter table public.patient_notifications add column if not exists message_en text;
alter table public.patient_notifications add column if not exists message_ar text;

create or replace function public.sync_bilingual_patient_notification() returns trigger
language plpgsql set search_path=public as $$
begin
  new.title_en:=coalesce(nullif(new.title_en,''),new.title);
  new.message_en:=coalesce(nullif(new.message_en,''),new.message);
  new.title_ar:=coalesce(nullif(new.title_ar,''),case
    when new.notification_type in('appointment','appointment_requested') or lower(new.title) like '%request%' then 'تم استلام طلب الحجز'
    when new.notification_type='appointment_status' and lower(new.title) like '%confirm%' then 'تم تأكيد موعدك'
    when new.notification_type='appointment_status' and lower(new.title) like '%cancel%' then 'تم إلغاء الموعد'
    when new.notification_type='appointment_status' and lower(new.title) like '%complete%' then 'اكتملت الزيارة'
    when new.notification_type='appointment_24h' then 'موعدك غدًا'
    when new.notification_type='appointment_2h' then 'موعدك خلال ساعتين'
    when new.notification_type='push_activation' then 'إشعارات بانثيرا جاهزة'
    else 'تحديث جديد من عيادات بانثيرا' end);
  new.message_ar:=coalesce(nullif(new.message_ar,''),case
    when new.notification_type in('appointment','appointment_requested') then 'وصل طلبك إلى عيادات بانثيرا، وسيصلك إشعار فور تأكيده.'
    when new.notification_type='appointment_status' and lower(new.title) like '%confirm%' then 'تم قبول حجزك وتأكيد الموعد. ستجد التفاصيل في صفحة مواعيدي.'
    when new.notification_type='appointment_status' and lower(new.title) like '%cancel%' then 'تم تحديث حالة حجزك إلى ملغي. يمكنك حجز موعد جديد من التطبيق.'
    when new.notification_type='appointment_status' and lower(new.title) like '%complete%' then 'تم تسجيل زيارتك كمكتملة. نتمنى لك دوام الصحة.'
    when new.notification_type='appointment_24h' then 'تذكير: موعدك في عيادات بانثيرا غدًا. راجعي صفحة مواعيدي للتفاصيل.'
    when new.notification_type='appointment_2h' then 'تذكير: يتبقى ساعتان على موعدك في عيادات بانثيرا.'
    when new.notification_type='push_activation' then 'ستصلك الآن تحديثات المواعيد والعناية بأمان.'
    else new.message end);
  return new;
end$$;
drop trigger if exists patient_notification_bilingual_fields on public.patient_notifications;
create trigger patient_notification_bilingual_fields before insert or update on public.patient_notifications
for each row execute function public.sync_bilingual_patient_notification();

update public.patient_notifications set title_en=title,message_en=message,title_ar=null,message_ar=null;

create or replace function public.patient_set_language(p_language text) returns void
language plpgsql security definer set search_path=public as $$
begin
  if p_language not in('ar','en') then raise exception 'Unsupported language'; end if;
  update public.patient_accounts set preferred_language=p_language,last_seen_at=now() where auth_user_id=auth.uid();
  if not found then raise exception 'Patient account is not linked'; end if;
end$$;
revoke all on function public.patient_set_language(text) from public,anon;
grant execute on function public.patient_set_language(text) to authenticated;

create or replace function public.patient_booking_providers_localized(p_locale text default 'en')
returns table(id bigint,name text,role text)
language sql stable security definer set search_path=public as $$
select q.provider_id,q.provider_name,q.provider_role from(
 select st.id::bigint,case when p_locale='ar' then coalesce(st.staff_name_ar,st.staff_name) else coalesce(st.staff_name_en,st.staff_name) end,'doctor'::text
 from public.staff st where st.is_active and lower(coalesce(st.role,''))='doctor'
 and exists(select 1 from public.staff_services ss where ss.staff_id=st.id and ss.is_active)
 union all select -101,case when p_locale='ar' then 'إزالة الشعر بالليزر' else 'Laser Hair Removal' end,'department' where exists(select 1 from public.services where is_active and provider_type='department' and category='Laser Hair Removal')
 union all select -102,case when p_locale='ar' then 'البروفاشيال' else 'ProFacial' end,'department' where exists(select 1 from public.services where is_active and provider_type='department' and category='ProFacial')
 union all select -103,case when p_locale='ar' then 'التشقير' else 'Bleaching' end,'department' where exists(select 1 from public.services where is_active and provider_type='department' and category='Bleaching')
)q(provider_id,provider_name,provider_role) order by q.provider_role desc,q.provider_name$$;

create or replace function public.queue_patient_push_notification()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into patient_push_deliveries(notification_id,customer_id,expo_push_token,title,body)
  select new.id,new.customer_id,t.expo_push_token,
    case when coalesce(a.preferred_language,'en')='ar' then coalesce(new.title_ar,new.title) else coalesce(new.title_en,new.title) end,
    case when coalesce(a.preferred_language,'en')='ar' then coalesce(new.message_ar,new.message) else coalesce(new.message_en,new.message) end
  from patient_push_tokens t left join patient_accounts a on a.customer_id=t.customer_id
  where t.customer_id=new.customer_id and t.is_active
  on conflict(notification_id,expo_push_token) do nothing;
  return new;
end$$;

commit;
