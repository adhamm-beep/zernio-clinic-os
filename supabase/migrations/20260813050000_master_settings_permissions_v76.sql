begin;
insert into public.hr_permissions(code,name,module) values
('branches.view','View branches','Settings'),('branches.manage','Manage branches','Settings'),
('rooms.view','View rooms','Settings'),('rooms.manage','Manage rooms','Settings'),
('patient_catalogs.manage','Manage patient tags and referrals','Settings')
on conflict(code) do update set name=excluded.name,module=excluded.module;
insert into public.hr_role_permissions(role_id,permission_id)
select r.id,p.id from public.hr_roles r cross join public.hr_permissions p where r.name='Admin' and p.code in('branches.view','branches.manage','rooms.view','rooms.manage','patient_catalogs.manage') on conflict do nothing;

alter table public.branches enable row level security;
drop policy if exists branches_clinic_read on public.branches;drop policy if exists branches_clinic_manage on public.branches;
create policy branches_clinic_read on public.branches for select to authenticated using(clinic_id=public.current_clinic_id());
create policy branches_clinic_manage on public.branches for all to authenticated using(clinic_id=public.current_clinic_id() and public.has_any_hr_permission(array['branches.manage','settings.manage'])) with check(clinic_id=public.current_clinic_id() and public.has_any_hr_permission(array['branches.manage','settings.manage']));

alter table public.rooms enable row level security;
drop policy if exists rooms_clinic_read on public.rooms;drop policy if exists rooms_clinic_manage on public.rooms;
create policy rooms_clinic_read on public.rooms for select to authenticated using(exists(select 1 from public.branches b where b.id=branch_id and b.clinic_id=public.current_clinic_id()));
create policy rooms_clinic_manage on public.rooms for all to authenticated using(exists(select 1 from public.branches b where b.id=branch_id and b.clinic_id=public.current_clinic_id()) and public.has_any_hr_permission(array['rooms.manage','settings.manage'])) with check(exists(select 1 from public.branches b where b.id=branch_id and b.clinic_id=public.current_clinic_id()) and public.has_any_hr_permission(array['rooms.manage','settings.manage']));

drop policy if exists patient_tags_clinic_scope on public.patient_tags;drop policy if exists patient_tags_read on public.patient_tags;drop policy if exists patient_tags_manage on public.patient_tags;
create policy patient_tags_read on public.patient_tags for select to authenticated using(clinic_id=public.current_clinic_id());
create policy patient_tags_manage on public.patient_tags for all to authenticated using(clinic_id=public.current_clinic_id() and public.has_any_hr_permission(array['patient_catalogs.manage','settings.manage'])) with check(clinic_id=public.current_clinic_id() and public.has_any_hr_permission(array['patient_catalogs.manage','settings.manage']));
drop policy if exists patient_referral_sources_scope on public.patient_referral_sources;drop policy if exists patient_referral_sources_read on public.patient_referral_sources;drop policy if exists patient_referral_sources_manage on public.patient_referral_sources;
create policy patient_referral_sources_read on public.patient_referral_sources for select to authenticated using(clinic_id=public.current_clinic_id());
create policy patient_referral_sources_manage on public.patient_referral_sources for all to authenticated using(clinic_id=public.current_clinic_id() and public.has_any_hr_permission(array['patient_catalogs.manage','settings.manage'])) with check(clinic_id=public.current_clinic_id() and public.has_any_hr_permission(array['patient_catalogs.manage','settings.manage']));
drop policy if exists customer_patient_tags_clinic_scope on public.customer_patient_tags;drop policy if exists customer_patient_tags_read on public.customer_patient_tags;drop policy if exists customer_patient_tags_manage on public.customer_patient_tags;
create policy customer_patient_tags_read on public.customer_patient_tags for select to authenticated using(exists(select 1 from public.customers c where c.id=customer_id and c.clinic_id=public.current_clinic_id()));
create policy customer_patient_tags_manage on public.customer_patient_tags for all to authenticated using(exists(select 1 from public.customers c where c.id=customer_id and c.clinic_id=public.current_clinic_id()) and public.has_any_hr_permission(array['customers.edit','customers.manage'])) with check(exists(select 1 from public.customers c where c.id=customer_id and c.clinic_id=public.current_clinic_id()) and public.has_any_hr_permission(array['customers.edit','customers.manage']));
commit;
