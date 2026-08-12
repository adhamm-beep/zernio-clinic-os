-- Permit each report source only for the report capability that consumes it.
begin;
drop policy if exists treatments_report_read on public.treatments;
create policy treatments_report_read on public.treatments for select to authenticated using
 (clinic_id=public.current_clinic_id() and public.has_any_hr_permission(array['reports.finance.view','reports.doctor_revenue.view']));

drop policy if exists treatment_sessions_report_read on public.treatment_sessions;
create policy treatment_sessions_report_read on public.treatment_sessions for select to authenticated using
 (clinic_id=public.current_clinic_id() and public.has_hr_permission('reports.doctor_revenue.view'));

drop policy if exists marketing_leads_report_read on public.marketing_leads;
create policy marketing_leads_report_read on public.marketing_leads for select to authenticated using
 (clinic_id=public.current_clinic_id() and public.has_hr_permission('reports.view'));

drop policy if exists marketing_costs_report_read on public.marketing_source_costs;
create policy marketing_costs_report_read on public.marketing_source_costs for select to authenticated using
 (clinic_id=public.current_clinic_id() and public.has_hr_permission('marketing.spend.view'));
drop policy if exists marketing_campaigns_spend_read on public.marketing_campaigns;
create policy marketing_campaigns_spend_read on public.marketing_campaigns for select to authenticated using
 (clinic_id=public.current_clinic_id() and public.has_hr_permission('marketing.spend.view'));
commit;
