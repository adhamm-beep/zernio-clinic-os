begin;

create or replace function public.accounting_payment_post()
returns trigger language plpgsql security definer set search_path=public as $$
declare
  j jsonb:=to_jsonb(new); eid bigint; receipt_id bigint; ar_id bigint; revenue_id bigint; vat_id bigint; discount_id bigint; doctor_id bigint;
  method text:=lower(coalesce(j->>'payment_method','cash')); status text:=lower(coalesce(j->>'payment_status','pending'));
  invoice_ref text:=coalesce(nullif(j->>'invoice_number',''),'#'||new.id::text);
  paid numeric:=coalesce(nullif(j->>'paid_amount','')::numeric,nullif(j->>'amount','')::numeric,0);
  subtotal numeric:=coalesce(nullif(j->>'subtotal_amount','')::numeric,greatest(coalesce(nullif(j->>'amount','')::numeric,0)-coalesce(nullif(j->>'tax_amount','')::numeric,0),0));
  tax numeric:=coalesce(nullif(j->>'tax_amount','')::numeric,0); discount numeric:=coalesce(nullif(j->>'discount_amount','')::numeric,0); total numeric; balance numeric;
begin
  select a.doctor_id into doctor_id from public.appointments a where a.id=new.appointment_id and a.clinic_id=new.clinic_id;
  delete from public.accounting_journal_entries where clinic_id=new.clinic_id and source_type='payment' and source_id=new.id;
  if status in ('cancelled','canceled') then return new; end if;
  total:=greatest(subtotal-discount+tax,0); balance:=greatest(total-paid,0); if total=0 then return new; end if;
  receipt_id:=public.accounting_account_id(new.clinic_id,case when method in('cash','نقدا','نقداً') then 'cash' when method in('bank','bank_transfer','transfer','تحويل بنكي') then 'bank' else 'gateway_clearing' end);
  ar_id:=public.accounting_account_id(new.clinic_id,'accounts_receivable'); revenue_id:=public.accounting_account_id(new.clinic_id,'service_revenue'); vat_id:=public.accounting_account_id(new.clinic_id,'vat_payable'); discount_id:=public.accounting_account_id(new.clinic_id,'sales_discounts');
  insert into public.accounting_journal_entries(clinic_id,branch_id,entry_number,entry_date,description_en,description_ar,status,source_type,source_id)
  values(new.clinic_id,new.branch_id,'PAY-'||new.id,coalesce(nullif(j->>'payment_date','')::timestamptz::date,current_date),'Patient invoice '||invoice_ref,'فاتورة مريض '||invoice_ref,'draft','payment',new.id) returning id into eid;
  if paid>0 then insert into public.accounting_journal_lines(entry_id,clinic_id,account_id,customer_id,staff_id,debit,credit) values(eid,new.clinic_id,receipt_id,new.customer_id,doctor_id,least(paid,total),0); end if;
  if balance>0 then insert into public.accounting_journal_lines(entry_id,clinic_id,account_id,customer_id,staff_id,debit,credit) values(eid,new.clinic_id,ar_id,new.customer_id,doctor_id,balance,0); end if;
  if discount>0 then insert into public.accounting_journal_lines(entry_id,clinic_id,account_id,customer_id,staff_id,debit,credit) values(eid,new.clinic_id,discount_id,new.customer_id,doctor_id,discount,0); end if;
  if subtotal>0 then insert into public.accounting_journal_lines(entry_id,clinic_id,account_id,customer_id,staff_id,debit,credit) values(eid,new.clinic_id,revenue_id,new.customer_id,doctor_id,0,subtotal); end if;
  if tax>0 then insert into public.accounting_journal_lines(entry_id,clinic_id,account_id,customer_id,staff_id,debit,credit) values(eid,new.clinic_id,vat_id,new.customer_id,doctor_id,0,tax); end if;
  update public.accounting_journal_entries set status='posted',posted_at=now() where id=eid; return new;
end$$;

create or replace function public.accounting_inventory_movement_post()
returns trigger language plpgsql security definer set search_path=public as $$
declare v_entry bigint;v_inventory bigint;v_counter bigint;v_amount numeric;v_cost numeric;v_debit bigint;v_credit bigint;v_product text;
begin
  delete from public.accounting_journal_entries where clinic_id=new.clinic_id and source_type='inventory_movement' and source_id=new.id;
  select coalesce(nullif(new.unit_cost,0),p.unit_cost,0),p.name into v_cost,v_product from public.inventory_products p where p.id=new.product_id;
  v_amount:=round(new.quantity*coalesce(v_cost,0),2); if v_amount<=0 then return new; end if;
  v_inventory:=public.accounting_account_id(new.clinic_id,'inventory');
  if new.movement_type in('opening','purchase','adjustment_in','return') then v_counter:=public.accounting_account_id(new.clinic_id,case when new.movement_type='opening' then 'capital' else 'accounts_payable' end);v_debit:=v_inventory;v_credit:=v_counter;
  else v_counter:=public.accounting_account_id(new.clinic_id,'medical_materials');v_debit:=v_counter;v_credit:=v_inventory; end if;
  insert into public.accounting_journal_entries(clinic_id,branch_id,entry_number,entry_date,description_en,description_ar,status,source_type,source_id,posted_at)
  values(new.clinic_id,new.branch_id,'INV-'||new.id,new.occurred_at::date,'Inventory: '||coalesce(v_product,new.product_id::text),'المخزون: '||coalesce(v_product,new.product_id::text),'posted','inventory_movement',new.id,now()) returning id into v_entry;
  insert into public.accounting_journal_lines(entry_id,clinic_id,account_id,staff_id,debit,credit,memo_en,memo_ar) values
  (v_entry,new.clinic_id,v_debit,new.doctor_id,v_amount,0,new.movement_type,coalesce(new.notes,new.movement_type)),
  (v_entry,new.clinic_id,v_credit,new.doctor_id,0,v_amount,new.movement_type,coalesce(new.notes,new.movement_type)); return new;
end$$;
drop trigger if exists accounting_inventory_movement_trigger on public.inventory_movements;
create trigger accounting_inventory_movement_trigger after insert or update of quantity,unit_cost,movement_type,doctor_id on public.inventory_movements for each row execute function public.accounting_inventory_movement_post();

create or replace function public.accounting_marketing_cost_post()
returns trigger language plpgsql security definer set search_path=public as $$
declare v_entry bigint;v_expense bigint;v_payable bigint;v_amount numeric;
begin
  delete from public.accounting_journal_entries where clinic_id=new.clinic_id and source_type='marketing_source_cost' and source_id=new.id;
  v_amount:=round(coalesce(new.spend,0),2);if v_amount<=0 then return new;end if;
  v_expense:=public.accounting_account_id(new.clinic_id,'marketing');v_payable:=public.accounting_account_id(new.clinic_id,'accounts_payable');
  insert into public.accounting_journal_entries(clinic_id,branch_id,entry_number,entry_date,description_en,description_ar,status,source_type,source_id,posted_at)
  values(new.clinic_id,new.branch_id,'MKT-'||new.id,new.period_month,'Marketing: '||new.source,'التسويق: '||new.source,'posted','marketing_source_cost',new.id,now()) returning id into v_entry;
  insert into public.accounting_journal_lines(entry_id,clinic_id,account_id,debit,credit,memo_en,memo_ar) values(v_entry,new.clinic_id,v_expense,v_amount,0,new.source,new.source),(v_entry,new.clinic_id,v_payable,0,v_amount,new.source,new.source);return new;
end$$;
drop trigger if exists accounting_marketing_cost_trigger on public.marketing_source_costs;
create trigger accounting_marketing_cost_trigger after insert or update of spend,period_month,source on public.marketing_source_costs for each row execute function public.accounting_marketing_cost_post();

commit;
