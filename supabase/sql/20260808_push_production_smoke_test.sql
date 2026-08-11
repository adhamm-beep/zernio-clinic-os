-- Sends one real activation notification to the most recently registered patient device.
-- Safe to run once after installing and signing into the latest mobile build.
do $$
declare v_customer_id bigint;
begin
  select customer_id into v_customer_id
  from public.patient_push_tokens
  where is_active
  order by created_at desc
  limit 1;
  if v_customer_id is null then
    raise exception 'No active patient push token. Open the installed patient app, sign in, and allow notifications first.';
  end if;
  insert into public.patient_notifications(customer_id,title,message,notification_type)
  values(v_customer_id,'Panthera notifications are ready · إشعارات بانثيرا جاهزة','You will now receive secure appointment and care updates. · ستصلك الآن تحديثات المواعيد والعناية بأمان.','push_activation');
end$$;

select n.customer_id,n.id notification_id,d.id delivery_id,d.status,d.attempts,d.error_message,d.created_at,d.sent_at
from public.patient_notifications n
join public.patient_push_deliveries d on d.notification_id=n.id
where n.notification_type='push_activation'order by n.created_at desc limit 1;
