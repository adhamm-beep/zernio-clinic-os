-- Patient mobile dashboard: return bilingual appointment data from the source.
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
      'id',a.id,
      'createdAt',a.created_at,
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
end
$$;

create or replace function public.patient_concierge_hub()
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_customer_id bigint:=public.current_patient_customer_id();
begin
  if v_customer_id is null then raise exception 'Patient account is not linked'; end if;
  return jsonb_build_object(
    'requests',coalesce((select jsonb_agg(jsonb_build_object('id',r.id,'appointmentId',r.appointment_id,'type',r.request_type,'preferredAt',r.preferred_at,'reason',r.reason,'status',r.status,'createdAt',r.created_at) order by r.created_at desc) from patient_appointment_requests r where r.customer_id=v_customer_id),'[]'::jsonb),
    'consents',coalesce((select jsonb_agg(jsonb_build_object('id',c.id,'appointmentId',c.appointment_id,'type',c.consent_type,'title',c.title,'body',c.body,'version',c.version,'status',c.status,'acceptedAt',c.accepted_at) order by c.created_at desc) from patient_consents c where c.customer_id=v_customer_id),'[]'::jsonb),
    'messages',coalesce((select jsonb_agg(jsonb_build_object('id',m.id,'appointmentId',m.appointment_id,'sender',m.sender_type,'message',m.message,'category',m.category,'requiresReply',m.requires_reply,'isRead',m.is_read,'createdAt',m.created_at) order by m.created_at desc) from patient_messages m where m.customer_id=v_customer_id),'[]'::jsonb),
    'packages',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'name',p.package_name,'totalSessions',p.total_sessions,'usedSessions',p.used_sessions,'amountPaid',p.amount_paid,'status',p.status,'startsAt',p.starts_at,'expiresAt',p.expires_at,'service',coalesce(s.name_en,s.name)) order by p.created_at desc) from patient_packages p left join services s on s.id=p.service_id where p.customer_id=v_customer_id),'[]'::jsonb),
    'upcomingAppointments',coalesce((select jsonb_agg(jsonb_build_object(
      'id',a.id,'date',a.appointment_at,'status',a.status,
      'service',coalesce(s.name_en,s.name),'serviceEn',coalesce(s.name_en,s.name),'serviceAr',coalesce(s.name_ar,s.name),
      'provider',coalesce(st.staff_name_en,st.staff_name),'providerEn',coalesce(st.staff_name_en,st.staff_name),'providerAr',coalesce(st.staff_name_ar,st.staff_name)
    ) order by a.appointment_at) from appointments a left join services s on s.id=a.service_id left join staff st on st.id=a.doctor_id where a.customer_id=v_customer_id and a.appointment_at>=now() and lower(coalesce(a.status,'')) not in('cancelled','canceled','completed','no_show')),'[]'::jsonb)
  );
end;$$;

revoke all on function public.patient_mobile_dashboard() from public;
revoke all on function public.patient_concierge_hub() from public;
grant execute on function public.patient_mobile_dashboard() to authenticated;
grant execute on function public.patient_concierge_hub() to authenticated;

select 'patient_bilingual_dashboard_ready' as status;
