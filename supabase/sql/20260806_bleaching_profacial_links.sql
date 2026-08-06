begin;

do $$
declare
  v_clinic_id bigint;
  v_branch_id bigint;
begin
  select id into v_clinic_id from public.clinics where code='PANTHERA' limit 1;
  select id into v_branch_id from public.branches where clinic_id=v_clinic_id and code='MAIN' limit 1;
  if v_clinic_id is null or v_branch_id is null then raise exception 'Panthera clinic or MAIN branch was not found'; end if;

  insert into public.rooms(name,branch_id,room_type,is_active)
  select 'ProFacial Room',v_branch_id,'department',true
  where not exists(select 1 from public.rooms where branch_id=v_branch_id and lower(trim(name))='profacial room');

  update public.services set is_active=true,provider_type='department',price_starting_from=false
  where clinic_id=v_clinic_id and code in('P00107','P00106','P00301','P00302','P00303','P00304');

  update public.services s set name=x.name,default_price=x.price
  from(values
    ('P00304','ProFacial Royal with Zain Obaji',699::numeric),
    ('P00303','ProFacial Hair',499::numeric),
    ('P00302','ProFacial Underarms',499::numeric),
    ('P00301','ProFacial Face with Classic Mask',250::numeric)
  )x(code,name,price)
  where s.clinic_id=v_clinic_id and s.code=x.code;

  merge into public.service_prices target
  using(
    select v_clinic_id clinic_id,v_branch_id branch_id,s.id service_id,null::bigint staff_id,
      x.price,false is_starting_from,'department'::text price_type
    from(values
      ('P00107',150::numeric),('P00106',250::numeric),
      ('P00304',699::numeric),('P00303',499::numeric),
      ('P00302',499::numeric),('P00301',250::numeric)
    )x(code,price)
    join public.services s on s.clinic_id=v_clinic_id and s.code=x.code
  )source
  on target.clinic_id=source.clinic_id and target.branch_id=source.branch_id
    and target.service_id=source.service_id and target.staff_id is null
  when matched then update set price=source.price,is_starting_from=false,price_type='department',is_active=true
  when not matched then insert(clinic_id,branch_id,service_id,staff_id,price,is_starting_from,price_type,is_active)
    values(source.clinic_id,source.branch_id,source.service_id,null,source.price,false,'department',true);

  delete from public.service_devices sd using public.services s
  where sd.service_id=s.id and s.clinic_id=v_clinic_id and s.category in('Bleaching','ProFacial');

  insert into public.service_devices(service_id,device_id,is_required)
  select s.id,d.id,true from public.services s join public.devices d on d.clinic_id=s.clinic_id and d.code='PICOWAY'
  where s.clinic_id=v_clinic_id and s.category='Bleaching' and s.is_active
  on conflict(service_id,device_id) do update set is_required=true;
end $$;

select 'profacial_room' check_name,count(*) row_count from public.rooms r join public.branches b on b.id=r.branch_id
where b.clinic_id=1 and r.is_active and lower(trim(r.name))='profacial room'
union all select 'bleaching_services',count(*) from public.services where clinic_id=1 and is_active and category='Bleaching'
union all select 'bleaching_prices',count(*) from public.service_prices sp join public.services s on s.id=sp.service_id
where s.clinic_id=1 and s.is_active and s.category='Bleaching' and sp.is_active
union all select 'bleaching_picoway_links',count(*) from public.service_devices sd join public.services s on s.id=sd.service_id join public.devices d on d.id=sd.device_id
where s.clinic_id=1 and s.is_active and s.category='Bleaching' and d.code='PICOWAY'
union all select 'profacial_services',count(*) from public.services where clinic_id=1 and is_active and category='ProFacial'
union all select 'profacial_prices',count(*) from public.service_prices sp join public.services s on s.id=sp.service_id
where s.clinic_id=1 and s.is_active and s.category='ProFacial' and sp.is_active
union all select 'profacial_device_links',count(*) from public.service_devices sd join public.services s on s.id=sd.service_id
where s.clinic_id=1 and s.is_active and s.category='ProFacial';

commit;
