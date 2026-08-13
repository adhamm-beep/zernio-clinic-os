begin;
alter table public.patient_documents add column if not exists visible_to_patient boolean not null default false;
create or replace function public.patient_published_documents() returns jsonb language sql stable security definer set search_path=public as $$select coalesce(jsonb_agg(jsonb_build_object('id',d.id,'type',d.document_type,'title',d.title,'content',d.content,'amount',d.amount,'externalUrl',d.external_url,'createdAt',d.created_at) order by d.created_at desc),'[]'::jsonb) from public.patient_documents d where d.customer_id=public.current_patient_customer_id() and d.visible_to_patient and d.status='active'$$;
grant execute on function public.patient_published_documents() to authenticated;
commit;
