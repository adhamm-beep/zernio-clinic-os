begin;

create or replace function public.record_user_activity(event_type text,event_path text,event_label text)
returns void
language plpgsql
security definer
set search_path=public
as $$
declare cid bigint; sid bigint;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if event_type not in ('page_view','click') then raise exception 'unsupported activity'; end if;
  if event_path is null or event_path!~'^/' or length(event_path)>300 then raise exception 'invalid path'; end if;
  if event_label is null or btrim(event_label)='' or length(event_label)>160 then raise exception 'invalid label'; end if;
  cid:=public.current_clinic_id(); sid:=public.current_staff_id();
  if cid is null or sid is null then raise exception 'staff access required'; end if;
  insert into public.enterprise_audit_log(clinic_id,actor_staff_id,action,entity_type,summary,metadata)
  values(cid,sid,event_type,'user_activity',
    case when event_type='page_view' then 'Opened page' else 'Clicked control' end,
    jsonb_build_object('path',event_path,'label',left(event_label,160)));
end;
$$;

revoke all on function public.record_user_activity(text,text,text) from public;
grant execute on function public.record_user_activity(text,text,text) to authenticated;

commit;
