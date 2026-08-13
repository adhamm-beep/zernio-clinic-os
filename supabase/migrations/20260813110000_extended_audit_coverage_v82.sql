begin;

do $$declare table_name text;begin
  foreach table_name in array array[
    'inventory_movements','inventory_purchase_orders','staff_attendance',
    'patient_messages','patient_experience_feedback','patient_wallet_transactions',
    'patient_loyalty_transactions','clinic_operational_settings'
  ] loop
    if to_regclass('public.'||table_name) is not null then
      execute format('drop trigger if exists enterprise_audit_%1$s on public.%1$I',table_name);
      execute format('create trigger enterprise_audit_%1$s after insert or update or delete on public.%1$I for each row execute function public.enterprise_audit_trigger()',table_name);
    end if;
  end loop;
end$$;

commit;
