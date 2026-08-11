-- Complete Arabic labels for every active service and material/option.
-- Safe to run more than once. Official product brands remain recognizable.
begin;

update public.services set name_ar = case upper(trim(coalesce(name_en,name)))
  when 'CONSULTATION' then 'استشارة' when 'PICOWAY LASER' then 'ليزر بيكواي'
  when 'FILLER' then 'فيلر' when 'LIPS FILLER' then 'فيلر الشفاه' when 'BOTOX' then 'بوتوكس'
  when 'SKIN BOOSTER' then 'محفزات البشرة' when 'PEELING' then 'التقشير'
  when 'POLYLACTIC ACID' then 'حمض البوليلاكتيك' when 'THREADS' then 'الخيوط'
  when 'HAIR THERAPY' then 'علاجات الشعر' when 'FRAXIS' then 'فراكسيس'
  when 'EYEBROWS HAIR BLEACHING' then 'تشقير شعر الحواجب'
  when 'FACE HAIR BLEACHING' then 'تشقير شعر الوجه'
  when 'PROFACIAL FACE WITH CLASSIC MASK' then 'بروفاشيال للوجه مع الماسك الكلاسيكي'
  when 'PROFACIAL HAIR' then 'بروفاشيال للشعر' when 'PROFACIAL UNDERARMS' then 'بروفاشيال للإبط'
  when 'PROFACIAL ROYAL WITH ZAIN OBAGI' then 'بروفاشيال رويال مع زين أوباجي'
  when 'FEMALE FULL BODY HAIR REMOVAL - MORNING' then 'إزالة شعر كامل الجسم للسيدات - صباحًا'
  when 'FEMALE FULL BODY HAIR REMOVAL - EVENING' then 'إزالة شعر كامل الجسم للسيدات - مساءً'
  when 'FEMALE FULL BODY HAIR REMOVAL' then 'إزالة شعر كامل الجسم للسيدات'
  when 'MALE FULL BODY HAIR REMOVAL' then 'إزالة شعر كامل الجسم للرجال'
  when 'FEMALE ONE AREA HAIR REMOVAL' then 'إزالة شعر منطقة واحدة للسيدات'
  when 'MALE ONE AREA HAIR REMOVAL' then 'إزالة شعر منطقة واحدة للرجال'
  when 'SMALL AREA HAIR REMOVAL' then 'إزالة شعر منطقة صغيرة'
  when 'LASER HEAD COVER' then 'غطاء الرأس لليزر' when 'SHAVING SERVICES' then 'خدمات الحلاقة'
  else coalesce(nullif(name_ar,''),name_en,name) end;

update public.services set category_ar = case lower(trim(coalesce(category_en,category,'')))
  when 'laser hair removal' then 'إزالة الشعر بالليزر' when 'bleaching' then 'التشقير'
  when 'profacial' then 'البروفاشيال' when 'consultation' then 'الاستشارات'
  when 'botox' then 'البوتوكس' when 'filler' then 'الفيلر'
  when 'skin booster' then 'محفزات البشرة' when 'hair therapy' then 'علاجات الشعر'
  when 'peeling' then 'التقشير' else coalesce(nullif(category_ar,''),category_en,category) end;

-- Explicit corrections for catalog rows whose older bilingual fallback copied English into Arabic.
update public.services set name_ar='بروفاشيال رويال مع زين أوباجي'
where upper(trim(coalesce(code,'')))='P00304'
   or upper(trim(coalesce(name_en,name)))='PROFACIAL ROYAL WITH ZAIN OBAJI';

update public.services set category_ar = case upper(trim(coalesce(category_en,category,'')))
  when 'PICOWAY LASER' then 'ليزر بيكواي'
  when 'LIPS FILLER' then 'فيلر الشفاه'
  when 'POLYLACTIC ACID' then 'حمض البوليلاكتيك'
  when 'THREADS' then 'الخيوط'
  when 'FRAXIS' then 'فراكسيس'
  else category_ar end
where upper(trim(coalesce(category_en,category,''))) in
  ('PICOWAY LASER','LIPS FILLER','POLYLACTIC ACID','THREADS','FRAXIS');

create or replace function pg_temp.arabic_material_label(input text) returns text language plpgsql immutable as $$
declare v text:=upper(input);
begin
  v:=replace(v,'CONSULTATION DERMATOLOGIST RESIDENT','استشارة طبيب جلدية مقيم');
  v:=replace(v,'CONSULTATION CONSULTANT','استشارة طبيب استشاري');
  v:=replace(v,'CONSULTATION SPECIALIST','استشارة طبيب أخصائي');
  v:=replace(v,'FEMALE FULL BODY HAIR REMOVAL - MORNING','إزالة شعر كامل الجسم للسيدات - صباحًا');
  v:=replace(v,'FEMALE FULL BODY HAIR REMOVAL - EVENING','إزالة شعر كامل الجسم للسيدات - مساءً');
  v:=replace(v,'FEMALE FULL BODY HAIR REMOVAL','إزالة شعر كامل الجسم للسيدات');
  v:=replace(v,'MALE FULL BODY HAIR REMOVAL','إزالة شعر كامل الجسم للرجال');
  v:=replace(v,'FEMALE ONE AREA HAIR REMOVAL','إزالة شعر منطقة واحدة للسيدات');
  v:=replace(v,'MALE ONE AREA HAIR REMOVAL','إزالة شعر منطقة واحدة للرجال');
  v:=replace(v,'SMALL AREA HAIR REMOVAL','إزالة شعر منطقة صغيرة');
  v:=replace(v,'LIPS WHITENING','تفتيح الشفاه'); v:=replace(v,'HYPERPIGMENTATION','التصبغات');
  v:=replace(v,'TATTOO REMOVAL','إزالة الوشم'); v:=replace(v,'GUMMY SMILE','الابتسامة اللثوية');
  v:=replace(v,'MASSETER MUSCLE','عضلة الفك'); v:=replace(v,'HYPERHYDROSIS','فرط التعرق');
  v:=replace(v,'FACE & NECK','الوجه والرقبة'); v:=replace(v,'FOREHEAD','الجبهة');
  v:=replace(v,'LARGE AREA','منطقة كبيرة'); v:=replace(v,'SMALL AREA','منطقة صغيرة');
  v:=replace(v,'BODY FILLER','فيلر الجسم'); v:=replace(v,'SKIN TAG REMOVAL','إزالة الزوائد الجلدية');
  v:=replace(v,'WART REMOVSAL','إزالة الثآليل'); v:=replace(v,'BOTOX','بوتوكس');
  v:=replace(v,'FILLER','فيلر'); v:=replace(v,'MESO','ميزو'); v:=replace(v,'PLASMA','بلازما');
  v:=replace(v,'PEELING','تقشير'); v:=replace(v,'THREAD','خيوط');
  v:=replace(v,'MICRONEEDLING','وخز دقيق'); v:=replace(v,'SURGICAL LASER','ليزر جراحي');
  v:=replace(v,'FRACTIONAL','فراكشنال'); v:=replace(v,'ALLERGAN','أليرغان');
  v:=replace(v,'DYSPORT','ديسبورت'); v:=replace(v,'XIOMEN','زيومين'); v:=replace(v,'RADIESSE','رادييس');
  v:=replace(v,'JUVEDERM','جوفيديرم'); v:=replace(v,'TEOSYAL','تيوسيال');
  v:=replace(v,'RESTYLANE','ريستالين'); v:=replace(v,'BELOTERO','بيلوتيرو');
  v:=replace(v,'STYLAGE','ستايلج'); v:=replace(v,'DERMA STYLE','ديرما ستايل');
  v:=replace(v,'SCULPTRA','سكلبترا'); v:=replace(v,'PROFHILO','بروفايلو');
  v:=replace(v,'JALUPRO','جالوبرو'); v:=replace(v,'DERMAPEN','ديرمابن');
  v:=replace(v,'EXOSOME','إكسوسوم'); v:=replace(v,'TRANXAMIC ACID','حمض الترانيكساميك');
  v:=replace(v,'MINOXIDIL','مينوكسيديل'); v:=replace(v,'DUTASTERIDE','دوتاستيرايد');
  v:=replace(v,'APTOS','أبتوس'); v:=replace(v,'GOLDEN','ذهبية'); v:=replace(v,'AMERICAN','أمريكية');
  v:=replace(v,'SALMON','سلمون'); v:=replace(v,'HYDRO DELUXE','هيدرو ديلوكس');
  v:=regexp_replace(v,'([0-9.]+)[ ]*ML','\1 مل','gi');
  if v !~ '[ء-ي]' then v:='مادة '||input; end if;
  return v;
end$$;

update public.service_variants set name_ar=pg_temp.arabic_material_label(coalesce(name_en,name)) where is_active;

commit;
