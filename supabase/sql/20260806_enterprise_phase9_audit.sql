with checks as(
select 'enterprise_admin_permissions' n,count(*)::bigint v,3::bigint expected from public.hr_role_permissions rp join public.hr_roles r on r.id=rp.role_id join public.hr_permissions p on p.id=rp.permission_id where r.name='Admin' and p.code in('enterprise.manage','audit.view','tasks.manage')
union all select 'enterprise_rls_tables',count(*),6 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname in('enterprise_audit_log','enterprise_notifications','enterprise_tasks','enterprise_workflows','enterprise_workflow_runs','enterprise_preferences') and c.relrowsecurity
union all select 'enterprise_audit_triggers',count(*),8 from pg_trigger where tgname like 'enterprise_audit_%' and not tgisinternal
union all select 'enterprise_workflow_triggers',count(*),3 from pg_trigger where tgname in('enterprise_workflow_appointments','enterprise_workflow_treatments','enterprise_workflow_leads') and not tgisinternal
union all select 'enterprise_identity_functions',count(*),4 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in('current_staff_id','current_clinic_id','current_branch_id','has_hr_permission')
union all select 'cross_clinic_tasks',count(*),0 from public.enterprise_tasks t join public.staff s on s.id=t.assigned_to where t.clinic_id<>s.clinic_id
union all select 'orphan_workflow_runs',count(*),0 from public.enterprise_workflow_runs r left join public.enterprise_workflows w on w.id=r.workflow_id where w.id is null
union all select 'invalid_preferences',count(*),0 from public.enterprise_preferences p join public.staff s on s.id=p.staff_id where p.clinic_id<>s.clinic_id or p.language not in('en','ar'))
select case when v=expected then 'OK' else 'CHECK' end status,n check_name,v value,expected from checks order by status desc,n;
