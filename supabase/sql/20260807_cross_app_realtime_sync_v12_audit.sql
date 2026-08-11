with required_triggers(trigger_name) as (
  values
    ('appointments_zernio_integrity'),
    ('appointments_notify_patient_status'),
    ('appointments_notify_patient_details'),
    ('payments_notify_patient'),
    ('treatment_sessions_notify_patient'),
    ('medical_update_request_notify_patient'),
    ('progress_media_notify_patient'),
    ('inventory_movement_stock_trigger'),
    ('treatment_item_inventory_trigger'),
    ('hr_shift_booking_sync_trigger'),
    ('marketing_lead_conversion_trigger')
), realtime_tables(table_name) as (
  values
    ('appointments'),('customers'),('follow_ups'),('medical_records'),('payments'),
    ('treatments'),('treatment_sessions'),('treatment_items'),('services'),
    ('staff'),('rooms'),('devices'),('inventory_products'),('inventory_movements'),
    ('marketing_campaigns'),('marketing_leads'),('marketing_messages'),
    ('marketing_source_costs'),('patient_notifications')
), checks as (
  select 'missing_required_triggers' check_name,
    (select count(*) from required_triggers r where not exists(select 1 from pg_trigger t where t.tgname=r.trigger_name and not t.tgisinternal))::bigint value,
    0::bigint expected
  union all
  select 'missing_realtime_tables',
    (select count(*) from realtime_tables r where to_regclass('public.'||r.table_name) is not null and not exists(select 1 from pg_publication_tables p where p.pubname='supabase_realtime' and p.schemaname='public' and p.tablename=r.table_name))::bigint,
    0::bigint
  union all select 'appointment_customer_scope_mismatch',count(*)::bigint,0::bigint from appointments a join customers c on c.id=a.customer_id where a.clinic_id is distinct from c.clinic_id or a.branch_id is distinct from c.branch_id
  union all select 'payment_customer_scope_mismatch',count(*)::bigint,0::bigint from payments p join customers c on c.id=p.customer_id where p.clinic_id is distinct from c.clinic_id or p.branch_id is distinct from c.branch_id
  union all select 'treatment_customer_scope_mismatch',count(*)::bigint,0::bigint from treatment_sessions t join customers c on c.id=t.customer_id where t.clinic_id is distinct from c.clinic_id or t.branch_id is distinct from c.branch_id
  union all select 'orphan_patient_notifications',count(*)::bigint,0::bigint from patient_notifications n left join customers c on c.id=n.customer_id where c.id is null
  union all select 'orphan_treatment_items',count(*)::bigint,0::bigint from treatment_items i left join treatment_sessions s on s.id=i.session_id where s.id is null
  union all select 'negative_payment_amounts',count(*)::bigint,0::bigint from payments where coalesce(amount,0)<0
  union all select 'negative_inventory_stock',count(*)::bigint,0::bigint from inventory_products where coalesce(current_stock,0)<0
  union all select 'friday_appointments',count(*)::bigint,0::bigint from appointments where extract(isodow from appointment_at at time zone 'Asia/Riyadh')=5 and lower(coalesce(status,'')) not in('cancelled','canceled')
  union all select 'room_time_conflicts',count(*)::bigint,0::bigint
    from appointments a join appointments b on a.id<b.id and a.room_id=b.room_id
    join services sa on sa.id=a.service_id join services sb on sb.id=b.service_id
    where a.room_id is not null and a.appointment_at<b.appointment_at+coalesce(sb.duration_minutes,30)*interval '1 minute' and b.appointment_at<a.appointment_at+coalesce(sa.duration_minutes,30)*interval '1 minute' and lower(coalesce(a.status,'')) not in('cancelled','canceled','no_show') and lower(coalesce(b.status,'')) not in('cancelled','canceled','no_show')
  union all select 'doctor_time_conflicts',count(*)::bigint,0::bigint
    from appointments a join appointments b on a.id<b.id and a.doctor_id=b.doctor_id
    join services sa on sa.id=a.service_id join services sb on sb.id=b.service_id
    where a.doctor_id is not null and a.appointment_at<b.appointment_at+coalesce(sb.duration_minutes,30)*interval '1 minute' and b.appointment_at<a.appointment_at+coalesce(sa.duration_minutes,30)*interval '1 minute' and lower(coalesce(a.status,'')) not in('cancelled','canceled','no_show') and lower(coalesce(b.status,'')) not in('cancelled','canceled','no_show')
  union all select 'device_time_conflicts',count(*)::bigint,0::bigint
    from appointments a join appointments b on a.id<b.id and a.device_id=b.device_id
    join services sa on sa.id=a.service_id join services sb on sb.id=b.service_id
    where a.device_id is not null and a.appointment_at<b.appointment_at+coalesce(sb.duration_minutes,30)*interval '1 minute' and b.appointment_at<a.appointment_at+coalesce(sa.duration_minutes,30)*interval '1 minute' and lower(coalesce(a.status,'')) not in('cancelled','canceled','no_show') and lower(coalesce(b.status,'')) not in('cancelled','canceled','no_show')
)
select case when value=expected then 'OK' else 'CHECK' end status,check_name,value,expected
from checks order by check_name;
