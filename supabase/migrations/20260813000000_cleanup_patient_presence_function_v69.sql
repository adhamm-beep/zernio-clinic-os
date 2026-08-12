begin;

create or replace function public.patient_app_heartbeat(p_device_id text,p_session_key text,p_state text default 'active',p_platform text default null,p_app_version text default null)
returns void language plpgsql security definer set search_path=public as $$
declare v_customer_id bigint:=public.current_patient_customer_id();v_clinic_id bigint;v_branch_id bigint;
begin
 if v_customer_id is null then raise exception 'Patient account required';end if;
 if nullif(trim(p_device_id),'') is null or nullif(trim(p_session_key),'') is null then raise exception 'Device and session are required';end if;
 select clinic_id,branch_id into v_clinic_id,v_branch_id from patient_accounts where customer_id=v_customer_id and is_active=true;
 insert into patient_app_sessions(customer_id,clinic_id,branch_id,device_id,session_key,platform,app_version,opened_at,last_seen_at,closed_at)
 values(v_customer_id,v_clinic_id,v_branch_id,left(p_device_id,120),left(p_session_key,160),left(p_platform,30),left(p_app_version,30),now(),now(),case when p_state='active' then null else now() end)
 on conflict(session_key) do update set last_seen_at=now(),closed_at=case when p_state='active' then null else now() end;
 insert into patient_app_presence(customer_id,clinic_id,branch_id,device_id,session_key,platform,app_version,app_state,first_seen_at,last_opened_at,last_seen_at,last_closed_at,total_opens)
 values(v_customer_id,v_clinic_id,v_branch_id,left(p_device_id,120),left(p_session_key,160),left(p_platform,30),left(p_app_version,30),case when p_state in('active','background','inactive') then p_state else 'inactive' end,now(),now(),now(),case when p_state='active' then null else now() end,1)
 on conflict(customer_id,device_id) do update set session_key=excluded.session_key,platform=excluded.platform,app_version=excluded.app_version,app_state=excluded.app_state,last_seen_at=now(),last_closed_at=excluded.last_closed_at,last_opened_at=case when patient_app_presence.session_key<>excluded.session_key then now() else patient_app_presence.last_opened_at end,total_opens=patient_app_presence.total_opens+case when patient_app_presence.session_key<>excluded.session_key then 1 else 0 end;
 update patient_accounts set last_seen_at=now() where customer_id=v_customer_id;
end$$;

commit;
