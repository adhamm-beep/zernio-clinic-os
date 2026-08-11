select case when d.status='sent' then 'OK' else 'CHECK' end status,
  n.customer_id,n.id notification_id,d.status,d.attempts,d.provider_ticket_id,d.error_message,d.sent_at
from public.patient_notifications n
join public.patient_push_deliveries d on d.notification_id=n.id
where n.notification_type='push_activation'
order by n.created_at desc limit 1;
