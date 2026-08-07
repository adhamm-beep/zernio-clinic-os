begin;

create extension if not exists pgcrypto;

create table if not exists public.patient_loyalty_accounts (
  customer_id bigint primary key references public.customers(id) on delete cascade,
  points_balance integer not null default 0 check(points_balance>=0),
  lifetime_points integer not null default 0 check(lifetime_points>=0),
  tier text not null default 'silver' check(tier in('silver','gold','platinum')),
  qr_token uuid not null default gen_random_uuid() unique,
  joined_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.patient_loyalty_accounts enable row level security;
drop policy if exists patient_loyalty_self on public.patient_loyalty_accounts;
create policy patient_loyalty_self on public.patient_loyalty_accounts for select to authenticated
using(customer_id=public.current_patient_customer_id());

create or replace function public.patient_membership_card()
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_customer_id bigint:=public.current_patient_customer_id();
  v_paid numeric:=0;
  v_points integer:=0;
  v_tier text:='silver';
  v_result jsonb;
begin
  if v_customer_id is null then raise exception 'Patient account is not linked'; end if;

  select coalesce(sum(coalesce(amount,0)),0) into v_paid
  from public.payments
  where customer_id=v_customer_id and lower(coalesce(payment_status,''))='paid';

  v_points:=greatest(0,floor(v_paid)::integer);
  v_tier:=case when v_paid>=10000 then 'platinum' when v_paid>=4000 then 'gold' else 'silver' end;

  insert into public.patient_loyalty_accounts(customer_id,points_balance,lifetime_points,tier)
  values(v_customer_id,v_points,v_points,v_tier)
  on conflict(customer_id) do update set
    points_balance=greatest(public.patient_loyalty_accounts.points_balance,v_points),
    lifetime_points=greatest(public.patient_loyalty_accounts.lifetime_points,v_points),
    tier=v_tier,updated_at=now();

  select jsonb_build_object(
    'customerId',c.id,'customerCode',c.customer_code,
    'name',trim(concat_ws(' ',c.first_name,c.last_name)),
    'points',la.points_balance,'lifetimePoints',la.lifetime_points,
    'tier',la.tier,'qrValue','panthera://patient/'||la.qr_token::text,
    'joinedAt',la.joined_at,
    'nextTierPoints',case la.tier when 'silver' then 4000 when 'gold' then 10000 else la.lifetime_points end,
    'benefits',case la.tier
      when 'platinum' then jsonb_build_array('Priority booking','Exclusive offers','Birthday benefit','Dedicated care support')
      when 'gold' then jsonb_build_array('Priority booking','Member offers','Birthday benefit')
      else jsonb_build_array('Earn points on paid visits','Member-only offers') end
  ) into v_result
  from public.patient_loyalty_accounts la join public.customers c on c.id=la.customer_id
  where la.customer_id=v_customer_id;
  return v_result;
end;
$$;

revoke all on function public.patient_membership_card() from public;
grant execute on function public.patient_membership_card() to authenticated;
commit;

with checks as(
 select 'patient_loyalty_table' check_name,count(*)::bigint value,1::bigint expected
 from information_schema.tables where table_schema='public' and table_name='patient_loyalty_accounts'
 union all
 select 'patient_membership_function',count(*)::bigint,1::bigint from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='patient_membership_card'
 union all
 select 'patient_loyalty_rls',count(*)::bigint,1::bigint from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname='patient_loyalty_accounts' and c.relrowsecurity
)
select case when value=expected then 'OK' else 'CHECK' end status,check_name,value,expected from checks order by check_name;
