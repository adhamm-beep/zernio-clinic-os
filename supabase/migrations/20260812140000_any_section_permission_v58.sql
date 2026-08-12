create or replace function public.has_any_hr_permission(permission_codes text[]) returns boolean language sql stable security definer set search_path=public as $$select exists(select 1 from unnest(permission_codes) code where public.has_hr_permission(code))$$;
grant execute on function public.has_any_hr_permission(text[]) to authenticated;
