-- Recorridos first-party. La identidad se resuelve únicamente dentro de Supabase.
create table if not exists public.analytics_sessions (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  status text not null default 'anonymous' check (status in ('anonymous', 'identified', 'opted_out')),
  started_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  ended_at timestamptz,
  landing_path text,
  last_path text,
  active_ms bigint not null default 0 check (active_ms >= 0),
  page_view_count integer not null default 0 check (page_view_count >= 0),
  device text check (device is null or device in ('mobile', 'desktop')),
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  user_id uuid references auth.users(id) on delete set null,
  lead_id uuid references public.leads(id) on delete set null,
  quiz_profile_id uuid references public.quiz_profiles(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  identified_at timestamptz,
  whatsapp_code text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.analytics_page_views (
  id uuid primary key,
  session_id uuid not null references public.analytics_sessions(id) on delete cascade,
  path text not null,
  title text,
  entered_at timestamptz not null,
  last_active_at timestamptz not null,
  exited_at timestamptz,
  engaged_ms bigint not null default 0 check (engaged_ms >= 0),
  created_at timestamptz not null default now()
);

alter table public.analytics_events
  add column if not exists analytics_session_id uuid references public.analytics_sessions(id) on delete cascade,
  add column if not exists event_id uuid,
  add column if not exists page_view_id uuid references public.analytics_page_views(id) on delete set null,
  add column if not exists occurred_at timestamptz,
  add column if not exists target_id text,
  add column if not exists target_type text,
  add column if not exists engagement_ms integer;

create unique index if not exists analytics_events_event_id_key
  on public.analytics_events(event_id);

create table if not exists public.analytics_delivery_outbox (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.analytics_events(event_id) on delete cascade,
  provider text not null check (provider in ('amplitude')),
  payload jsonb not null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'sent', 'failed')),
  attempts integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  locked_at timestamptz,
  last_error text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique(event_id, provider)
);

create index if not exists analytics_sessions_recent_idx on public.analytics_sessions(last_seen_at desc);
create index if not exists analytics_sessions_user_idx on public.analytics_sessions(user_id) where user_id is not null;
create index if not exists analytics_sessions_quiz_idx on public.analytics_sessions(quiz_profile_id) where quiz_profile_id is not null;
create index if not exists analytics_sessions_order_idx on public.analytics_sessions(order_id) where order_id is not null;
create index if not exists analytics_page_views_session_idx on public.analytics_page_views(session_id, entered_at);
create index if not exists analytics_events_journey_idx on public.analytics_events(analytics_session_id, occurred_at);
create index if not exists analytics_outbox_pending_idx on public.analytics_delivery_outbox(next_attempt_at, attempts)
  where status in ('pending', 'failed');

alter table public.analytics_sessions enable row level security;
alter table public.analytics_page_views enable row level security;
alter table public.analytics_delivery_outbox enable row level security;

create or replace function public.ingest_analytics_events(
  p_session_id uuid,
  p_events jsonb
) returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event jsonb;
  v_event_row_id uuid;
  v_event_id uuid;
  v_page_id uuid;
  v_type text;
  v_path text;
  v_occurred_at timestamptz;
  v_engagement integer;
  v_inserted integer := 0;
  v_user_id uuid;
  v_device_id text;
  v_session_started bigint;
begin
  select user_id, id::text, floor(extract(epoch from started_at) * 1000)::bigint
    into v_user_id, v_device_id, v_session_started
  from public.analytics_sessions
  where id = p_session_id and status <> 'opted_out'
  for update;

  if not found then return 0; end if;

  for v_event in select value from jsonb_array_elements(p_events)
  loop
    v_event_id := (v_event->>'event_id')::uuid;
    v_page_id := nullif(v_event->>'page_view_id', '')::uuid;
    v_type := v_event->>'event';
    v_path := nullif(v_event->>'path', '');
    v_occurred_at := coalesce(nullif(v_event->>'occurred_at', '')::timestamptz, now());
    v_engagement := least(greatest(coalesce((v_event->>'engagement_ms')::integer, 0), 0), 30000);
    v_event_row_id := null;

    if v_type = 'page_view' and v_page_id is not null and v_path is not null then
      insert into public.analytics_page_views(id, session_id, path, title, entered_at, last_active_at)
      values (v_page_id, p_session_id, v_path, nullif(v_event->>'page_title', ''), v_occurred_at, v_occurred_at)
      on conflict (id) do nothing;
    end if;

    insert into public.analytics_events(
      analytics_session_id, session_id, user_id, event_id, page_view_id,
      event, path, referrer, utm_source, utm_medium, utm_campaign,
      product_slug, variant_id, value_cents, metadata, device,
      occurred_at, target_id, target_type, engagement_ms
    ) values (
      p_session_id, p_session_id::text, v_user_id, v_event_id, v_page_id,
      v_type, v_path, nullif(v_event->>'referrer', ''), nullif(v_event->>'utm_source', ''),
      nullif(v_event->>'utm_medium', ''), nullif(v_event->>'utm_campaign', ''),
      nullif(v_event->>'product_slug', ''), nullif(v_event->>'variant_id', '')::uuid,
      nullif(v_event->>'value_cents', '')::integer, coalesce(v_event->'metadata', '{}'::jsonb),
      nullif(v_event->>'device', ''), v_occurred_at, nullif(v_event->>'target_id', ''),
      nullif(v_event->>'target_type', ''), nullif(v_event->>'engagement_ms', '')::integer
    )
    on conflict (event_id) do nothing
    returning id into v_event_row_id;

    if v_event_row_id is not null then
      v_inserted := v_inserted + 1;
      if v_type = 'page_engagement' and v_page_id is not null and v_engagement > 0 then
        update public.analytics_page_views
        set engaged_ms = engaged_ms + v_engagement,
            last_active_at = greatest(last_active_at, v_occurred_at),
            exited_at = case when coalesce((v_event->>'page_exit')::boolean, false) then v_occurred_at else exited_at end
        where id = v_page_id and session_id = p_session_id;
      end if;
      update public.analytics_sessions
      set last_seen_at = greatest(last_seen_at, v_occurred_at),
          landing_path = coalesce(landing_path, v_path),
          last_path = coalesce(v_path, last_path),
          device = coalesce(device, nullif(v_event->>'device', '')),
          referrer = coalesce(referrer, nullif(v_event->>'referrer', '')),
          utm_source = coalesce(utm_source, nullif(v_event->>'utm_source', '')),
          utm_medium = coalesce(utm_medium, nullif(v_event->>'utm_medium', '')),
          utm_campaign = coalesce(utm_campaign, nullif(v_event->>'utm_campaign', '')),
          active_ms = active_ms + case when v_type = 'page_engagement' then v_engagement else 0 end,
          page_view_count = page_view_count + case when v_type = 'page_view' then 1 else 0 end,
          updated_at = now()
      where id = p_session_id;

      insert into public.analytics_delivery_outbox(event_id, provider, payload)
      values (
        v_event_id,
        'amplitude',
        jsonb_build_object(
          'event_type', v_type,
          'device_id', v_device_id,
          'session_id', v_session_started,
          'time', floor(extract(epoch from v_occurred_at) * 1000)::bigint,
          'insert_id', v_event_id::text,
          'event_properties', jsonb_strip_nulls(jsonb_build_object(
            'path', v_path,
            'target_id', nullif(v_event->>'target_id', ''),
            'target_type', nullif(v_event->>'target_type', ''),
            'product_slug', nullif(v_event->>'product_slug', ''),
            'value_cents', nullif(v_event->>'value_cents', '')::integer,
            'device', nullif(v_event->>'device', ''),
            'properties', coalesce(v_event->'metadata', '{}'::jsonb)
          ))
        )
      ) on conflict (event_id, provider) do nothing;
    end if;
  end loop;

  return v_inserted;
end;
$$;

create or replace function public.link_analytics_session(
  p_token_hash text,
  p_user_id uuid default null,
  p_lead_id uuid default null,
  p_quiz_profile_id uuid default null,
  p_order_id uuid default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare v_session_id uuid;
begin
  update public.analytics_sessions
  set user_id = coalesce(p_user_id, user_id),
      lead_id = coalesce(p_lead_id, lead_id),
      quiz_profile_id = coalesce(p_quiz_profile_id, quiz_profile_id),
      order_id = coalesce(p_order_id, order_id),
      status = case when status = 'opted_out' then status else 'identified' end,
      identified_at = coalesce(identified_at, now()),
      updated_at = now()
  where token_hash = p_token_hash
  returning id into v_session_id;
  return v_session_id;
end;
$$;

create or replace function public.claim_analytics_outbox(p_limit integer default 100)
returns setof public.analytics_delivery_outbox
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with candidates as (
    select id from public.analytics_delivery_outbox
    where attempts < 8 and next_attempt_at <= now()
      and (status in ('pending', 'failed') or (status = 'processing' and locked_at < now() - interval '10 minutes'))
    order by next_attempt_at, created_at
    for update skip locked
    limit greatest(1, least(p_limit, 500))
  )
  update public.analytics_delivery_outbox outbox
  set status = 'processing', attempts = attempts + 1, locked_at = now(), last_error = null
  from candidates where outbox.id = candidates.id
  returning outbox.*;
end;
$$;

create or replace function public.cleanup_analytics_journeys(p_retention_days integer default 180)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare v_deleted integer;
begin
  if p_retention_days < 30 then raise exception 'retention_too_short'; end if;
  delete from public.analytics_sessions where last_seen_at < now() - make_interval(days => p_retention_days);
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

create or replace function public.admin_analytics_session_list(
  p_days integer default 7,
  p_limit integer default 50,
  p_offset integer default 0,
  p_query text default null,
  p_identity text default 'all',
  p_whatsapp boolean default false
) returns table (
  session_id uuid, status text, started_at timestamptz, last_seen_at timestamptz,
  landing_path text, last_path text, active_ms bigint, page_view_count integer,
  device text, source text, display_name text, email text, quiz_profile_id uuid,
  order_id uuid, order_number text, whatsapp_code text, whatsapp_clicked boolean
)
language sql
security definer
set search_path = public
as $$
  select s.id, s.status, s.started_at, s.last_seen_at, s.landing_path, s.last_path,
    s.active_ms, s.page_view_count, s.device,
    coalesce(s.utm_source, nullif(split_part(s.referrer, '/', 3), ''), 'Directo') as source,
    coalesce(nullif(trim(concat_ws(' ', profile.first_name, profile.last_name)), ''), orders.guest_name,
      split_part(coalesce(users.email, leads.email, orders.guest_email, ''), '@', 1), 'Anónimo') as display_name,
    coalesce(users.email, leads.email, orders.guest_email) as email,
    s.quiz_profile_id, s.order_id, orders.order_number, s.whatsapp_code,
    exists(select 1 from public.analytics_events event where event.analytics_session_id = s.id and event.event = 'whatsapp_click')
  from public.analytics_sessions s
  left join public.profiles profile on profile.id = s.user_id
  left join auth.users users on users.id = s.user_id
  left join public.leads leads on leads.id = s.lead_id
  left join public.orders orders on orders.id = s.order_id
  where s.started_at >= now() - make_interval(days => greatest(1, least(p_days, 365)))
    and (p_identity = 'all' or (p_identity = 'identified' and s.status = 'identified') or (p_identity = 'anonymous' and s.status = 'anonymous'))
    and (not p_whatsapp or s.whatsapp_code is not null)
    and (p_query is null or p_query = '' or concat_ws(' ', users.email, leads.email, orders.guest_email,
      orders.guest_name, orders.order_number, s.whatsapp_code) ilike '%' || p_query || '%')
  order by s.last_seen_at desc
  limit greatest(1, least(p_limit, 100)) offset greatest(p_offset, 0);
$$;

create or replace function public.admin_analytics_session_detail(p_session_id uuid)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'session', (select to_jsonb(row_data) from (
      select * from public.admin_analytics_session_list(365, 100, 0, null, 'all', false)
      where session_id = p_session_id
    ) row_data),
    'pages', coalesce((select jsonb_agg(to_jsonb(page_data) order by entered_at) from (
      select id, path, title, entered_at, exited_at, engaged_ms
      from public.analytics_page_views where session_id = p_session_id
    ) page_data), '[]'::jsonb),
    'events', coalesce((select jsonb_agg(to_jsonb(event_data) order by occurred_at) from (
      select event, path, target_id, target_type, product_slug, value_cents, metadata, occurred_at, engagement_ms
      from public.analytics_events where analytics_session_id = p_session_id
    ) event_data), '[]'::jsonb)
  );
$$;

revoke execute on function public.ingest_analytics_events(uuid, jsonb) from public, anon, authenticated;
revoke execute on function public.link_analytics_session(text, uuid, uuid, uuid, uuid) from public, anon, authenticated;
revoke execute on function public.claim_analytics_outbox(integer) from public, anon, authenticated;
revoke execute on function public.cleanup_analytics_journeys(integer) from public, anon, authenticated;
revoke execute on function public.admin_analytics_session_list(integer, integer, integer, text, text, boolean) from public, anon, authenticated;
revoke execute on function public.admin_analytics_session_detail(uuid) from public, anon, authenticated;

grant execute on function public.ingest_analytics_events(uuid, jsonb) to service_role;
grant execute on function public.link_analytics_session(text, uuid, uuid, uuid, uuid) to service_role;
grant execute on function public.claim_analytics_outbox(integer) to service_role;
grant execute on function public.cleanup_analytics_journeys(integer) to service_role;
grant execute on function public.admin_analytics_session_list(integer, integer, integer, text, text, boolean) to service_role;
grant execute on function public.admin_analytics_session_detail(uuid) to service_role;
