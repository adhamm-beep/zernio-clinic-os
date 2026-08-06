begin;

alter table public.devices add column if not exists room_id bigint;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'devices_room_id_fkey') then
    alter table public.devices add constraint devices_room_id_fkey
      foreign key (room_id) references public.rooms(id) on delete set null;
  end if;
end $$;

create table if not exists public.staff_rooms (
  staff_id bigint not null references public.staff(id) on delete cascade,
  room_id bigint not null references public.rooms(id) on delete cascade,
  primary key (staff_id, room_id)
);

create table if not exists public.staff_devices (
  staff_id bigint not null references public.staff(id) on delete cascade,
  device_id bigint not null references public.devices(id) on delete cascade,
  primary key (staff_id, device_id)
);

create table if not exists public.staff_working_hours (
  staff_id bigint not null references public.staff(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  is_working boolean not null default true,
  primary key (staff_id, weekday),
  check (end_time > start_time)
);

alter table public.staff_rooms enable row level security;
alter table public.staff_devices enable row level security;
alter table public.staff_working_hours enable row level security;

drop policy if exists "Authenticated users manage staff rooms" on public.staff_rooms;
create policy "Authenticated users manage staff rooms" on public.staff_rooms for all to authenticated using (true) with check (true);
drop policy if exists "Authenticated users manage staff devices" on public.staff_devices;
create policy "Authenticated users manage staff devices" on public.staff_devices for all to authenticated using (true) with check (true);
drop policy if exists "Authenticated users manage working hours" on public.staff_working_hours;
create policy "Authenticated users manage working hours" on public.staff_working_hours for all to authenticated using (true) with check (true);

do $$
declare
  v_clinic_id bigint;
  v_branch_id bigint;
  v_room_id bigint;
begin
  select id into v_clinic_id from public.clinics where code = 'PANTHERA' limit 1;
  select id into v_branch_id from public.branches where clinic_id = v_clinic_id and code = 'MAIN' limit 1;
  if v_clinic_id is null or v_branch_id is null then raise exception 'Panthera clinic or MAIN branch was not found'; end if;

  insert into public.rooms (name, branch_id, room_type, is_active)
  select x.name, v_branch_id, x.room_type, true
  from (values
    ('Clinic 1','doctor'),('Clinic 2','doctor'),('Clinic 3','doctor'),
    ('Clinic 4','doctor'),('Clinic 5','doctor'),('Clinic 6','doctor'),
    ('Laser 1','laser'),('Laser 2','laser'),
    ('Fraxis Room','device'),('PicoWay Room','device')
  ) x(name, room_type)
  where not exists (select 1 from public.rooms r where r.branch_id = v_branch_id and lower(r.name) = lower(x.name));

  delete from public.staff_rooms sr using public.staff s
  where sr.staff_id = s.id and s.clinic_id = v_clinic_id
    and lower(trim(s.staff_name)) in ('dr fatima alsatouf','dr maram','dr fatima khaled');

  insert into public.staff_rooms (staff_id, room_id)
  select s.id, r.id from public.staff s join public.rooms r on r.branch_id = v_branch_id
  where s.clinic_id = v_clinic_id and (
    (lower(trim(s.staff_name)) = 'dr fatima alsatouf' and r.name in ('Clinic 1','Clinic 2')) or
    (lower(trim(s.staff_name)) = 'dr maram' and r.name in ('Clinic 3','Clinic 4')) or
    (lower(trim(s.staff_name)) = 'dr fatima khaled' and r.name in ('Clinic 5','Clinic 6'))
  ) on conflict do nothing;

  insert into public.staff_working_hours (staff_id, weekday, start_time, end_time, is_working)
  select s.id, d.weekday, time '14:00', time '22:00', true
  from public.staff s cross join (values (0),(1),(2),(3),(4),(6)) d(weekday)
  where s.clinic_id = v_clinic_id and lower(trim(s.staff_name)) in ('dr fatima alsatouf','dr maram','dr fatima khaled')
  on conflict (staff_id, weekday) do update set start_time=excluded.start_time,end_time=excluded.end_time,is_working=true;

  delete from public.staff_working_hours wh using public.staff s
  where wh.staff_id=s.id and s.clinic_id=v_clinic_id
    and lower(trim(s.staff_name)) in ('dr fatima alsatouf','dr maram','dr fatima khaled') and wh.weekday=5;

  update public.devices set name='Clarity II 1', code='CLARITY-II-1'
  where clinic_id=v_clinic_id and code='CLARITY-II';

  insert into public.devices (clinic_id, branch_id, name, code, is_active, capacity)
  values (v_clinic_id,v_branch_id,'Clarity II 1','CLARITY-II-1',true,1),
         (v_clinic_id,v_branch_id,'Clarity II 2','CLARITY-II-2',true,1)
  on conflict (clinic_id,branch_id,code) do update set name=excluded.name,is_active=true,capacity=1;

  update public.devices d set room_id=r.id from public.rooms r
  where d.clinic_id=v_clinic_id and r.branch_id=v_branch_id and (
    (d.code='CLARITY-II-1' and r.name='Laser 1') or
    (d.code='CLARITY-II-2' and r.name='Laser 2') or
    (d.code='FRAXIS' and r.name='Fraxis Room') or
    (d.code='PICOWAY' and r.name='PicoWay Room')
  );

  insert into public.staff_devices (staff_id, device_id)
  select s.id,d.id from public.staff s cross join public.devices d
  where s.clinic_id=v_clinic_id and d.clinic_id=v_clinic_id
    and lower(trim(s.staff_name)) in ('dr fatima alsatouf','dr maram','dr fatima khaled')
    and d.code in ('FRAXIS','PICOWAY')
  on conflict do nothing;

  insert into public.service_devices (service_id,device_id,is_required)
  select s.id,d.id,true from public.services s cross join public.devices d
  where s.clinic_id=v_clinic_id and d.clinic_id=v_clinic_id
    and s.category='Laser Hair Removal' and d.code in ('CLARITY-II-1','CLARITY-II-2')
  on conflict (service_id,device_id) do update set is_required=true;
end $$;

select 'rooms' check_name,count(*) row_count from public.rooms where branch_id=2 and name in
('Clinic 1','Clinic 2','Clinic 3','Clinic 4','Clinic 5','Clinic 6','Laser 1','Laser 2','Fraxis Room','PicoWay Room')
union all select 'doctor_room_links',count(*) from public.staff_rooms
union all select 'working_days',count(*) from public.staff_working_hours
union all select 'devices',count(*) from public.devices where clinic_id=1 and code in ('CLARITY-II-1','CLARITY-II-2','FRAXIS','PICOWAY')
union all select 'doctor_device_links',count(*) from public.staff_devices;

commit;
