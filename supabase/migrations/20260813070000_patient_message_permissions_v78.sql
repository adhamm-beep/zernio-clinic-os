begin;
insert into public.hr_permissions(code,name,module) values('messages.view','View patient messages','Patient messages'),('messages.reply','Reply to patient messages','Patient messages'),('messages.manage','Manage patient message inbox','Patient messages') on conflict(code) do update set name=excluded.name,module=excluded.module;
insert into public.hr_role_permissions(role_id,permission_id) select r.id,p.id from public.hr_roles r cross join public.hr_permissions p where r.name='Admin' and p.code in('messages.view','messages.reply','messages.manage') on conflict do nothing;
drop policy if exists patient_messages_access on public.patient_messages;
drop policy if exists patient_messages_staff_manage on public.patient_messages;
drop policy if exists patient_messages_scoped_read on public.patient_messages;
drop policy if exists patient_messages_scoped_update on public.patient_messages;
create policy patient_messages_scoped_read on public.patient_messages for select to authenticated using(customer_id=public.current_patient_customer_id() or(clinic_id=public.current_clinic_id() and public.has_any_hr_permission(array['messages.view','messages.reply','messages.manage'])));
create policy patient_messages_scoped_update on public.patient_messages for update to authenticated using(clinic_id=public.current_clinic_id() and public.has_any_hr_permission(array['messages.reply','messages.manage'])) with check(clinic_id=public.current_clinic_id() and public.has_any_hr_permission(array['messages.reply','messages.manage']));
create or replace function public.staff_reply_to_patient(p_customer_id bigint,p_message text,p_category text default 'general',p_appointment_id bigint default null)
returns bigint language plpgsql security definer set search_path=public as $$
declare v_staff_id bigint:=public.current_staff_id();v_clinic_id bigint;v_branch_id bigint;v_id bigint;
begin
  if v_staff_id is null or not public.has_any_hr_permission(array['messages.reply','messages.manage']) then raise exception 'Patient message reply permission required'; end if;
  if length(trim(coalesce(p_message,''))) not between 1 and 2000 then raise exception 'Message is empty or too long'; end if;
  select clinic_id,branch_id into v_clinic_id,v_branch_id from customers where id=p_customer_id and clinic_id=public.current_clinic_id();
  if v_clinic_id is null then raise exception 'Patient not found';end if;
  insert into patient_messages(clinic_id,branch_id,customer_id,appointment_id,sender_type,sender_staff_id,message,category) values(v_clinic_id,v_branch_id,p_customer_id,p_appointment_id,'staff',v_staff_id,trim(p_message),p_category) returning id into v_id;
  return v_id;
end;$$;
commit;
