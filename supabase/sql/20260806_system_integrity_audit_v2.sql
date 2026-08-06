with ctx as (
  select c.id clinic_id,b.id branch_id from public.clinics c join public.branches b on b.clinic_id=c.id
  where c.code='PANTHERA' and b.code='MAIN' limit 1
), approved_doctors as (
  select s.* from public.staff s,ctx where s.clinic_id=ctx.clinic_id and s.is_active
  and lower(trim(s.staff_name)) in('dr fatima alsatouf','dr maram','dr fatima khaled')
), active_appointments as (
  select a.* from public.appointments a,ctx where a.clinic_id=ctx.clinic_id and a.branch_id=ctx.branch_id
  and a.status not in('cancelled','no_show')
), appointment_windows as (
  select a.*,a.appointment_at start_at,
    a.appointment_at+coalesce(s.duration_minutes,30)*interval '1 minute' end_at
  from active_appointments a left join public.services s on s.id=a.service_id
), checks as (
  select 'clinic_context_missing' check_name,(select count(*) from ctx)=0 is_problem,
    case when (select count(*) from ctx)=1 then 'OK' else 'Panthera / MAIN was not found' end details
  union all select 'approved_doctor_count',(select count(*) from approved_doctors)<>3,
    'found='||(select count(*) from approved_doctors)||', expected=3'
  union all select 'doctor_room_assignment',(select count(*) from approved_doctors d where (select count(*) from public.staff_rooms sr where sr.staff_id=d.id)<>2)>0,
    'doctors with room count other than 2='||(select count(*) from approved_doctors d where (select count(*) from public.staff_rooms sr where sr.staff_id=d.id)<>2)
  union all select 'doctor_working_schedule',(select count(*) from approved_doctors d where (select count(*) from public.staff_working_hours wh where wh.staff_id=d.id and wh.is_working and wh.start_time='14:00' and wh.end_time='22:00')<>6)>0,
    'doctors without six 2PM-10PM days='||(select count(*) from approved_doctors d where (select count(*) from public.staff_working_hours wh where wh.staff_id=d.id and wh.is_working and wh.start_time='14:00' and wh.end_time='22:00')<>6)
  union all select 'active_service_without_booking_route',(select count(*) from public.services s,ctx where s.clinic_id=ctx.clinic_id and s.is_active and not exists(select 1 from public.staff_services ss where ss.service_id=s.id and ss.is_active) and not(s.provider_type='department' and s.category in('Laser Hair Removal','Bleaching','ProFacial')))>0,
    'count='||(select count(*) from public.services s,ctx where s.clinic_id=ctx.clinic_id and s.is_active and not exists(select 1 from public.staff_services ss where ss.service_id=s.id and ss.is_active) and not(s.provider_type='department' and s.category in('Laser Hair Removal','Bleaching','ProFacial')))
  union all select 'doctor_service_without_material_price',(select count(*) from public.staff_services ss join approved_doctors d on d.id=ss.staff_id join public.services s on s.id=ss.service_id where ss.is_active and s.is_active and not exists(select 1 from public.service_variant_prices p join public.service_variants v on v.id=p.service_variant_id where p.staff_id=d.id and v.service_id=s.id and p.is_active and v.is_active))>0,
    'count='||(select count(*) from public.staff_services ss join approved_doctors d on d.id=ss.staff_id join public.services s on s.id=ss.service_id where ss.is_active and s.is_active and not exists(select 1 from public.service_variant_prices p join public.service_variants v on v.id=p.service_variant_id where p.staff_id=d.id and v.service_id=s.id and p.is_active and v.is_active))
  union all select 'variant_price_without_service_link',(select count(*) from public.service_variant_prices p join public.service_variants v on v.id=p.service_variant_id join approved_doctors d on d.id=p.staff_id where p.is_active and v.is_active and not exists(select 1 from public.staff_services ss where ss.staff_id=p.staff_id and ss.service_id=v.service_id and ss.is_active))>0,
    'count='||(select count(*) from public.service_variant_prices p join public.service_variants v on v.id=p.service_variant_id join approved_doctors d on d.id=p.staff_id where p.is_active and v.is_active and not exists(select 1 from public.staff_services ss where ss.staff_id=p.staff_id and ss.service_id=v.service_id and ss.is_active))
  union all select 'department_service_without_price',(select count(*) from public.services s,ctx where s.clinic_id=ctx.clinic_id and s.is_active and s.provider_type='department' and not exists(select 1 from public.service_prices p where p.service_id=s.id and p.is_active))>0,
    'count='||(select count(*) from public.services s,ctx where s.clinic_id=ctx.clinic_id and s.is_active and s.provider_type='department' and not exists(select 1 from public.service_prices p where p.service_id=s.id and p.is_active))
  union all select 'orphan_variant_price',(select count(*) from public.service_variant_prices p left join public.service_variants v on v.id=p.service_variant_id left join public.staff st on st.id=p.staff_id where v.id is null or st.id is null)>0,
    'count='||(select count(*) from public.service_variant_prices p left join public.service_variants v on v.id=p.service_variant_id left join public.staff st on st.id=p.staff_id where v.id is null or st.id is null)
  union all select 'service_variant_scope_mismatch',(select count(*) from public.service_variants v join public.services s on s.id=v.service_id where v.clinic_id<>s.clinic_id)>0,
    'count='||(select count(*) from public.service_variants v join public.services s on s.id=v.service_id where v.clinic_id<>s.clinic_id)
  union all select 'device_without_room',(select count(*) from public.devices d,ctx where d.clinic_id=ctx.clinic_id and d.is_active and d.room_id is null)>0,
    'count='||(select count(*) from public.devices d,ctx where d.clinic_id=ctx.clinic_id and d.is_active and d.room_id is null)
  union all select 'appointment_provider_service_mismatch',(select count(*) from active_appointments a join public.services s on s.id=a.service_id where (a.doctor_id is not null and not exists(select 1 from public.staff_services ss where ss.staff_id=a.doctor_id and ss.service_id=a.service_id and ss.is_active)) or (a.doctor_id is null and s.provider_type='doctor'))>0,
    'count='||(select count(*) from active_appointments a join public.services s on s.id=a.service_id where (a.doctor_id is not null and not exists(select 1 from public.staff_services ss where ss.staff_id=a.doctor_id and ss.service_id=a.service_id and ss.is_active)) or (a.doctor_id is null and s.provider_type='doctor'))
  union all select 'appointment_required_device_missing',(select count(*) from active_appointments a where exists(select 1 from public.service_devices sd where sd.service_id=a.service_id and sd.is_required) and a.device_id is null)>0,
    'count='||(select count(*) from active_appointments a where exists(select 1 from public.service_devices sd where sd.service_id=a.service_id and sd.is_required) and a.device_id is null)
  union all select 'appointment_device_service_mismatch',(select count(*) from active_appointments a where a.device_id is not null and not exists(select 1 from public.service_devices sd where sd.service_id=a.service_id and sd.device_id=a.device_id))>0,
    'count='||(select count(*) from active_appointments a where a.device_id is not null and not exists(select 1 from public.service_devices sd where sd.service_id=a.service_id and sd.device_id=a.device_id))
  union all select 'appointment_device_room_mismatch',(select count(*) from active_appointments a join public.devices d on d.id=a.device_id where d.room_id is distinct from a.room_id)>0,
    'count='||(select count(*) from active_appointments a join public.devices d on d.id=a.device_id where d.room_id is distinct from a.room_id)
  union all select 'appointment_doctor_room_mismatch',(select count(*) from active_appointments a where a.doctor_id is not null and a.device_id is null and not exists(select 1 from public.staff_rooms sr where sr.staff_id=a.doctor_id and sr.room_id=a.room_id))>0,
    'count='||(select count(*) from active_appointments a where a.doctor_id is not null and a.device_id is null and not exists(select 1 from public.staff_rooms sr where sr.staff_id=a.doctor_id and sr.room_id=a.room_id))
  union all select 'appointment_friday_or_outside_hours',(select count(*) from active_appointments a where extract(dow from a.appointment_at at time zone 'Asia/Riyadh')=5 or extract(hour from a.appointment_at at time zone 'Asia/Riyadh')<(case when a.doctor_id is null then 10 else 14 end) or extract(hour from a.appointment_at at time zone 'Asia/Riyadh')>=22)>0,
    'count='||(select count(*) from active_appointments a where extract(dow from a.appointment_at at time zone 'Asia/Riyadh')=5 or extract(hour from a.appointment_at at time zone 'Asia/Riyadh')<(case when a.doctor_id is null then 10 else 14 end) or extract(hour from a.appointment_at at time zone 'Asia/Riyadh')>=22)
  union all select 'doctor_time_conflict',(select count(*) from appointment_windows a join appointment_windows b on a.id<b.id and a.doctor_id=b.doctor_id and a.doctor_id is not null and a.start_at<b.end_at and b.start_at<a.end_at)>0,
    'count='||(select count(*) from appointment_windows a join appointment_windows b on a.id<b.id and a.doctor_id=b.doctor_id and a.doctor_id is not null and a.start_at<b.end_at and b.start_at<a.end_at)
  union all select 'room_time_conflict',(select count(*) from appointment_windows a join appointment_windows b on a.id<b.id and a.room_id=b.room_id and a.room_id is not null and a.start_at<b.end_at and b.start_at<a.end_at)>0,
    'count='||(select count(*) from appointment_windows a join appointment_windows b on a.id<b.id and a.room_id=b.room_id and a.room_id is not null and a.start_at<b.end_at and b.start_at<a.end_at)
  union all select 'device_time_conflict',(select count(*) from appointment_windows a join appointment_windows b on a.id<b.id and a.device_id=b.device_id and a.device_id is not null and a.start_at<b.end_at and b.start_at<a.end_at)>0,
    'count='||(select count(*) from appointment_windows a join appointment_windows b on a.id<b.id and a.device_id=b.device_id and a.device_id is not null and a.start_at<b.end_at and b.start_at<a.end_at)
  union all select 'treatment_item_service_variant_mismatch',(select count(*) from public.treatment_items i join public.service_variants v on v.id=i.service_variant_id where i.service_id is distinct from v.service_id)>0,
    'count='||(select count(*) from public.treatment_items i join public.service_variants v on v.id=i.service_variant_id where i.service_id is distinct from v.service_id)
  union all select 'treatment_item_total_mismatch',(select count(*) from public.treatment_items i where i.unit_price is not null and i.line_total is distinct from round(i.unit_price*coalesce(i.quantity,1),2))>0,
    'count='||(select count(*) from public.treatment_items i where i.unit_price is not null and i.line_total is distinct from round(i.unit_price*coalesce(i.quantity,1),2))
  union all select 'payment_customer_link_mismatch',(select count(*) from public.payments p left join public.appointments a on a.id=p.appointment_id left join public.treatments t on t.id=p.treatment_id where (a.id is not null and a.customer_id is distinct from p.customer_id) or (t.id is not null and t.customer_id is distinct from p.customer_id))>0,
    'count='||(select count(*) from public.payments p left join public.appointments a on a.id=p.appointment_id left join public.treatments t on t.id=p.treatment_id where (a.id is not null and a.customer_id is distinct from p.customer_id) or (t.id is not null and t.customer_id is distinct from p.customer_id))
)
select case when is_problem then 'ISSUE' else 'OK' end status,check_name,details from checks
order by is_problem desc,check_name;
