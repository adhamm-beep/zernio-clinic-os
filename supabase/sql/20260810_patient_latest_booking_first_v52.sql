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
        'id',a.id,'createdAt',a.created_at,'status',a.status,
        'appointmentAt',a.appointment_at,'service',s.name,'provider',st.staff_name
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

create or replace function public.patient_mobile_dashboard()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer_id bigint := public.current_patient_customer_id();
  result jsonb;
begin
  if v_customer_id is null then raise exception 'Patient account is not linked'; end if;
  update public.patient_accounts set last_seen_at=now() where auth_user_id=auth.uid();

  select jsonb_build_object(
    'profile', jsonb_build_object(
      'id',c.id,'firstName',c.first_name,'lastName',c.last_name,
      'phone',c.phone,'email',c.email,'customerCode',c.customer_code,
      'clinicId',c.clinic_id,'branchId',c.branch_id
    ),
    'appointments',coalesce((select jsonb_agg(jsonb_build_object(
      'id',a.id,'createdAt',a.created_at,
      'service',coalesce(s.name_en,s.name),
      'serviceEn',coalesce(s.name_en,s.name),
      'serviceAr',coalesce(s.name_ar,s.name),
      'provider',coalesce(st.staff_name_en,st.staff_name,d.name,r.name),
      'providerEn',coalesce(st.staff_name_en,st.staff_name,d.name,r.name),
      'providerAr',coalesce(st.staff_name_ar,st.staff_name,d.name,r.name),
      'appointmentAt',a.appointment_at,'status',a.status,'room',r.name
    ) order by a.created_at desc,a.id desc)
      from public.appointments a
      left join public.services s on s.id=a.service_id
      left join public.staff st on st.id=a.doctor_id
      left join public.devices d on d.id=a.device_id
      left join public.rooms r on r.id=a.room_id
      where a.customer_id=v_customer_id),'[]'::jsonb),
    'invoices',coalesce((select jsonb_agg(jsonb_build_object(
      'id',p.id,'invoiceNumber',p.invoice_number,'amount',p.amount,
      'status',p.payment_status,'date',coalesce(p.payment_date,p.created_at)
    ) order by p.created_at desc) from public.payments p where p.customer_id=v_customer_id),'[]'::jsonb),
    'medicalRecord',(select to_jsonb(m)-'customer_id'-'clinic_id'-'branch_id' from public.medical_records m where m.customer_id=v_customer_id),
    'notifications',coalesce((select jsonb_agg(to_jsonb(n) order by n.created_at desc) from public.patient_notifications n where n.customer_id=v_customer_id),'[]'::jsonb)
  ) into result from public.customers c where c.id=v_customer_id;
  return result;
end;
$$;

revoke all on function public.patient_mobile_dashboard() from public;
grant execute on function public.patient_mobile_dashboard() to authenticated;

commit;

select 'patient_latest_booking_first_ready' as status;
