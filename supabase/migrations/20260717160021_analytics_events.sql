-- Eventos de comportamiento de visitantes (first-party analytics).
-- Solo el service role escribe/lee; el cliente pasa por /api/track.
create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  user_id uuid references auth.users (id) on delete set null,
  event text not null,
  path text,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  product_slug text,
  variant_id uuid,
  value_cents integer,
  metadata jsonb not null default '{}'::jsonb,
  device text,
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_created_at_idx on public.analytics_events (created_at desc);
create index if not exists analytics_events_event_created_at_idx on public.analytics_events (event, created_at desc);
create index if not exists analytics_events_session_id_idx on public.analytics_events (session_id);

alter table public.analytics_events enable row level security;
-- Sin políticas: solo el service role (que las omite) puede leer/escribir.;
