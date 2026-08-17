begin;

create or replace function public.enterprise_audit_redact(payload jsonb)
returns jsonb
language sql
immutable
set search_path=public
as $$
  select coalesce(payload,'{}'::jsonb)
    - array['password','password_hash','token','access_token','refresh_token','secret','api_key','gateway_payload'];
$$;

create or replace function public.enterprise_audit_trigger()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  old_data jsonb:=case when tg_op='INSERT' then '{}'::jsonb else public.enterprise_audit_redact(to_jsonb(old)) end;
  new_data jsonb:=case when tg_op='DELETE' then '{}'::jsonb else public.enterprise_audit_redact(to_jsonb(new)) end;
  row_data jsonb:=case when tg_op='DELETE' then old_data else new_data end;
  before_changes jsonb:='{}'::jsonb;
  after_changes jsonb:='{}'::jsonb;
  changed_keys text[]:='{}'::text[];
  item record;
  cid bigint;
  bid bigint;
  eid text;
begin
  if tg_op='UPDATE' then
    for item in
      select coalesce(o.key,n.key) as key,o.value as old_value,n.value as new_value
      from jsonb_each(old_data) o
      full join jsonb_each(new_data) n using(key)
      where o.value is distinct from n.value
    loop
      changed_keys:=array_append(changed_keys,item.key);
      before_changes:=before_changes||jsonb_build_object(item.key,item.old_value);
      after_changes:=after_changes||jsonb_build_object(item.key,item.new_value);
    end loop;
    if cardinality(changed_keys)=0 then return new; end if;
  elsif tg_op='INSERT' then
    after_changes:=new_data;
    changed_keys:=array(select jsonb_object_keys(new_data));
  else
    before_changes:=old_data;
    changed_keys:=array(select jsonb_object_keys(old_data));
  end if;

  cid:=coalesce(nullif(row_data->>'clinic_id','')::bigint,public.current_clinic_id());
  bid:=nullif(row_data->>'branch_id','')::bigint;
  eid:=coalesce(row_data->>'id',row_data->>'uuid',row_data->>'code');

  insert into public.enterprise_audit_log(
    clinic_id,branch_id,actor_staff_id,action,entity_type,entity_id,summary,metadata
  ) values(
    cid,bid,public.current_staff_id(),lower(tg_op),tg_table_name,eid,
    lower(tg_op)||' on '||tg_table_name,
    jsonb_build_object(
      'changed_fields',to_jsonb(changed_keys),
      'before',before_changes,
      'after',after_changes,
      'auth_user_id',auth.uid()
    )
  );
  return case when tg_op='DELETE' then old else new end;
end;
$$;

do $$
declare table_name text;
begin
  for table_name in
    select c.table_name
    from information_schema.columns c
    join information_schema.tables t on t.table_schema=c.table_schema and t.table_name=c.table_name
    where c.table_schema='public' and c.column_name='clinic_id' and t.table_type='BASE TABLE'
      and c.table_name not in('enterprise_audit_log','security_events','security_rate_limits')
  loop
    execute format('drop trigger if exists enterprise_audit_%1$s on public.%1$I',table_name);
    execute format('create trigger enterprise_audit_%1$s after insert or update or delete on public.%1$I for each row execute function public.enterprise_audit_trigger()',table_name);
  end loop;
end$$;

create index if not exists enterprise_audit_actor_created_idx
  on public.enterprise_audit_log(clinic_id,actor_staff_id,created_at desc);

commit;
