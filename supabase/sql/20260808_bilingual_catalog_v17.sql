-- Bilingual catalog foundation. Safe to run more than once.
begin;

alter table public.services add column if not exists name_en text;
alter table public.services add column if not exists name_ar text;
alter table public.services add column if not exists category_en text;
alter table public.services add column if not exists category_ar text;
alter table public.service_variants add column if not exists name_en text;
alter table public.service_variants add column if not exists name_ar text;

update public.services set
  name_en=coalesce(nullif(name_en,''),name),
  category_en=coalesce(nullif(category_en,''),category),
  name_ar=coalesce(nullif(name_ar,''),case upper(name)
    when 'BOTOX' then 'بوتوكس' when 'FILLER' then 'فيلر' when 'CONSULTATION' then 'استشارة'
    when 'PICOWAY LASER' then 'ليزر بيكواي' when 'FRAXIS' then 'فراكسيس'
    when 'HAIR THERAPY' then 'علاجات الشعر' when 'PEELING' then 'التقشير'
    when 'SKIN BOOSTER' then 'محفزات البشرة' when 'THREADS' then 'الخيوط'
    when 'PRP HAIR' then 'بلازما الشعر' when 'POLYLACTIC ACID' then 'حمض البوليلاكتيك'
    when 'EYEBROWS HAIR BLEACHING' then 'تشقير الحواجب'
    when 'FACE HAIR BLEACHING' then 'تشقير شعر الوجه'
    when 'PROFACIAL HAIR' then 'بروفاشيال للشعر'
    when 'PROFACIAL UNDERARMS' then 'بروفاشيال للإبط'
    when 'PROFACIAL ROYAL WITH ZAIN OBAGI' then 'بروفاشيال رويال مع زين أوباجي'
    when 'PROFACIAL FACE WITH CLASSIC MASK' then 'بروفاشيال للوجه مع الماسك الكلاسيكي'
    else name end),
  category_ar=coalesce(nullif(category_ar,''),case category
    when 'Laser Hair Removal' then 'إزالة الشعر بالليزر'
    when 'Bleaching' then 'التشقير'
    when 'ProFacial' then 'البروفاشيال'
    else category end);

-- Brand and material names remain searchable in their official spelling until staff adds an Arabic label.
update public.service_variants set
  name_en=coalesce(nullif(name_en,''),name),
  name_ar=coalesce(nullif(name_ar,''),name);

alter table public.services alter column name_en set not null;
alter table public.services alter column name_ar set not null;
alter table public.service_variants alter column name_en set not null;
alter table public.service_variants alter column name_ar set not null;

create or replace function public.sync_bilingual_catalog_fields() returns trigger
language plpgsql set search_path=public as $$
begin
  new.name_en:=coalesce(nullif(trim(new.name_en),''),new.name);
  new.name_ar:=coalesce(nullif(trim(new.name_ar),''),new.name_en,new.name);
  if tg_table_name='services' then
    new.category_en:=coalesce(nullif(trim(new.category_en),''),new.category);
    new.category_ar:=coalesce(nullif(trim(new.category_ar),''),new.category_en,new.category);
  end if;
  return new;
end$$;

drop trigger if exists services_bilingual_fields on public.services;
create trigger services_bilingual_fields before insert or update on public.services
for each row execute function public.sync_bilingual_catalog_fields();
drop trigger if exists service_variants_bilingual_fields on public.service_variants;
create trigger service_variants_bilingual_fields before insert or update on public.service_variants
for each row execute function public.sync_bilingual_catalog_fields();

commit;
