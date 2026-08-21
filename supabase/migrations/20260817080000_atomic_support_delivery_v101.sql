begin;

create or replace function public.create_support_ticket(
  p_subject text,
  p_category text default 'question',
  p_priority text default 'normal',
  p_body text default null
) returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_staff_id bigint := public.current_staff_id();
  v_clinic_id bigint := public.current_clinic_id();
  v_branch_id bigint := public.current_branch_id();
  v_ticket_id bigint;
begin
  if auth.uid() is null then
    raise exception 'SUPPORT_AUTH_REQUIRED';
  end if;
  if v_staff_id is null or v_clinic_id is null then
    raise exception 'SUPPORT_STAFF_PROFILE_REQUIRED';
  end if;
  if not public.has_hr_permission('support.create') then
    raise exception 'SUPPORT_CREATE_PERMISSION_REQUIRED';
  end if;
  if char_length(trim(coalesce(p_subject, ''))) not between 3 and 180 then
    raise exception 'SUPPORT_SUBJECT_INVALID';
  end if;
  if char_length(trim(coalesce(p_body, ''))) not between 1 and 4000 then
    raise exception 'SUPPORT_MESSAGE_INVALID';
  end if;
  if p_category not in ('question', 'problem', 'suggestion') then
    raise exception 'SUPPORT_CATEGORY_INVALID';
  end if;
  if p_priority not in ('low', 'normal', 'high', 'urgent') then
    raise exception 'SUPPORT_PRIORITY_INVALID';
  end if;

  insert into public.support_tickets(
    clinic_id, branch_id, requester_staff_id, subject, category, priority
  ) values (
    v_clinic_id, v_branch_id, v_staff_id, trim(p_subject), p_category, p_priority
  ) returning id into v_ticket_id;

  insert into public.support_messages(ticket_id, sender_staff_id, body)
  values (v_ticket_id, v_staff_id, trim(p_body));

  return v_ticket_id;
end;
$$;

create or replace function public.send_support_message(
  p_ticket_id bigint,
  p_body text
) returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_staff_id bigint := public.current_staff_id();
  v_clinic_id bigint := public.current_clinic_id();
  v_ticket public.support_tickets%rowtype;
  v_message_id bigint;
begin
  if auth.uid() is null then
    raise exception 'SUPPORT_AUTH_REQUIRED';
  end if;
  if v_staff_id is null or v_clinic_id is null then
    raise exception 'SUPPORT_STAFF_PROFILE_REQUIRED';
  end if;
  if char_length(trim(coalesce(p_body, ''))) not between 1 and 4000 then
    raise exception 'SUPPORT_MESSAGE_INVALID';
  end if;

  select * into v_ticket
  from public.support_tickets
  where id = p_ticket_id and clinic_id = v_clinic_id;

  if not found then
    raise exception 'SUPPORT_TICKET_NOT_FOUND';
  end if;
  if v_ticket.status = 'closed' then
    raise exception 'SUPPORT_TICKET_CLOSED';
  end if;
  if v_ticket.requester_staff_id <> v_staff_id
     and not public.has_hr_permission('support.manage') then
    raise exception 'SUPPORT_TICKET_ACCESS_DENIED';
  end if;

  insert into public.support_messages(ticket_id, sender_staff_id, body)
  values (p_ticket_id, v_staff_id, trim(p_body))
  returning id into v_message_id;

  return v_message_id;
end;
$$;

revoke all on function public.create_support_ticket(text,text,text,text) from public;
revoke all on function public.send_support_message(bigint,text) from public;
grant execute on function public.create_support_ticket(text,text,text,text) to authenticated;
grant execute on function public.send_support_message(bigint,text) to authenticated;

commit;
