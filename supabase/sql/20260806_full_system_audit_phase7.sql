-- Read-only Zernio audit: Phases 1-7. Does not change data.
with checks as (
 select 'approved_doctors' check_name,count(*)::bigint issue_count,'expected 3' details from public.staff where is_active and lower(role) like '%doctor%'
 union all select 'friday_working_doctors',count(*)::bigint,'must be 0' from public.staff_working_hours w join public.staff s on s.id=w.staff_id where s.is_active and lower(s.role) like '%doctor%' and w.weekday=5 and w.is_working
 union all select 'doctor_schedule_rows',count(*)::bigint,'expected 18' from public.staff_working_hours w join public.staff s on s.id=w.staff_id where s.is_active and lower(s.role) like '%doctor%' and w.is_working
 union all select 'hr_booking_schedule_mismatch',count(*)::bigint,'must be 0' from public.hr_shifts h left join public.staff_working_hours w on w.staff_id=h.staff_id and w.weekday=h.weekday where w.staff_id is null or w.start_time<>h.start_time or w.end_time<>h.end_time or w.is_working<>h.is_working
 union all select 'active_staff_without_hr_role',count(*)::bigint,'must be 0' from public.staff s left join public.hr_staff_roles r on r.staff_id=s.id where s.is_active and r.staff_id is null
 union all select 'hr_roles_without_permissions',count(*)::bigint,'must be 0' from (select r.id from public.hr_roles r left join public.hr_role_permissions p on p.role_id=r.id group by r.id having count(p.permission_id)=0)x
 union all select 'negative_inventory_stock',count(*)::bigint,'must be 0' from public.inventory_products where current_stock<0
 union all select 'orphan_inventory_supplier',count(*)::bigint,'must be 0' from public.inventory_products p left join public.inventory_suppliers s on s.id=p.supplier_id where p.supplier_id is not null and s.id is null
 union all select 'orphan_inventory_movement',count(*)::bigint,'must be 0' from public.inventory_movements m left join public.inventory_products p on p.id=m.product_id where p.id is null
 union all select 'inventory_scope_mismatch',count(*)::bigint,'must be 0' from public.inventory_movements m join public.inventory_products p on p.id=m.product_id where m.clinic_id<>p.clinic_id or m.branch_id<>p.branch_id
 union all select 'duplicate_material_inventory_link',count(*)::bigint,'must be 0' from (select clinic_id,branch_id,service_variant_id from public.inventory_products where service_variant_id is not null group by 1,2,3 having count(*)>1)x
 union all select 'purchase_received_quantity_over_order',count(*)::bigint,'must be 0' from public.inventory_purchase_order_items where received_quantity>quantity
 union all select 'orphan_marketing_lead_campaign',count(*)::bigint,'must be 0' from public.marketing_leads l left join public.marketing_campaigns c on c.id=l.campaign_id where l.campaign_id is not null and c.id is null
 union all select 'marketing_lead_scope_mismatch',count(*)::bigint,'must be 0' from public.marketing_leads l join public.marketing_campaigns c on c.id=l.campaign_id where l.clinic_id<>c.clinic_id or l.branch_id<>c.branch_id
 union all select 'marketing_message_scope_mismatch',count(*)::bigint,'must be 0' from public.marketing_messages m join public.marketing_campaigns c on c.id=m.campaign_id where m.clinic_id<>c.clinic_id or m.branch_id<>c.branch_id
 union all select 'converted_lead_without_link',count(*)::bigint,'must be 0' from public.marketing_leads where status='converted' and customer_id is null and appointment_id is null
 union all select 'negative_marketing_spend',count(*)::bigint,'must be 0' from public.marketing_campaigns where spend<0 or budget<0
 union all select 'appointment_customer_scope_mismatch',count(*)::bigint,'must be 0' from public.appointments a join public.customers c on c.id=a.customer_id where a.clinic_id<>c.clinic_id or a.branch_id<>c.branch_id
 union all select 'treatment_customer_scope_mismatch',count(*)::bigint,'must be 0' from public.treatments t join public.customers c on c.id=t.customer_id where t.clinic_id<>c.clinic_id or t.branch_id<>c.branch_id
 union all select 'payment_customer_scope_mismatch',count(*)::bigint,'must be 0' from public.payments p join public.customers c on c.id=p.customer_id where p.clinic_id<>c.clinic_id or p.branch_id<>c.branch_id
 union all select 'orphan_service_variant',count(*)::bigint,'must be 0' from public.service_variants v left join public.services s on s.id=v.service_id where s.id is null
 union all select 'active_service_without_booking_route',count(*)::bigint,'must be 0' from public.services s where s.is_active and s.provider_type is distinct from 'department' and not exists(select 1 from public.staff_services ss where ss.service_id=s.id and ss.is_active)
 union all select 'appointment_integrity_trigger',count(*)::bigint,'expected 1' from pg_trigger where tgname='appointments_zernio_integrity' and not tgisinternal
 union all select 'inventory_stock_trigger',count(*)::bigint,'expected 1' from pg_trigger where tgname='inventory_movement_stock_trigger' and not tgisinternal
 union all select 'treatment_inventory_trigger',count(*)::bigint,'expected 1' from pg_trigger where tgname='treatment_item_inventory_trigger' and not tgisinternal
 union all select 'hr_booking_sync_trigger',count(*)::bigint,'expected 1' from pg_trigger where tgname='hr_shift_booking_sync_trigger' and not tgisinternal
 union all select 'marketing_conversion_trigger',count(*)::bigint,'expected 1' from pg_trigger where tgname='marketing_lead_conversion_trigger' and not tgisinternal
)
select case
 when check_name='approved_doctors' and issue_count=3 then 'OK'
 when check_name='doctor_schedule_rows' and issue_count=18 then 'OK'
 when details='expected 1' and issue_count=1 then 'OK'
 when details='expected 3' and issue_count=3 then 'OK'
 when details='expected 18' and issue_count=18 then 'OK'
 when details='must be 0' and issue_count=0 then 'OK'
 else 'CHECK' end status,
 check_name,issue_count,details
from checks order by status desc,check_name;
