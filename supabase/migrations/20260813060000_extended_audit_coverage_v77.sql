begin;
do $$declare table_name text;begin
  foreach table_name in array array['services','branches','rooms','clinic_expenses','clinic_expense_payments','clinic_incomes','enterprise_tasks','patient_tags','patient_referral_sources'] loop
    execute format('drop trigger if exists enterprise_audit_%1$s on public.%1$I',table_name);
    execute format('create trigger enterprise_audit_%1$s after insert or update or delete on public.%1$I for each row execute function public.enterprise_audit_trigger()',table_name);
  end loop;
end$$;
do $$begin if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='enterprise_audit_log') then alter publication supabase_realtime add table public.enterprise_audit_log;end if;end$$;
commit;
