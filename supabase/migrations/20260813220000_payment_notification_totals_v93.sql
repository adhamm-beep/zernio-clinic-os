begin;

create or replace function public.notify_staff_operational_event()
returns trigger language plpgsql security definer set search_path=public as $$
declare v_new jsonb:=case when tg_op='DELETE' then '{}'::jsonb else to_jsonb(new) end;v_old jsonb:=case when tg_op='INSERT' then '{}'::jsonb else to_jsonb(old) end;v_clinic_id bigint:=nullif(v_new->>'clinic_id','')::bigint;v_branch_id bigint:=nullif(v_new->>'branch_id','')::bigint;v_customer_id bigint:=nullif(v_new->>'customer_id','')::bigint;v_customer_name text;v_title text;v_message text;v_type text;v_href text;v_total numeric;
begin
 if v_clinic_id is null and v_customer_id is not null then select clinic_id,branch_id into v_clinic_id,v_branch_id from customers where id=v_customer_id;end if;if v_clinic_id is null then return new;end if;
 select nullif(trim(concat_ws(' ',first_name,last_name)),'') into v_customer_name from customers where id=v_customer_id;v_customer_name:=coalesce(v_customer_name,'#'||coalesce(v_customer_id::text,'—'));
 if tg_table_name='payments' then
   v_total:=coalesce(nullif(v_new->>'paid_amount','')::numeric,nullif(v_new->>'amount','')::numeric,0);
   if tg_op='INSERT' then v_title:='دفعة جديدة · New payment';v_message:=format('تم تسجيل دفعة بقيمة %s ر.س للعميل %s. · A payment of SAR %s was recorded for %s.',v_total,v_customer_name,v_total,v_customer_name);v_type:='payment_recorded';
   elsif(v_old->>'payment_status')is distinct from(v_new->>'payment_status')then v_title:='تحديث حالة دفعة · Payment status updated';v_message:=format('تغيرت حالة دفعة العميل %s من %s إلى %s. · Payment status changed from %s to %s.',v_customer_name,coalesce(v_old->>'payment_status','—'),coalesce(v_new->>'payment_status','—'),coalesce(v_old->>'payment_status','—'),coalesce(v_new->>'payment_status','—'));v_type:='payment_status';else return new;end if;v_href:='/payments';
 elsif tg_table_name='treatments'then if tg_op='INSERT'then v_title:='إجراء جديد · New treatment';v_message:=format('تم إنشاء إجراء للعميل %s. · A treatment was created for %s.',v_customer_name,v_customer_name);v_type:='treatment_created';elsif(v_old->>'status')is distinct from(v_new->>'status')then v_title:='تحديث حالة إجراء · Treatment status updated';v_message:=format('تغيرت حالة إجراء العميل %s من %s إلى %s. · Payment status changed.',v_customer_name,coalesce(v_old->>'status','—'),coalesce(v_new->>'status','—'));v_type:='treatment_status';else return new;end if;v_href:='/treatments';
 elsif tg_table_name='follow_ups'then if tg_op='INSERT'then v_title:='متابعة جديدة · New follow-up';v_message:=format('تمت جدولة متابعة للعميل %s.',v_customer_name);v_type:='follow_up_created';elsif(v_old->>'status')is distinct from(v_new->>'status')or(v_old->>'scheduled_at')is distinct from(v_new->>'scheduled_at')then v_title:='تحديث متابعة · Follow-up updated';v_message:=format('تم تحديث متابعة العميل %s.',v_customer_name);v_type:='follow_up_updated';else return new;end if;v_href:='/follow-ups';else return new;end if;
 insert into enterprise_notifications(clinic_id,branch_id,title,message,type,href)values(v_clinic_id,v_branch_id,v_title,v_message,v_type,v_href);return new;
end$$;

commit;
