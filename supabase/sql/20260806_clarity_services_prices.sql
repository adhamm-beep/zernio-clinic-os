begin;

do $$
declare
  v_clinic_id bigint;
  v_branch_id bigint;
begin
  select id into v_clinic_id from public.clinics where code='PANTHERA' limit 1;
  select id into v_branch_id from public.branches where clinic_id=v_clinic_id and code='MAIN' limit 1;
  if v_clinic_id is null or v_branch_id is null then raise exception 'Panthera clinic or MAIN branch was not found'; end if;

  update public.services
  set is_active=false
  where clinic_id=v_clinic_id
    and (category in ('Laser Hair Removal','Laser') or lower(name) like '%hair removal%' or lower(name)='full body')
    and code not in ('P0015','P0014','P009','P007','P008','P0010','P0011','P0012','P006');

  insert into public.services
    (clinic_id,code,name,category,default_price,duration_minutes,is_active,provider_type,price_starting_from)
  select v_clinic_id,x.code,x.name,'Laser Hair Removal',x.price,30,true,'department',false
  from (values
    ('P0015','Shaving Services',100::numeric),
    ('P0014','Laser Head Cover',60::numeric),
    ('P009','Male Full Body Hair Removal',700::numeric),
    ('P007','Small Area Hair Removal',150::numeric),
    ('P008','Female Full Body Hair Removal',600::numeric),
    ('P0010','Female Full Body Hair Removal - Morning',500::numeric),
    ('P0011','Male One Area Hair Removal',400::numeric),
    ('P0012','Female Full Body Hair Removal - Evening',600::numeric),
    ('P006','Female One Area Hair Removal',300::numeric)
  )x(code,name,price)
  on conflict(clinic_id,code) do update set name=excluded.name,category=excluded.category,
    default_price=excluded.default_price,duration_minutes=30,is_active=true,provider_type='department',price_starting_from=false;

  merge into public.service_prices target
  using(
    select v_clinic_id clinic_id,v_branch_id branch_id,s.id service_id,null::bigint staff_id,
      x.price,false is_starting_from,'department'::text price_type
    from (values
      ('P0015',100::numeric),('P0014',60::numeric),('P009',700::numeric),
      ('P007',150::numeric),('P008',600::numeric),('P0010',500::numeric),
      ('P0011',400::numeric),('P0012',600::numeric),('P006',300::numeric)
    )x(code,price) join public.services s on s.clinic_id=v_clinic_id and s.code=x.code
  )source
  on target.clinic_id=source.clinic_id and target.branch_id=source.branch_id
    and target.service_id=source.service_id and target.staff_id is null
  when matched then update set price=source.price,is_starting_from=false,price_type='department',is_active=true
  when not matched then insert(clinic_id,branch_id,service_id,staff_id,price,is_starting_from,price_type,is_active)
    values(source.clinic_id,source.branch_id,source.service_id,null,source.price,false,'department',true);

  delete from public.service_devices sd using public.services s
  where sd.service_id=s.id and s.clinic_id=v_clinic_id and s.code in ('P0015','P0014','P009','P007','P008','P0010','P0011','P0012','P006');

  insert into public.service_devices(service_id,device_id,is_required)
  select s.id,d.id,true from public.services s cross join public.devices d
  where s.clinic_id=v_clinic_id and d.clinic_id=v_clinic_id
    and s.code in ('P0015','P0014','P009','P007','P008','P0010','P0011','P0012','P006')
    and d.code in ('CLARITY-II-1','CLARITY-II-2')
  on conflict(service_id,device_id) do update set is_required=true;
end $$;

select 'laser_services' check_name,count(*) row_count from public.services
where clinic_id=1 and is_active=true and category='Laser Hair Removal'
union all select 'laser_prices',count(*) from public.service_prices sp join public.services s on s.id=sp.service_id
where s.clinic_id=1 and s.is_active=true and s.category='Laser Hair Removal' and sp.is_active=true
union all select 'laser_device_links',count(*) from public.service_devices sd join public.services s on s.id=sd.service_id
where s.clinic_id=1 and s.is_active=true and s.category='Laser Hair Removal';

commit;
