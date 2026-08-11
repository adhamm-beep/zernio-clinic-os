-- Ensure every clinic has the four operational treasury accounts.
-- Safe to run repeatedly. It does not alter balances or journal entries.
begin;

do $$
declare
  c record;
  v_assets bigint;
begin
  for c in select id from public.clinics loop
    insert into public.accounting_accounts(
      clinic_id,code,name_en,name_ar,account_type,normal_balance,is_postable,is_active
    ) values(c.id,'1000','Assets','الأصول','asset','debit',false,true)
    on conflict(clinic_id,code) do update
      set name_en=excluded.name_en,name_ar=excluded.name_ar,is_active=true;

    select id into v_assets
    from public.accounting_accounts
    where clinic_id=c.id and code='1000';

    insert into public.accounting_accounts(
      clinic_id,parent_id,code,name_en,name_ar,account_type,normal_balance,system_key,is_postable,is_active
    ) values
      (c.id,v_assets,'1110','Cash','النقدية','asset','debit','cash',true,true),
      (c.id,v_assets,'1120','Bank','البنك','asset','debit','bank',true,true),
      (c.id,v_assets,'1130','Payment gateway clearing','تسويات بوابة الدفع','asset','debit','gateway_clearing',true,true),
      (c.id,v_assets,'1200','Accounts receivable','الذمم المدينة','asset','debit','accounts_receivable',true,true)
    on conflict(clinic_id,code) do update set
      parent_id=excluded.parent_id,
      name_en=excluded.name_en,
      name_ar=excluded.name_ar,
      system_key=coalesce(public.accounting_accounts.system_key,excluded.system_key),
      is_postable=true,
      is_active=true;
  end loop;
end;
$$;

commit;

select
  case when count(*) filter(where treasury_count<>4)=0 then 'OK' else 'CHECK' end status,
  'treasury_accounts_per_clinic' check_name,
  count(*) filter(where treasury_count<>4)::bigint value,
  0::bigint expected,
  coalesce(string_agg(clinic_id||': found '||treasury_count,', ') filter(where treasury_count<>4),'All clinics have four treasury accounts') details
from(
  select c.id clinic_id,count(a.id)::bigint treasury_count
  from public.clinics c
  left join public.accounting_accounts a
    on a.clinic_id=c.id
   and a.is_active
   and a.system_key in('cash','bank','gateway_clearing','accounts_receivable')
  group by c.id
)x;
