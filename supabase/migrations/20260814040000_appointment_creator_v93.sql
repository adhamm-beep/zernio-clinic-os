alter table public.appointments
  add column if not exists created_by_staff_id bigint
  default public.current_staff_id()
  references public.staff(id) on delete set null;

create index if not exists appointments_created_by_staff_id_idx
  on public.appointments(created_by_staff_id);
