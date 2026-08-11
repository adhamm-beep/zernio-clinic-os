begin;

alter table public.payments add column if not exists subtotal_amount numeric(12,2) not null default 0;
alter table public.payments add column if not exists discount_amount numeric(12,2) not null default 0;
alter table public.payments add column if not exists paid_amount numeric(12,2) not null default 0;
alter table public.payments add column if not exists balance_due numeric(12,2) not null default 0;

update public.payments
set subtotal_amount=greatest(coalesce(amount,0)-coalesce(tax_amount,0)+coalesce(discount_amount,0),0),
    paid_amount=case when lower(coalesce(payment_status,'')) in('paid','partial') then coalesce(amount,0) else 0 end,
    balance_due=case when lower(coalesce(payment_status,'')) in('paid','partial','refunded','cancelled') then 0 else coalesce(amount,0) end
where subtotal_amount=0 and paid_amount=0 and balance_due=0 and coalesce(amount,0)>0;

drop function if exists public.create_multi_service_invoice(bigint,bigint,jsonb,numeric,text,text,timestamptz,text,text,text);
create or replace function public.create_multi_service_invoice(
  p_customer_id bigint,p_appointment_id bigint,p_items jsonb,p_tax numeric default 0,
  p_discount numeric default 0,p_paid numeric default null,p_method text default 'cash',
  p_status text default 'paid',p_payment_date timestamptz default now(),
  p_invoice_number text default null,p_reference_number text default null,p_notes text default null
) returns bigint language plpgsql security invoker set search_path=public as $$
declare
  v_a appointments%rowtype;v_item jsonb;v_service services%rowtype;v_variant service_variants%rowtype;
  v_price numeric;v_package numeric:=1;v_qty numeric;v_line numeric;v_subtotal numeric:=0;v_total numeric;
  v_paid numeric;v_balance numeric;v_payment bigint;v_match text[];v_description text;v_booking_category text;
begin
  select * into v_a from appointments where id=p_appointment_id and customer_id=p_customer_id;
  if not found then raise exception 'Appointment does not belong to customer';end if;
  select category into v_booking_category from services where id=v_a.service_id;
  if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)=0 then raise exception 'Invoice requires at least one item';end if;
  insert into payments(clinic_id,branch_id,customer_id,appointment_id,amount,tax_amount,discount_amount,subtotal_amount,paid_amount,balance_due,payment_method,payment_status,payment_date,invoice_number,reference_number,currency,notes,source_system)
  values(v_a.clinic_id,v_a.branch_id,p_customer_id,p_appointment_id,0,greatest(coalesce(p_tax,0),0),greatest(coalesce(p_discount,0),0),0,0,0,p_method,p_status,p_payment_date,nullif(trim(p_invoice_number),''),nullif(trim(p_reference_number),''),'SAR',nullif(trim(p_notes),''),'web_multi_invoice') returning id into v_payment;
  for v_item in select value from jsonb_array_elements(p_items) loop
    v_variant:=null;
    select * into v_service from services where id=(v_item->>'service_id')::bigint and clinic_id=v_a.clinic_id and is_active;
    if not found then raise exception 'Invalid invoice service';end if;
    if v_a.doctor_id is not null and not exists(select 1 from staff_services where staff_id=v_a.doctor_id and service_id=v_service.id) then raise exception 'Service is not linked to appointment doctor';end if;
    if v_a.doctor_id is null and (v_service.provider_type is distinct from 'department' or v_service.category is distinct from v_booking_category) then raise exception 'Department invoice item is outside the booked department';end if;
    v_qty:=coalesce((v_item->>'quantity')::numeric,1);if v_qty<=0 then raise exception 'Quantity must be positive';end if;
    if nullif(v_item->>'service_variant_id','') is not null then
      select * into v_variant from service_variants where id=(v_item->>'service_variant_id')::bigint and service_id=v_service.id and is_active;
      if not found then raise exception 'Material is not linked to selected service';end if;
      select coalesce((select price from service_variant_prices where service_variant_id=v_variant.id and staff_id=v_a.doctor_id and is_active limit 1),v_variant.price) into v_price;
      v_match:=regexp_match(v_variant.name,'^\s*([0-9]+(?:\.[0-9]+)?)\s*ML(\s|$)','i');v_package:=case when v_match is null then 1 else v_match[1]::numeric end;
      v_price:=round(v_price/v_package,2);v_description:=v_service.name||' — '||v_variant.name;
    else
      select coalesce((select price from service_prices where service_id=v_service.id and staff_id=v_a.doctor_id limit 1),(select price from service_prices where service_id=v_service.id and staff_id is null limit 1),v_service.default_price) into v_price;
      v_description:=v_service.name;
    end if;
    if coalesce(v_price,0)<=0 then raise exception 'Selected service or material has no price';end if;
    v_line:=round(v_qty*v_price,2);v_subtotal:=v_subtotal+v_line;
    insert into payment_invoice_items(payment_id,clinic_id,branch_id,service_id,service_variant_id,description,quantity,unit,unit_price,line_total)
    values(v_payment,v_a.clinic_id,v_a.branch_id,v_service.id,v_variant.id,v_description,v_qty,case when v_variant.id is null then 'service' else 'ml' end,v_price,v_line);
  end loop;
  v_total:=greatest(round(v_subtotal+greatest(coalesce(p_tax,0),0)-greatest(coalesce(p_discount,0),0),2),0);
  v_paid:=least(greatest(coalesce(p_paid,case when lower(p_status)='paid' then v_total else 0 end),0),v_total);
  v_balance:=greatest(v_total-v_paid,0);
  update payments set subtotal_amount=round(v_subtotal,2),amount=v_total,paid_amount=v_paid,balance_due=v_balance,
    payment_status=case when lower(p_status) in('cancelled','refunded') then lower(p_status) when v_balance=0 then 'paid' when v_paid>0 then 'partial' else 'pending' end,
    invoice_number=coalesce(nullif(trim(p_invoice_number),''),'ZRN-'||lpad(v_payment::text,6,'0')) where id=v_payment;
  return v_payment;
end;$$;
grant execute on function public.create_multi_service_invoice(bigint,bigint,jsonb,numeric,numeric,numeric,text,text,timestamptz,text,text,text) to authenticated;

create or replace function public.patient_finance_health_hub()
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_customer_id bigint:=public.current_patient_customer_id();v_record jsonb;v_filled integer:=0;
begin
 if v_customer_id is null then raise exception 'Patient account is not linked'; end if;
 select to_jsonb(mr),(case when nullif(mr.blood_type,'') is not null then 1 else 0 end+case when nullif(mr.allergies,'') is not null then 1 else 0 end+case when nullif(mr.chronic_diseases,'') is not null then 1 else 0 end+case when nullif(mr.medications,'') is not null then 1 else 0 end+case when nullif(mr.medical_notes,'') is not null then 1 else 0 end)
 into v_record,v_filled from medical_records mr where mr.customer_id=v_customer_id;
 return jsonb_build_object('wallet',jsonb_build_object(
  'totalPaid',coalesce((select sum(paid_amount) from payments where customer_id=v_customer_id),0),
  'outstanding',coalesce((select sum(balance_due) from payments where customer_id=v_customer_id and lower(coalesce(payment_status,'')) not in('cancelled','refunded')),0),
  'currency',coalesce((select currency from payments where customer_id=v_customer_id and currency is not null order by created_at desc limit 1),'SAR'),
  'transactions',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'invoiceNumber',p.invoice_number,'subtotal',p.subtotal_amount,'taxAmount',p.tax_amount,'discountAmount',p.discount_amount,'amount',p.amount,'paidAmount',p.paid_amount,'outstanding',p.balance_due,'status',p.payment_status,'method',p.payment_method,'date',coalesce(p.payment_date,p.created_at),'reference',p.reference_number,'notes',p.notes,'items',coalesce((select jsonb_agg(jsonb_build_object('description',i.description,'quantity',i.quantity,'unit',i.unit,'unitPrice',i.unit_price,'lineTotal',i.line_total) order by i.id) from payment_invoice_items i where i.payment_id=p.id),'[]'::jsonb)) order by coalesce(p.payment_date,p.created_at) desc) from payments p where p.customer_id=v_customer_id),'[]'::jsonb)),
  'health',jsonb_build_object('record',v_record,'completeness',round((v_filled::numeric/5)*100),'updateRequests',coalesce((select jsonb_agg(jsonb_build_object('id',r.id,'fields',r.requested_fields,'note',r.patient_note,'status',r.status,'createdAt',r.created_at) order by r.created_at desc) from patient_medical_update_requests r where r.customer_id=v_customer_id),'[]'::jsonb)));
end;$$;

do $$begin alter publication supabase_realtime add table public.payment_invoice_items;exception when duplicate_object then null;end$$;
commit;

with checks as(
 select 'invoice_financial_columns' check_name,count(*)::bigint value,4::bigint expected from information_schema.columns where table_schema='public' and table_name='payments' and column_name in('subtotal_amount','discount_amount','paid_amount','balance_due')
 union all select 'multi_invoice_function',count(*)::bigint,1::bigint from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='create_multi_service_invoice'
 union all select 'patient_wallet_function',count(*)::bigint,1::bigint from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='patient_finance_health_hub'
)
select case when value=expected then 'OK' else 'CHECK' end status,check_name,value,expected from checks order by check_name;
