begin;
create or replace function public.notify_completed_appointment_billing() returns trigger language plpgsql security definer set search_path=public as $$
declare v_name text;v_service text;v_href text;
begin
 if tg_table_name='appointments' then
  if lower(coalesce(new.status,''))<>'completed' or lower(coalesce(old.status,''))='completed' then return new;end if;
  if exists(select 1 from payments p where p.appointment_id=new.id and lower(coalesce(p.payment_status,'')) not in('cancelled','refunded')) then return new;end if;
  select concat_ws(' ',c.first_name,c.last_name),s.name into v_name,v_service from customers c left join services s on s.id=new.service_id where c.id=new.customer_id;v_href:='/payments?appointment='||new.id;
  if not exists(select 1 from enterprise_notifications where type='invoice_due' and href=v_href and not is_read) then insert into enterprise_notifications(clinic_id,branch_id,title,message,type,href) values(new.clinic_id,new.branch_id,'فاتورة مطلوبة · Invoice required',format('اكتمل إجراء %s للعميل %s ويجب إصدار الفاتورة. · %s for %s is complete and requires an invoice.',coalesce(v_service,'العيادة'),coalesce(v_name,'عميل'),coalesce(v_service,'Clinic service'),coalesce(v_name,'customer')),'invoice_due',v_href);end if;
 elsif tg_table_name='payments' and new.appointment_id is not null and lower(coalesce(new.payment_status,'')) not in('cancelled','refunded') then update enterprise_notifications set is_read=true where type='invoice_due' and href='/payments?appointment='||new.appointment_id and not is_read;
 end if;return new;
end;$$;
drop trigger if exists appointments_invoice_due_notify on public.appointments;create trigger appointments_invoice_due_notify after update of status on public.appointments for each row execute function public.notify_completed_appointment_billing();
drop trigger if exists payments_invoice_due_resolve on public.payments;create trigger payments_invoice_due_resolve after insert or update on public.payments for each row execute function public.notify_completed_appointment_billing();
commit;
with trigger_check as(select count(*)::bigint value from pg_trigger where tgname in('appointments_invoice_due_notify','payments_invoice_due_resolve')and not tgisinternal)
select case when value=2 then'OK'else'CHECK'end status,'completed_billing_triggers' check_name,value,2::bigint expected from trigger_check
union all
select 'INFO','pending_invoice_work_items',count(*)::bigint,null::bigint from appointments a where lower(coalesce(a.status,''))='completed'and not exists(select 1 from payments p where p.appointment_id=a.id and lower(coalesce(p.payment_status,''))not in('cancelled','refunded'));
