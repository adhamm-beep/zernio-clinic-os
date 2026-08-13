begin;
alter table public.customers add column if not exists address text;
alter table public.customers add column if not exists marital_status text;
alter table public.customers add column if not exists occupation text;
alter table public.customers add column if not exists insurance_company text;
alter table public.customers add column if not exists insurance_policy_number text;
alter table public.customers add column if not exists insurance_policy_class text;
alter table public.customers add column if not exists insurance_expiry date;
alter table public.customers add column if not exists price_group text;
alter table public.customers add column if not exists phone_verified boolean not null default false;
alter table public.customers add column if not exists birth_date_verified boolean not null default false;
alter table public.customers add column if not exists address_verified boolean not null default false;
alter table public.customers add column if not exists updated_at timestamptz not null default now();
create or replace function public.stamp_customer_updated_at() returns trigger language plpgsql set search_path=public as $$begin new.updated_at=clock_timestamp();return new;end$$;
drop trigger if exists customers_stamp_updated_at on public.customers;
create trigger customers_stamp_updated_at before update on public.customers for each row execute function public.stamp_customer_updated_at();

drop view if exists public.customer_directory;
create view public.customer_directory with (security_invoker=true) as
select c.id,c.clinic_id,c.branch_id,c.customer_code,c.first_name,c.last_name,c.phone,c.phone_normalized,c.email,c.gender,c.status,c.date_of_birth,c.national_id,c.nationality,c.created_at,c.updated_at,c.address,c.marital_status,c.occupation,c.insurance_company,c.insurance_policy_number,c.insurance_policy_class,c.insurance_expiry,c.price_group,c.phone_verified,c.birth_date_verified,c.address_verified,c.assigned_doctor_id,c.referral_source_id,coalesce(ref.name,c.referral_source) referral_source,c.referral_detail,c.selected_at,b.name branch_name,d.staff_name assigned_doctor_name,coalesce(fin.total_paid,0) total_paid,coalesce(fin.remaining,0) remaining,coalesce(fin.today_paid,0) today_paid,fin.first_payment_at,fin.last_payment_at,coalesce(wallet.balance,0) wallet_balance,coalesce(loyalty.points_balance,0) points_available,previous_appointment.appointment_at previous_appointment_at,previous_appointment.doctor_name previous_appointment_doctor,active_appointment.appointment_at active_appointment_at,active_appointment.doctor_name active_appointment_doctor,coalesce(tags.tags,'[]'::jsonb) tags
from public.customers c left join public.branches b on b.id=c.branch_id left join public.staff d on d.id=c.assigned_doctor_id left join public.patient_referral_sources ref on ref.id=c.referral_source_id
left join lateral(select sum(coalesce(p.paid_amount,case when p.payment_status='paid' then p.amount else 0 end)) total_paid,sum(coalesce(p.balance_due,0)) remaining,sum(case when (p.payment_date at time zone 'Asia/Riyadh')::date=(now() at time zone 'Asia/Riyadh')::date then coalesce(p.paid_amount,0) else 0 end) today_paid,min(p.payment_date) first_payment_at,max(p.payment_date) last_payment_at from public.payments p where p.customer_id=c.id and p.payment_status not in('cancelled','refunded')) fin on true
left join lateral(select sum(case when w.transaction_type in('credit','refund') then w.amount else -w.amount end) balance from public.patient_wallet_transactions w where w.customer_id=c.id) wallet on true
left join public.patient_loyalty_accounts loyalty on loyalty.customer_id=c.id
left join lateral(select a.appointment_at,coalesce(s.staff_name,a.doctor_name) doctor_name from public.appointments a left join public.staff s on s.id=a.doctor_id where a.customer_id=c.id and a.appointment_at<now() order by a.appointment_at desc limit 1) previous_appointment on true
left join lateral(select a.appointment_at,coalesce(s.staff_name,a.doctor_name) doctor_name from public.appointments a left join public.staff s on s.id=a.doctor_id where a.customer_id=c.id and a.appointment_at>=now() and a.status not in('cancelled','no_show','completed') order by a.appointment_at limit 1) active_appointment on true
left join lateral(select jsonb_agg(jsonb_build_object('id',t.id,'name',t.name,'color',t.color) order by t.name) tags from public.customer_patient_tags ct join public.patient_tags t on t.id=ct.tag_id where ct.customer_id=c.id and t.is_active) tags on true;
create or replace function public.wallet_balance(customer public.customers) returns numeric language sql stable security invoker set search_path=public as $$select coalesce(sum(case when transaction_type in('credit','refund') then amount else -amount end),0) from public.patient_wallet_transactions where customer_id=customer.id$$;
grant select on public.customer_directory to authenticated;
commit;
