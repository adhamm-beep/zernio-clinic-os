begin;

alter table public.clinic_operational_settings
  add column if not exists appointment_reminder_template text not null default 'تذكير: موعدك في {{clinic}} يوم {{date}} الساعة {{time}}.',
  add column if not exists appointment_cancelled_template text not null default 'تم إلغاء موعدك رقم {{appointment}}. تواصل معنا لإعادة الحجز.',
  add column if not exists treatment_follow_up_template text not null default 'نتمنى لك السلامة بعد {{service}}. إذا احتجت مساعدة تواصل معنا.',
  add column if not exists birthday_template text not null default 'كل عام وأنت بخير يا {{patient}} من فريق {{clinic}}.',
  add column if not exists template_default_channel text not null default 'email',
  add column if not exists google_calendar_enabled boolean not null default false,
  add column if not exists integration_status jsonb not null default '{}'::jsonb;

alter table public.clinic_operational_settings
  drop constraint if exists clinic_operational_settings_template_default_channel_check;
alter table public.clinic_operational_settings
  add constraint clinic_operational_settings_template_default_channel_check
  check(template_default_channel in ('email','sms','whatsapp'));

commit;
