begin;

update public.rooms
set is_active = false
where branch_id = 2
  and lower(trim(name)) in ('room 1', 'room 2', 'laser room');

select id, name, is_active
from public.rooms
where branch_id = 2
order by name;

commit;
