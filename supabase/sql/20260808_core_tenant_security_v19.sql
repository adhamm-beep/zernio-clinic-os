-- Production tenant isolation for clinical and financial data.
begin;

alter table public.customers enable row level security;
alter table public.appointments enable row level security;
alter table public.treatments enable row level security;
alter table public.payments enable row level security;
alter table public.follow_ups enable row level security;
alter table public.medical_records enable row level security;
alter table public.treatment_sessions enable row level security;
alter table public.treatment_items enable row level security;

do $$declare r record;begin
  for r in select schemaname,tablename,policyname from pg_policies where schemaname='public' and tablename in('customers','appointments','treatments','payments','follow_ups','medical_records','treatment_sessions','treatment_items') loop
    execute format('drop policy if exists %I on %I.%I',r.policyname,r.schemaname,r.tablename);
  end loop;
end$$;

create policy customers_staff_read on public.customers for select to authenticated using(clinic_id=public.current_clinic_id());
create policy customers_staff_insert on public.customers for insert to authenticated with check(clinic_id=public.current_clinic_id());
create policy customers_staff_update on public.customers for update to authenticated using(clinic_id=public.current_clinic_id()) with check(clinic_id=public.current_clinic_id());
create policy customers_staff_delete on public.customers for delete to authenticated using(clinic_id=public.current_clinic_id());

create policy appointments_staff_read on public.appointments for select to authenticated using(clinic_id=public.current_clinic_id());
create policy appointments_staff_insert on public.appointments for insert to authenticated with check(clinic_id=public.current_clinic_id());
create policy appointments_staff_update on public.appointments for update to authenticated using(clinic_id=public.current_clinic_id()) with check(clinic_id=public.current_clinic_id());
create policy appointments_staff_delete on public.appointments for delete to authenticated using(clinic_id=public.current_clinic_id());

create policy treatments_staff_read on public.treatments for select to authenticated using(clinic_id=public.current_clinic_id());
create policy treatments_staff_insert on public.treatments for insert to authenticated with check(clinic_id=public.current_clinic_id());
create policy treatments_staff_update on public.treatments for update to authenticated using(clinic_id=public.current_clinic_id()) with check(clinic_id=public.current_clinic_id());
create policy treatments_staff_delete on public.treatments for delete to authenticated using(clinic_id=public.current_clinic_id());

create policy payments_staff_read on public.payments for select to authenticated using(clinic_id=public.current_clinic_id());
create policy payments_staff_insert on public.payments for insert to authenticated with check(clinic_id=public.current_clinic_id());
create policy payments_staff_update on public.payments for update to authenticated using(clinic_id=public.current_clinic_id()) with check(clinic_id=public.current_clinic_id());
create policy payments_staff_delete on public.payments for delete to authenticated using(clinic_id=public.current_clinic_id());

create policy followups_staff_read on public.follow_ups for select to authenticated using(clinic_id=public.current_clinic_id());
create policy followups_staff_insert on public.follow_ups for insert to authenticated with check(clinic_id=public.current_clinic_id());
create policy followups_staff_update on public.follow_ups for update to authenticated using(clinic_id=public.current_clinic_id()) with check(clinic_id=public.current_clinic_id());
create policy followups_staff_delete on public.follow_ups for delete to authenticated using(clinic_id=public.current_clinic_id());

create policy medical_records_staff_read on public.medical_records for select to authenticated using(clinic_id=public.current_clinic_id());
create policy medical_records_staff_insert on public.medical_records for insert to authenticated with check(clinic_id=public.current_clinic_id());
create policy medical_records_staff_update on public.medical_records for update to authenticated using(clinic_id=public.current_clinic_id()) with check(clinic_id=public.current_clinic_id());
create policy medical_records_staff_delete on public.medical_records for delete to authenticated using(clinic_id=public.current_clinic_id());

create policy treatment_sessions_staff_read on public.treatment_sessions for select to authenticated using(clinic_id=public.current_clinic_id());
create policy treatment_sessions_staff_insert on public.treatment_sessions for insert to authenticated with check(clinic_id=public.current_clinic_id());
create policy treatment_sessions_staff_update on public.treatment_sessions for update to authenticated using(clinic_id=public.current_clinic_id()) with check(clinic_id=public.current_clinic_id());
create policy treatment_sessions_staff_delete on public.treatment_sessions for delete to authenticated using(clinic_id=public.current_clinic_id());

create policy treatment_items_staff_read on public.treatment_items for select to authenticated using(exists(select 1 from public.treatment_sessions s where s.id=session_id and s.clinic_id=public.current_clinic_id()));
create policy treatment_items_staff_insert on public.treatment_items for insert to authenticated with check(exists(select 1 from public.treatment_sessions s where s.id=session_id and s.clinic_id=public.current_clinic_id()));
create policy treatment_items_staff_update on public.treatment_items for update to authenticated using(exists(select 1 from public.treatment_sessions s where s.id=session_id and s.clinic_id=public.current_clinic_id())) with check(exists(select 1 from public.treatment_sessions s where s.id=session_id and s.clinic_id=public.current_clinic_id()));
create policy treatment_items_staff_delete on public.treatment_items for delete to authenticated using(exists(select 1 from public.treatment_sessions s where s.id=session_id and s.clinic_id=public.current_clinic_id()));

revoke all on public.customers,public.appointments,public.treatments,public.payments,public.follow_ups,public.medical_records,public.treatment_sessions,public.treatment_items from anon;
grant select,insert,update,delete on public.customers,public.appointments,public.treatments,public.payments,public.follow_ups,public.medical_records,public.treatment_sessions,public.treatment_items to authenticated;

commit;
