begin;

create table if not exists public.clinic_public_profiles(
  clinic_id bigint primary key references public.clinics(id) on delete cascade,
  support_phone text,
  whatsapp_number text,
  support_email text,
  address_en text,
  address_ar text,
  maps_url text,
  working_hours_en text,
  working_hours_ar text,
  updated_at timestamptz not null default now()
);

alter table public.clinic_public_profiles enable row level security;
drop policy if exists clinic_public_profiles_staff_read on public.clinic_public_profiles;
create policy clinic_public_profiles_staff_read on public.clinic_public_profiles for select to authenticated using(
  exists(select 1 from public.staff s where lower(s.email)=lower(coalesce(auth.jwt()->>'email','')) and s.clinic_id=clinic_public_profiles.clinic_id and coalesce(s.is_active,true))
);

insert into public.clinic_public_profiles(clinic_id,support_phone,support_email,address_en,address_ar)
select c.id,c.phone,c.email,b.address,b.address
from public.clinics c left join lateral(select address from public.branches where clinic_id=c.id and is_active order by id limit 1)b on true
on conflict(clinic_id) do nothing;

create or replace function public.staff_customer_membership_summary(p_customer_id bigint)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_clinic_id bigint;v_paid numeric:=0;v_points integer:=0;v_tier text:='silver';
begin
 select clinic_id into v_clinic_id from customers where id=p_customer_id;
 if v_clinic_id is null then raise exception 'Customer not found';end if;
 if not exists(select 1 from staff where lower(email)=lower(coalesce(auth.jwt()->>'email','')) and clinic_id=v_clinic_id and coalesce(is_active,true)) then raise exception 'Access denied';end if;
 select coalesce(sum(coalesce(amount,0)),0) into v_paid from payments where customer_id=p_customer_id and lower(coalesce(payment_status,''))='paid';
 v_points:=greatest(0,floor(v_paid)::integer);
 v_tier:=case when v_paid>=10000 then 'platinum' when v_paid>=4000 then 'gold' else 'silver' end;
 insert into patient_loyalty_accounts(customer_id,points_balance,lifetime_points,tier)
 values(p_customer_id,v_points,v_points,v_tier)
 on conflict(customer_id) do update set points_balance=greatest(patient_loyalty_accounts.points_balance,v_points),lifetime_points=greatest(patient_loyalty_accounts.lifetime_points,v_points),tier=v_tier,updated_at=now();
 return (select jsonb_build_object('points',points_balance,'lifetimePoints',lifetime_points,'tier',tier,'joinedAt',joined_at,'nextTierPoints',case tier when 'silver' then 4000 when 'gold' then 10000 else lifetime_points end) from patient_loyalty_accounts where customer_id=p_customer_id);
end;$$;

create or replace function public.patient_clinic_contact()
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_customer_id bigint:=public.current_patient_customer_id();v_language text:='en';
begin
 if v_customer_id is null then raise exception 'Patient account is not linked';end if;
 select coalesce(preferred_language,'en') into v_language from patient_accounts where customer_id=v_customer_id;
 return (select jsonb_build_object('clinicName',case when v_language='ar' then 'عيادات بانثيرا' else c.name end,'branchName',b.name,'phone',coalesce(nullif(p.support_phone,''),nullif(b.phone,''),nullif(c.phone,'')),'whatsapp',p.whatsapp_number,'email',coalesce(nullif(p.support_email,''),c.email),'address',case when v_language='ar' then coalesce(nullif(p.address_ar,''),b.address) else coalesce(nullif(p.address_en,''),b.address) end,'mapsUrl',p.maps_url,'workingHours',case when v_language='ar' then p.working_hours_ar else p.working_hours_en end)
 from customers x join clinics c on c.id=x.clinic_id left join branches b on b.id=x.branch_id left join clinic_public_profiles p on p.clinic_id=x.clinic_id where x.id=v_customer_id);
end;$$;

revoke all on function public.staff_customer_membership_summary(bigint) from public;
revoke all on function public.patient_clinic_contact() from public;
grant execute on function public.staff_customer_membership_summary(bigint) to authenticated;
grant execute on function public.patient_clinic_contact() to authenticated;
commit;
