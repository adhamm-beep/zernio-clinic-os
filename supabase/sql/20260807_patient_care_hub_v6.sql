begin;

create or replace function public.patient_care_hub()
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_customer_id bigint := public.current_patient_customer_id();
  v_result jsonb;
begin
  if v_customer_id is null then raise exception 'Patient account is not linked'; end if;

  select jsonb_build_object(
    'activePlan',(
      select jsonb_build_object(
        'id',ts.id,'status',ts.status,'sessionDate',ts.session_date,'service',s.name,
        'doctor',st.staff_name,'assessment',ts.assessment,
        'treatmentPlan',ts.treatment_plan,'aftercare',ts.aftercare_instructions,
        'followupRequired',ts.followup_required,'followupDate',ts.followup_date
      ) from public.treatment_sessions ts
      left join public.staff st on st.id=ts.doctor_id
      left join public.appointments a on a.id=ts.appointment_id
      left join public.services s on s.id=a.service_id
      where ts.customer_id=v_customer_id
      order by ts.session_date desc limit 1
    ),
    'history',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',ts.id,'status',ts.status,'sessionDate',ts.session_date,'service',s.name,
        'doctor',st.staff_name,'assessment',ts.assessment,
        'aftercare',ts.aftercare_instructions,'followupDate',ts.followup_date
      ) order by ts.session_date desc)
      from public.treatment_sessions ts left join public.staff st on st.id=ts.doctor_id
      left join public.appointments a on a.id=ts.appointment_id
      left join public.services s on s.id=a.service_id
      where ts.customer_id=v_customer_id
    ),'[]'::jsonb),
    'appointmentTracking',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',a.id,'createdAt',a.created_at,'status',a.status,'appointmentAt',a.appointment_at,
        'service',s.name,'provider',st.staff_name
      ) order by a.created_at desc,a.id desc)
      from public.appointments a
      left join public.services s on s.id=a.service_id
      left join public.staff st on st.id=a.doctor_id
      where a.customer_id=v_customer_id
      and a.appointment_at>now()-interval '30 days'
    ),'[]'::jsonb)
  ) into v_result;
  return v_result;
end;
$$;

revoke all on function public.patient_care_hub() from public;
grant execute on function public.patient_care_hub() to authenticated;
commit;

select case when count(*)=1 then 'OK' else 'CHECK' end status,
 'patient_care_hub_function' check_name,count(*) value,1 expected
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname='patient_care_hub';
