begin;

create or replace function public.patient_completed_visit_review_notification()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  should_notify boolean := false;
begin
  if tg_op = 'INSERT' then
    should_notify := lower(coalesce(new.status, '')) = 'completed';
  elsif tg_op = 'UPDATE' then
    should_notify := lower(coalesce(new.status, '')) = 'completed'
      and lower(coalesce(old.status, '')) <> 'completed';
  end if;

  if should_notify then
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
      'اكتملت زيارتك. شاركنا تجربتك مع عيادات بانثيرا.',
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

create or replace function public.patient_completed_session_review_notification()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  should_notify boolean := false;
begin
  if tg_op = 'INSERT' then
    should_notify := lower(coalesce(new.status, '')) = 'completed';
  elsif tg_op = 'UPDATE' then
    should_notify := lower(coalesce(new.status, '')) = 'completed'
      and lower(coalesce(old.status, '')) <> 'completed';
  end if;

  if should_notify and new.appointment_id is null then
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
      'اكتملت جلستك. شاركنا تجربتك مع عيادات بانثيرا.',
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

commit;
