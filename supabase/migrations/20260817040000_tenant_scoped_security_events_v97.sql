begin;

alter table public.security_events
  add column if not exists clinic_id bigint references public.clinics(id) on delete cascade;

create index if not exists security_events_clinic_created_idx
  on public.security_events(clinic_id, created_at desc);

comment on column public.security_events.clinic_id is
  'Tenant scope for security administration. Null is reserved for events that cannot be safely attributed.';

commit;
