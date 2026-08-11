-- Final operational integrity, notification routing, and one review request per care session.
-- Run after v45-v47. Safe to run more than once.
begin;

-- Keep this release migration self-contained when earlier notification
-- migrations were not executed in order.
alter table public.patient_notifications
  add column if not exists title_en text,
  add column if not exists title_ar text,
  add column if not exists message_en text,
  add column if not exists message_ar text,
  add column if not exists entity_type text,
  add column if not exists entity_id bigint,
  add column if not exists action_tab text;

create unique index if not exists patient_session_review_once_idx
  on public.patient_notifications(customer_id,entity_type,entity_id)
  where notification_type='visit_review'
    and entity_type='treatment_session'
    and entity_id is not null;

create or replace function public.patient_completed_session_review_notification()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  -- Appointments already create their own review request. This branch covers
  -- additional/walk-in treatment sessions which do not have an appointment.
  if lower(coalesce(new.status,''))='completed'
     and new.appointment_id is null
     and (tg_op='INSERT' or lower(coalesce(old.status,''))<>'completed') then
    insert into public.patient_notifications(
      customer_id,title,message,notification_type,is_read,
      title_en,title_ar,message_en,message_ar,
      entity_type,entity_id,action_tab
    )
    select new.customer_id,
      'How was your visit?',
      'Your care session is complete. Share your experience with Panthera Clinics.',
      'visit_review',false,
      'How was your visit?','كيف كانت زيارتك؟',
      'Your care session is complete. Share your experience with Panthera Clinics.',
      'اكتملت جلستك. شاركينا تجربتك مع عيادات بانثيرا.',
      'treatment_session',new.id,'experience'
    where new.customer_id is not null
      and not exists(
        select 1 from public.patient_notifications n
        where n.customer_id=new.customer_id
          and n.notification_type='visit_review'
          and n.entity_type='treatment_session'
          and n.entity_id=new.id
      );
  end if;
  return new;
end;
$$;

drop trigger if exists patient_completed_session_review_notification_trigger on public.treatment_sessions;
create trigger patient_completed_session_review_notification_trigger
after insert or update of status on public.treatment_sessions
for each row execute function public.patient_completed_session_review_notification();

-- Repair route metadata on older notifications so every notification opens a useful screen.
update public.patient_notifications
set action_tab=case
  when notification_type in('visit_review','review','feedback') then 'experience'
  when notification_type like '%appointment%' or notification_type like '%booking%' then 'appointments'
  when notification_type like '%payment%' or notification_type like '%invoice%' then 'wallet'
  when notification_type like '%medical%' or notification_type like '%care%' or notification_type like '%treatment%' then 'care'
  when notification_type like '%message%' or notification_type like '%support%' then 'concierge'
  else 'notifications'
end
where action_tab is null or btrim(action_tab)='';

commit;

-- Read-only release audit. Every CHECK result must be fixed before production.
select case when count(*)=0 then 'OK' else 'CHECK' end status,
  'unbalanced_posted_journals' check_name,count(*)::bigint value,0::bigint expected,
  'Every posted journal must balance' details
from(
  select e.id from public.accounting_journal_entries e
  join public.accounting_journal_lines l on l.entry_id=e.id
  where e.status='posted'
  group by e.id having abs(sum(l.debit)-sum(l.credit))>.005
)x
union all
select case when count(*)=0 then 'OK' else 'CHECK' end,
  'negative_inventory_stock',count(*)::bigint,0::bigint,'Stock cannot be negative'
from public.inventory_products where coalesce(current_stock,0)<0
union all
select case when count(*)=0 then 'OK' else 'CHECK' end,
  'invoice_balance_mismatch',count(*)::bigint,0::bigint,'Balance equals total minus paid'
from public.payments where abs(coalesce(balance_due,0)-greatest(coalesce(amount,0)-coalesce(paid_amount,0),0))>.01
union all
select case when count(*)=0 then 'OK' else 'CHECK' end,
  'notifications_without_route',count(*)::bigint,0::bigint,'Every patient notification must open a destination'
from public.patient_notifications where action_tab is null or btrim(action_tab)=''
union all
select case when count(*)=0 then 'OK' else 'CHECK' end,
  'duplicate_appointment_reviews',count(*)::bigint,0::bigint,'One review notification per appointment'
from(
  select customer_id,entity_id from public.patient_notifications
  where notification_type='visit_review' and entity_type='appointment'
  group by customer_id,entity_id having count(*)>1
)x
union all
select case when count(*)=0 then 'OK' else 'CHECK' end,
  'duplicate_session_reviews',count(*)::bigint,0::bigint,'One review notification per standalone session'
from(
  select customer_id,entity_id from public.patient_notifications
  where notification_type='visit_review' and entity_type='treatment_session'
  group by customer_id,entity_id having count(*)>1
)x
union all
select case when count(*)=3 then 'OK' else 'CHECK' end,
  'required_accounting_triggers',count(*)::bigint,3::bigint,'Payments, inventory and marketing post to the ledger'
from pg_trigger where not tgisinternal and tgname in(
  'payments_accounting_post','accounting_inventory_movement_trigger','accounting_marketing_cost_trigger'
)
union all
select case when count(*)=2 then 'OK' else 'CHECK' end,
  'review_notification_triggers',count(*)::bigint,2::bigint,'Appointments and standalone sessions each generate one review request'
from pg_trigger where not tgisinternal and tgname in(
  'patient_completed_visit_review_notification_trigger','patient_completed_session_review_notification_trigger'
);
