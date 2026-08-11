-- Connect inventory, marketing and treasury to the accounting ledger.
-- Safe to run more than once after 20260810_company_accounting_v44.sql.
begin;

create or replace function public.accounting_inventory_movement_post()
returns trigger language plpgsql security definer set search_path=public as $$
declare
  v_entry bigint; v_inventory bigint; v_counter bigint; v_amount numeric;
  v_cost numeric; v_debit bigint; v_credit bigint;
begin
  delete from public.accounting_journal_entries
   where clinic_id=new.clinic_id and source_type='inventory_movement' and source_id=new.id;

  select coalesce(nullif(new.unit_cost,0),p.unit_cost,0) into v_cost
  from public.inventory_products p where p.id=new.product_id;
  v_amount:=round(new.quantity*coalesce(v_cost,0),2);
  if v_amount<=0 then return new; end if;

  v_inventory:=public.accounting_account_id(new.clinic_id,'inventory');
  if new.movement_type in('opening','purchase','adjustment_in','return') then
    v_counter:=public.accounting_account_id(new.clinic_id,
      case when new.movement_type='opening' then 'capital' else 'accounts_payable' end);
    v_debit:=v_inventory; v_credit:=v_counter;
  else
    v_counter:=public.accounting_account_id(new.clinic_id,'medical_materials');
    v_debit:=v_counter; v_credit:=v_inventory;
  end if;
  if v_debit is null or v_credit is null then raise exception 'Inventory accounting accounts are missing'; end if;

  insert into public.accounting_journal_entries(
    clinic_id,branch_id,entry_number,entry_date,description_en,description_ar,
    status,source_type,source_id,posted_at
  ) values(
    new.clinic_id,new.branch_id,'INV-'||new.id,new.occurred_at::date,
    'Inventory movement','حركة مخزون','posted','inventory_movement',new.id,now()
  ) returning id into v_entry;
  insert into public.accounting_journal_lines(entry_id,clinic_id,account_id,debit,credit,memo_en,memo_ar)
  values
    (v_entry,new.clinic_id,v_debit,v_amount,0,'Inventory movement','حركة مخزون'),
    (v_entry,new.clinic_id,v_credit,0,v_amount,'Inventory movement','حركة مخزون');
  return new;
end$$;

drop trigger if exists accounting_inventory_movement_trigger on public.inventory_movements;
create trigger accounting_inventory_movement_trigger
after insert or update of quantity,unit_cost,movement_type on public.inventory_movements
for each row execute function public.accounting_inventory_movement_post();

create or replace function public.accounting_marketing_cost_post()
returns trigger language plpgsql security definer set search_path=public as $$
declare v_entry bigint;v_expense bigint;v_payable bigint;v_amount numeric;
begin
  delete from public.accounting_journal_entries
   where clinic_id=new.clinic_id and source_type='marketing_source_cost' and source_id=new.id;
  v_amount:=round(coalesce(new.spend,0),2);
  if v_amount<=0 then return new; end if;
  v_expense:=public.accounting_account_id(new.clinic_id,'marketing');
  v_payable:=public.accounting_account_id(new.clinic_id,'accounts_payable');
  if v_expense is null or v_payable is null then raise exception 'Marketing accounting accounts are missing'; end if;
  insert into public.accounting_journal_entries(
    clinic_id,branch_id,entry_number,entry_date,description_en,description_ar,
    status,source_type,source_id,posted_at
  ) values(
    new.clinic_id,new.branch_id,'MKT-'||new.id,new.period_month,
    'Marketing source cost','تكلفة مصدر تسويقي','posted','marketing_source_cost',new.id,now()
  ) returning id into v_entry;
  insert into public.accounting_journal_lines(entry_id,clinic_id,account_id,debit,credit,memo_en,memo_ar)
  values
    (v_entry,new.clinic_id,v_expense,v_amount,0,'Marketing expense','مصروف تسويق'),
    (v_entry,new.clinic_id,v_payable,0,v_amount,'Marketing payable','مستحقات تسويق');
  return new;
end$$;

drop trigger if exists accounting_marketing_cost_trigger on public.marketing_source_costs;
create trigger accounting_marketing_cost_trigger
after insert or update of spend,period_month on public.marketing_source_costs
for each row execute function public.accounting_marketing_cost_post();

-- Backfill through the same triggers, which also makes reruns deterministic.
update public.inventory_movements set unit_cost=unit_cost;
update public.marketing_source_costs set spend=spend;

-- Statement-friendly treasury snapshot (cash, bank, gateway and receivables).
create or replace function public.accounting_treasury_summary(p_as_of date default current_date)
returns table(system_key text,code text,name_en text,name_ar text,balance numeric)
language sql security definer set search_path=public stable as $$
select a.system_key,a.code,a.name_en,a.name_ar,
  round(coalesce(sum(case when a.normal_balance='debit' then l.debit-l.credit else l.credit-l.debit end),0),2)
from public.accounting_accounts a
left join public.accounting_journal_lines l on l.account_id=a.id
left join public.accounting_journal_entries e on e.id=l.entry_id and e.status='posted' and e.entry_date<=p_as_of
where a.clinic_id=public.current_clinic_id()
  and a.system_key in('cash','bank','gateway_clearing','accounts_receivable')
group by a.id order by a.code
$$;

grant execute on function public.accounting_treasury_summary(date) to authenticated;

commit;

select case when count(*)=0 then 'OK' else 'CHECK' end status,
  'unbalanced_posted_journals' check_name,count(*)::bigint value,0::bigint expected
from(
  select e.id
  from public.accounting_journal_entries e
  join public.accounting_journal_lines l on l.entry_id=e.id
  where e.status='posted'
  group by e.id having abs(sum(l.debit)-sum(l.credit))>.005
)x
union all
select case when count(*)=1 then 'OK' else 'CHECK' end,
  'inventory_accounting_trigger',count(*)::bigint,1::bigint
from pg_trigger where tgname='accounting_inventory_movement_trigger' and not tgisinternal
union all
select case when count(*)=1 then 'OK' else 'CHECK' end,
  'marketing_accounting_trigger',count(*)::bigint,1::bigint
from pg_trigger where tgname='accounting_marketing_cost_trigger' and not tgisinternal
union all
select case when count(*)=4 then 'OK' else 'CHECK' end,
  'treasury_accounts',count(*)::bigint,4::bigint
from public.accounting_accounts
where clinic_id=public.current_clinic_id()
  and system_key in('cash','bank','gateway_clearing','accounts_receivable');
