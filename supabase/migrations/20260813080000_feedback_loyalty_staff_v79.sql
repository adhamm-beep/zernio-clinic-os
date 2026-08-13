begin;

insert into public.hr_permissions(code,name,module)
values
 ('reports.feedback.view','View patient feedback','Reports'),
 ('loyalty.view','View patient loyalty','Patients')
on conflict(code) do update set name=excluded.name,module=excluded.module;

insert into public.hr_role_permissions(role_id,permission_id)
select r.id,p.id
from public.hr_roles r
cross join public.hr_permissions p
where lower(r.name)='admin'
  and p.code in('reports.feedback.view','loyalty.view')
on conflict do nothing;

drop policy if exists patient_feedback_staff_scope on public.patient_experience_feedback;
create policy patient_feedback_staff_scope
on public.patient_experience_feedback for select to authenticated
using(
  customer_id=public.current_patient_customer_id()
  or (
    clinic_id=public.current_clinic_id()
    and public.has_any_hr_permission(array['reports.feedback.view'])
  )
);

drop policy if exists patient_loyalty_staff_scope on public.patient_loyalty_accounts;
create policy patient_loyalty_staff_scope
on public.patient_loyalty_accounts for select to authenticated
using(
  customer_id=public.current_patient_customer_id()
  or (
    exists(
      select 1 from public.customers c
      where c.id=customer_id and c.clinic_id=public.current_clinic_id()
    )
    and public.has_any_hr_permission(array['loyalty.view'])
  )
);

grant select on public.patient_experience_feedback,public.patient_loyalty_accounts to authenticated;

commit;
