begin;

create or replace function public.create_automatic_treatment_follow_up()
returns trigger language plpgsql security definer set search_path=public as $$
declare settings_row public.clinic_operational_settings%rowtype;
declare appointment_row public.appointments%rowtype;
declare message_value text;
begin
  if new.status is distinct from 'completed' or old.status is not distinct from 'completed' then return new; end if;
  select * into settings_row from public.clinic_operational_settings where clinic_id=new.clinic_id;
  if settings_row.auto_create_follow_up is distinct from true then return new; end if;
  select * into appointment_row from public.appointments where id=new.appointment_id;
  if appointment_row.id is null then return new; end if;
  message_value:=replace(replace(coalesce(settings_row.follow_up_template,'نذكرك بموعد المتابعة يوم {{date}}.'),'{{clinic}}','Panthera'),'{{date}}',(current_date+7)::text);
  if not exists(select 1 from public.follow_ups where treatment_id=new.id and follow_up_type='post_treatment') then
    insert into public.follow_ups(clinic_id,branch_id,customer_id,appointment_id,treatment_id,channel,follow_up_type,scheduled_at,message_text,status)
    values(new.clinic_id,new.branch_id,appointment_row.customer_id,new.appointment_id,new.id,
      case when settings_row.whatsapp_enabled then 'whatsapp' when settings_row.sms_enabled then 'sms' else 'phone' end,
      'post_treatment',now()+interval '7 days',message_value,'pending');
  end if;
  return new;
end$$;

drop trigger if exists create_automatic_treatment_follow_up_trigger on public.treatments;
create trigger create_automatic_treatment_follow_up_trigger after update of status on public.treatments
for each row execute function public.create_automatic_treatment_follow_up();

commit;
