-- Load the signed-in employee workspace independently from direct branch-table RLS.
begin;

create or replace function public.current_branch_id() returns bigint
language sql stable security definer set search_path=public as $$
 select coalesce(s.branch_id,(select b.id from public.branches b where b.clinic_id=s.clinic_id and b.is_active order by b.id limit 1))
 from public.staff s where s.id=public.current_staff_id()
$$;

create or replace function public.current_staff_workspace() returns jsonb
language plpgsql stable security definer set search_path=public as $$
declare s public.staff%rowtype;c public.clinics%rowtype;result_branches jsonb;
begin
 select * into s from public.staff where id=public.current_staff_id() and is_active;
 if s.id is null then raise exception 'STAFF_ACCOUNT_NOT_LINKED';end if;
 select * into c from public.clinics where id=s.clinic_id and is_active;
 if c.id is null then raise exception 'ACTIVE_CLINIC_NOT_FOUND';end if;
 select coalesce(jsonb_agg(to_jsonb(b) order by b.name),'[]'::jsonb) into result_branches
 from public.branches b where b.clinic_id=c.id and b.is_active and
 (public.has_hr_permission('users.manage') or b.id=public.current_branch_id());
 return jsonb_build_object('clinic',to_jsonb(c),'branches',result_branches,'assignedBranchId',public.current_branch_id());
end$$;

grant execute on function public.current_staff_workspace() to authenticated;
commit;
