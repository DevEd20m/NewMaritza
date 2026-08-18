create extension if not exists pgtap with schema extensions;

select plan(13);

select has_table('public', 'analytics_sessions', 'analytics sessions table exists');
select has_table('public', 'analytics_page_views', 'analytics page views table exists');
select has_table('public', 'analytics_delivery_outbox', 'analytics outbox table exists');
select is(has_table_privilege('anon', 'public.analytics_sessions', 'SELECT'), false, 'anonymous clients cannot read journeys');

delete from public.analytics_sessions where token_hash = repeat('a', 64);
insert into public.analytics_sessions(id, token_hash)
values ('60000000-0000-0000-0000-000000000001', repeat('a', 64));

select is(
  public.ingest_analytics_events(
    '60000000-0000-0000-0000-000000000001',
    '[
      {"event_id":"61000000-0000-0000-0000-000000000001","page_view_id":"62000000-0000-0000-0000-000000000001","event":"page_view","path":"/","occurred_at":"2026-08-18T12:00:00Z","device":"mobile"},
      {"event_id":"61000000-0000-0000-0000-000000000002","page_view_id":"62000000-0000-0000-0000-000000000001","event":"page_engagement","path":"/","occurred_at":"2026-08-18T12:00:15Z","engagement_ms":15000,"page_exit":true,"device":"mobile"}
    ]'::jsonb
  ),
  2,
  'two new journey events are ingested'
);

select is((select count(*)::integer from public.analytics_events where analytics_session_id = '60000000-0000-0000-0000-000000000001'), 2, 'events are persisted');
select is((select page_view_count from public.analytics_sessions where id = '60000000-0000-0000-0000-000000000001'), 1, 'page count increments once');
select is((select active_ms from public.analytics_sessions where id = '60000000-0000-0000-0000-000000000001'), 15000::bigint, 'active time is accumulated');
select is((select engaged_ms from public.analytics_page_views where id = '62000000-0000-0000-0000-000000000001'), 15000::bigint, 'page engagement is accumulated');
select is((select count(*)::integer from public.analytics_delivery_outbox where event_id in ('61000000-0000-0000-0000-000000000001', '61000000-0000-0000-0000-000000000002')), 2, 'each event creates one delivery job');

select is(
  public.ingest_analytics_events(
    '60000000-0000-0000-0000-000000000001',
    '[{"event_id":"61000000-0000-0000-0000-000000000002","page_view_id":"62000000-0000-0000-0000-000000000001","event":"page_engagement","path":"/","occurred_at":"2026-08-18T12:00:15Z","engagement_ms":15000,"page_exit":true,"device":"mobile"}]'::jsonb
  ),
  0,
  'duplicate event is ignored'
);
select is((select active_ms from public.analytics_sessions where id = '60000000-0000-0000-0000-000000000001'), 15000::bigint, 'duplicate does not inflate engagement');

update public.analytics_sessions set last_seen_at = now() - interval '181 days' where id = '60000000-0000-0000-0000-000000000001';
select is(public.cleanup_analytics_journeys(180), 1, 'retention removes journeys older than 180 days');

select * from finish();
