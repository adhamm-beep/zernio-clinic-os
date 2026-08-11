-- Patient notification routing and one review request per completed visit.
-- Safe to run more than once.
begin;

alter table public.patient_notifications
  add column if not exists entity_type text,
  add column if not exists entity_id bigint,
  add column if not exists action_tab text;

update public.patient_notifications
set action_tab = case
  when notification_type in ('appointment','appointment_status','appointment_reminder_24h','appointment_reminder_2h','visit_review') then
    case when notification_type='visit_review' then 'experience' else 'appointments' end
  when notification_type in ('payment','invoice','payment_due','refund') then 'wallet'
  when notification_type in ('medical','medical_update','treatment','aftercare','care_plan','staff_care') then 'care'
  when notification_type in ('membership','loyalty') then 'membership'
  when notification_type in ('result','progress') then 'results'
  else coalesce(action_tab,'notifications')
end
where action_tab is null;

create index if not exists patient_notifications_route_idx
  on public.patient_notifications(customer_id,action_tab,created_at desc);

create unique index if not exists patient_visit_review_once_idx
  on public.patient_notifications(customer_id,entity_type,entity_id)
  where notification_type='visit_review'
    and entity_type='appointment'
    and entity_id is not null;

create or replace function public.patient_completed_visit_review_notification()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  if lower(coalesce(new.status,''))='completed'
     and (tg_op='INSERT' or lower(coalesce(old.status,''))<>'completed') then
    insert into public.patient_notifications(
      customer_id,title,message,notification_type,is_read,
      title_en,title_ar,message_en,message_ar,
      entity_type,entity_id,action_tab
    )
    select new.customer_id,
      'How was your visit?',
      'Your visit is complete. Share your experience with Panthera Clinics.',
      'visit_review',false,
      'How was your visit?','كيف كانت زيارتك؟',
      'Your visit is complete. Share your experience with Panthera Clinics.',
      'اكتملت زيارتك. شاركينا تجربتك مع عيادات بانثيرا.',
      'appointment',new.id,'experience'
    where new.customer_id is not null
      and not exists(
        select 1 from public.patient_notifications n
        where n.customer_id=new.customer_id
          and n.notification_type='visit_review'
          and n.entity_type='appointment'
          and n.entity_id=new.id
      );
  end if;
  return new;
end;
$$;

drop trigger if exists patient_completed_visit_review_notification_trigger on public.appointments;
create trigger patient_completed_visit_review_notification_trigger
after insert or update of status on public.appointments
for each row execute function public.patient_completed_visit_review_notification();

-- Backfill one review request for completed visits that do not already have one.
insert into public.patient_notifications(
  customer_id,title,message,notification_type,is_read,
  title_en,title_ar,message_en,message_ar,
  entity_type,entity_id,action_tab
)
select a.customer_id,
  'How was your visit?',
  'Your visit is complete. Share your experience with Panthera Clinics.',
  'visit_review',false,
  'How was your visit?','كيف كانت زيارتك؟',
  'Your visit is complete. Share your experience with Panthera Clinics.',
  'اكتملت زيارتك. شاركينا تجربتك مع عيادات بانثيرا.',
  'appointment',a.id,'experience'
from public.appointments a
where lower(coalesce(a.status,''))='completed'
  and a.customer_id is not null
  and not exists(
    select 1 from public.patient_notifications n
    where n.customer_id=a.customer_id
      and n.notification_type='visit_review'
      and n.entity_type='appointment'
      and n.entity_id=a.id
  );

commit;

select 'OK' status,'notification_route_columns' check_name,
  count(*)::bigint value,3::bigint expected
from information_schema.columns
where table_schema='public' and table_name='patient_notifications'
  and column_name in('entity_type','entity_id','action_tab')
union all
select case when count(*)=1 then 'OK' else 'CHECK' end,
  'completed_visit_review_trigger',count(*)::bigint,1::bigint
from pg_trigger
where tgname='patient_completed_visit_review_notification_trigger' and not tgisinternal
union all
select case when count(*)=0 then 'OK' else 'CHECK' end,
  'duplicate_visit_review_notifications',count(*)::bigint,0::bigint
from(
  select customer_id,entity_id
  from public.patient_notifications
  where notification_type='visit_review' and entity_type='appointment'
  group by customer_id,entity_id having count(*)>1
)x;
