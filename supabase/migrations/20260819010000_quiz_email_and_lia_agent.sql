-- Quiz result delivery and catalog-bound Lía conversations.
-- The migration is backwards compatible: existing order email jobs and bot
-- conversations remain valid while the new columns are nullable.

alter table public.quiz_profiles
  add column if not exists submission_key uuid;

create unique index if not exists quiz_profiles_submission_key_unique
  on public.quiz_profiles (submission_key)
  where submission_key is not null;

create table if not exists public.quiz_result_tokens (
  id uuid primary key default gen_random_uuid(),
  quiz_profile_id uuid not null references public.quiz_profiles(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists quiz_result_tokens_expiry_idx
  on public.quiz_result_tokens (expires_at);

alter table public.quiz_result_tokens enable row level security;

alter table public.email_queue
  add column if not exists lead_id uuid references public.leads(id) on delete set null,
  add column if not exists quiz_profile_id uuid references public.quiz_profiles(id) on delete set null,
  add column if not exists recipient_email text;

alter table public.leads
  add column if not exists whatsapp_consent boolean not null default false;

create index if not exists email_queue_quiz_profile_idx
  on public.email_queue (quiz_profile_id)
  where quiz_profile_id is not null;

alter table public.bot_conversations
  add column if not exists quiz_profile_id uuid references public.quiz_profiles(id) on delete cascade;

create index if not exists bot_conversations_quiz_profile_idx
  on public.bot_conversations (quiz_profile_id, updated_at desc)
  where quiz_profile_id is not null;

create or replace function public.submit_quiz_profile_and_email(
  p_submission_key uuid,
  p_session_token text,
  p_result_token text,
  p_result_token_hash text,
  p_template_id uuid,
  p_answers jsonb,
  p_applied_tags text[],
  p_email text,
  p_phone text default null,
  p_whatsapp_consent boolean default false,
  p_user_id uuid default null
) returns table(profile_id uuid, lead_id uuid, email_job_id uuid, profile_session_token text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile_id uuid;
  v_lead_id uuid;
  v_email_job_id uuid;
  v_email text := lower(trim(p_email));
begin
  if p_submission_key is null or p_session_token is null or length(p_session_token) < 32 then
    raise exception 'invalid_quiz_submission';
  end if;
  if v_email is null or v_email = '' or position('@' in v_email) < 2 then
    raise exception 'quiz_email_required';
  end if;

  select qp.id into v_profile_id
  from public.quiz_profiles qp
  where qp.submission_key = p_submission_key;

  if v_profile_id is not null then
    select l.id into v_lead_id
    from public.leads l
    where l.quiz_profile_id = v_profile_id
    order by l.created_at desc
    limit 1;

    select q.id into v_email_job_id
    from public.email_queue q
    where q.quiz_profile_id = v_profile_id and q.type = 'quiz_welcome'
    order by q.created_at desc
    limit 1;

    return query
      select v_profile_id, v_lead_id, v_email_job_id, qp.session_token
      from public.quiz_profiles qp
      where qp.id = v_profile_id;
    return;
  end if;

  insert into public.quiz_profiles (
    submission_key, session_token, user_id, template_id, answers, applied_tags
  ) values (
    p_submission_key, p_session_token, p_user_id, p_template_id,
    coalesce(p_answers, '{}'::jsonb), coalesce(p_applied_tags, '{}'::text[])
  ) returning id into v_profile_id;

  if p_user_id is not null then
    update public.profiles
    set quiz_profile_id = v_profile_id
    where id = p_user_id;
  end if;

  insert into public.leads (email, phone, whatsapp_consent, quiz_profile_id, source)
  values (
    v_email,
    nullif(trim(p_phone), ''),
    p_whatsapp_consent and nullif(trim(p_phone), '') is not null,
    v_profile_id,
    'quiz_p7'
  )
  on conflict (email) do update
    set phone = coalesce(excluded.phone, public.leads.phone),
        whatsapp_consent = excluded.whatsapp_consent,
        quiz_profile_id = excluded.quiz_profile_id,
        source = excluded.source
  returning id into v_lead_id;

  insert into public.quiz_result_tokens (quiz_profile_id, token_hash, expires_at)
  values (v_profile_id, p_result_token_hash, now() + interval '30 days');

  insert into public.email_queue (
    order_id, lead_id, quiz_profile_id, recipient_email, type,
    scheduled_for, status, idempotency_key, payload
  ) values (
    null, v_lead_id, v_profile_id, v_email, 'quiz_welcome',
    now(), 'pending', 'quiz:' || v_profile_id || ':welcome',
    jsonb_build_object('result_token', p_result_token)
  )
  on conflict (idempotency_key) where idempotency_key is not null do update
    set recipient_email = excluded.recipient_email
  returning id into v_email_job_id;

  return query select v_profile_id, v_lead_id, v_email_job_id, p_session_token;
end;
$$;

revoke all on function public.submit_quiz_profile_and_email(
  uuid, text, text, text, uuid, jsonb, text[], text, text, boolean, uuid
) from public, anon, authenticated;
grant execute on function public.submit_quiz_profile_and_email(
  uuid, text, text, text, uuid, jsonb, text[], text, text, boolean, uuid
) to service_role;

create or replace function public.cleanup_expired_quiz_result_tokens()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare v_deleted integer;
begin
  delete from public.quiz_result_tokens where expires_at < now();
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

revoke all on function public.cleanup_expired_quiz_result_tokens() from public, anon, authenticated;
grant execute on function public.cleanup_expired_quiz_result_tokens() to service_role;

comment on table public.quiz_result_tokens is
  'Hashed bearer tokens used to restore access to an emailed quiz result.';
comment on column public.product_variants.stock_quantity is
  'NULL is unlimited stock; zero is unavailable and must not be recommended.';
