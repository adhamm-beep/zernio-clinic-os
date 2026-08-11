with checks as (
 select 'accounting_tables' check_name,count(*)::bigint value,7::bigint expected from information_schema.tables where table_schema='public' and table_name in('accounting_accounts','accounting_cost_centers','accounting_fiscal_years','accounting_journal_entries','accounting_journal_lines','employee_financial_transactions','employee_financial_settlements')
 union all select 'accounting_report_functions',count(*)::bigint,2 from pg_proc where pronamespace='public'::regnamespace and proname in('accounting_trial_balance','accounting_financial_statements')
 union all select 'accounting_automation_triggers',count(*)::bigint,3 from pg_trigger where not tgisinternal and tgname in('payments_accounting_post','employee_finance_accounting_post','employee_settlement_accounting_post')
 union all select 'unbalanced_posted_entries',count(*)::bigint,0 from (select e.id from accounting_journal_entries e join accounting_journal_lines l on l.entry_id=e.id where e.status='posted' group by e.id having abs(sum(l.debit)-sum(l.credit))>.005) q
 union all select 'employee_over_settlement',count(*)::bigint,0 from employee_financial_transactions where settled_amount>amount
 union all select 'clinics_missing_base_chart',count(*)::bigint,0 from (select c.id from clinics c left join accounting_accounts a on a.clinic_id=c.id and a.is_active and a.is_postable group by c.id having count(a.id)<29) q
 union all select 'accounting_rls_tables',count(*)::bigint,7 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname in('accounting_accounts','accounting_cost_centers','accounting_fiscal_years','accounting_journal_entries','accounting_journal_lines','employee_financial_transactions','employee_financial_settlements') and c.relrowsecurity
)
select case when value=expected then 'OK' else 'CHECK' end status,check_name,value,expected from checks order by check_name;
