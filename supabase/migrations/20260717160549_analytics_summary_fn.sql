-- Resumen agregado de analytics_events para el panel del admin.
-- Se llama vía RPC con el service role.
create or replace function public.analytics_summary(p_days integer default 7)
returns jsonb
language sql
stable
as $$
with ev as (
  select * from public.analytics_events
  where created_at >= now() - make_interval(days => p_days)
),
sess as (
  select session_id,
         bool_or(event = 'view_item')       as viewed,
         bool_or(event = 'add_to_cart')     as added,
         bool_or(event = 'begin_checkout')  as checkout,
         bool_or(event = 'purchase')        as purchased,
         bool_or(event = 'quiz_start')      as quiz_started,
         bool_or(event = 'quiz_complete')   as quiz_completed
  from ev
  group by session_id
),
exit_pages as (
  select path, count(*) as sessions
  from (
    select distinct on (e.session_id) e.session_id, e.path
    from ev e
    join sess s on s.session_id = e.session_id and not s.purchased
    where e.event = 'page_view' and e.path is not null
    order by e.session_id, e.created_at desc
  ) t
  group by path
  order by sessions desc
  limit 10
),
top_viewed as (
  select coalesce(metadata->>'name', product_slug) as name,
         product_slug as slug,
         count(*) as views,
         count(distinct session_id) as sessions
  from ev
  where event = 'view_item'
  group by 1, 2
  order by views desc
  limit 10
),
top_added as (
  select coalesce(metadata->>'name', product_slug) as name,
         count(*) as adds
  from ev
  where event = 'add_to_cart'
  group by 1
  order by adds desc
  limit 10
),
errors as (
  select metadata->>'message' as message, created_at
  from ev
  where event = 'checkout_error'
  order by created_at desc
  limit 10
),
first_pv as (
  select distinct on (session_id) session_id, utm_source, referrer
  from ev
  where event = 'page_view'
  order by session_id, created_at asc
),
sources as (
  select coalesce(
           nullif(utm_source, ''),
           case when referrer is null or referrer = '' then 'Directo'
                else regexp_replace(referrer, '^https?://([^/]+).*$', '\1') end
         ) as source,
         count(*) as sessions
  from first_pv
  group by 1
  order by sessions desc
  limit 10
)
select jsonb_build_object(
  'sessions', (select count(*) from sess),
  'page_views', (select count(*) from ev where event = 'page_view'),
  'mobile_sessions', (select count(distinct session_id) from ev where device = 'mobile'),
  'funnel', jsonb_build_object(
    'visited',        (select count(*) from sess),
    'viewed_product', (select count(*) from sess where viewed),
    'added_to_cart',  (select count(*) from sess where added),
    'began_checkout', (select count(*) from sess where checkout),
    'purchased',      (select count(*) from sess where purchased)
  ),
  'quiz', jsonb_build_object(
    'started',   (select count(*) from sess where quiz_started),
    'completed', (select count(*) from sess where quiz_completed)
  ),
  'exit_pages',      (select coalesce(jsonb_agg(jsonb_build_object('path', path, 'sessions', sessions) order by sessions desc), '[]'::jsonb) from exit_pages),
  'top_viewed',      (select coalesce(jsonb_agg(jsonb_build_object('name', name, 'slug', slug, 'views', views, 'sessions', sessions) order by views desc), '[]'::jsonb) from top_viewed),
  'top_added',       (select coalesce(jsonb_agg(jsonb_build_object('name', name, 'adds', adds) order by adds desc), '[]'::jsonb) from top_added),
  'checkout_errors', (select coalesce(jsonb_agg(jsonb_build_object('message', message, 'created_at', created_at) order by created_at desc), '[]'::jsonb) from errors),
  'sources',         (select coalesce(jsonb_agg(jsonb_build_object('source', source, 'sessions', sessions) order by sessions desc), '[]'::jsonb) from sources)
)
$$;;
