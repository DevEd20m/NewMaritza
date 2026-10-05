-- AUD-012 · Las tres tablas de analítica conservaban las siete concesiones por defecto de
-- Supabase para `anon` y `authenticated`. Su migración de origen
-- (20260818000000_analytics_journeys.sql) habilita RLS y revoca el `execute` de las funciones,
-- pero nunca revocó los permisos de tabla — a diferencia de lo que sí hace
-- 20260817000000_production_checkout_hardening.sql:554-559 para las suyas.
--
-- Hoy los datos no están expuestos, porque las tres tablas tienen RLS activo y cero políticas, y
-- eso deniega todo. Esto repone la defensa en profundidad: que el día que alguien añada una
-- política permisiva para un caso concreto no se encuentre además con la concesión ya puesta.
--
-- Lo exige `supabase/tests/analytics_journeys.sql:8`, un test que llevaba tiempo en rojo.
-- Solo service_role —que evade RLS— escribe y lee estas tablas, siempre desde el servidor.

revoke all on table public.analytics_sessions from anon, authenticated;
revoke all on table public.analytics_page_views from anon, authenticated;
revoke all on table public.analytics_delivery_outbox from anon, authenticated;
