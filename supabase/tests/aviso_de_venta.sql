-- US-004 · Enterarse de que entró un pedido
-- docs/specs/ADMIN/enterarse-de-que-entro-un-pedido.md
--
-- AC-004-01 · Cuando un pedido queda pagado, se encola un aviso para el negocio
-- AC-004-02 · El aviso se encola una sola vez por pedido
--
-- La regla la impone finalize_paid_order, que es quien decide que un pedido pasa a pagado.
-- Ningún cliente participa, así que se prueba aquí y no en el navegador.

create extension if not exists pgtap with schema extensions;

select plan(6);

-- ── Montaje ──────────────────────────────────────────────────────────────────
-- Un pedido pagable con su reserva de inventario activa, que es lo que la función consume.
-- Se usan los ids sintéticos de seed.sql para no depender de datos reales.

delete from public.email_queue where order_id = '90000000-0000-4000-8000-000000000001';
delete from public.inventory_reservation_items where reservation_id in (
  select id from public.inventory_reservations where order_id = '90000000-0000-4000-8000-000000000001');
delete from public.inventory_reservations where order_id = '90000000-0000-4000-8000-000000000001';
delete from public.payments where order_id = '90000000-0000-4000-8000-000000000001';
delete from public.order_status_history where order_id = '90000000-0000-4000-8000-000000000001';
delete from public.orders where id = '90000000-0000-4000-8000-000000000001';

insert into public.orders (id, order_number, guest_email, guest_name, subtotal_cents, total_cents, status)
values ('90000000-0000-4000-8000-000000000001', 'TEST-AVISO-1', 'compradora@ejemplo.test',
        'Compradora de prueba', 10000, 10000, 'pending_payment');

insert into public.payments (order_id, provider, status, amount_cents, idempotency_key)
values ('90000000-0000-4000-8000-000000000001', 'stripe', 'pending', 10000, 'test-aviso-1');

insert into public.inventory_reservations (order_id, status, expires_at)
values ('90000000-0000-4000-8000-000000000001', 'active', now() + interval '1 hour');

insert into public.inventory_reservation_items (reservation_id, variant_id, quantity)
select id, '30000000-0000-0000-0000-000000000002', 1
from public.inventory_reservations
where order_id = '90000000-0000-4000-8000-000000000001';

-- ── AC-004-01 ────────────────────────────────────────────────────────────────

select is(
  public.finalize_paid_order('90000000-0000-4000-8000-000000000001', 'ref-test-1', 'pgtap'),
  'paid',
  'AC-004-01 el pedido queda pagado'
);

select is(
  (select count(*)::int from public.email_queue
   where order_id = '90000000-0000-4000-8000-000000000001' and type = 'admin_new_order'),
  1,
  'AC-004-01 se encola exactamente un aviso para el negocio'
);

select is(
  (select count(*)::int from public.email_queue
   where order_id = '90000000-0000-4000-8000-000000000001' and type in ('day0', 'day7')),
  2,
  'AC-004-01 los correos al cliente se siguen encolando'
);

select is(
  (select status from public.email_queue
   where order_id = '90000000-0000-4000-8000-000000000001' and type = 'admin_new_order'),
  'pending',
  'AC-004-01 el aviso nace pendiente, para que lo recoja el worker'
);

-- ── AC-004-02 ────────────────────────────────────────────────────────────────
-- Una segunda confirmación —el webhook y la vuelta del navegador, o un reintento de la
-- pasarela— no puede duplicar el aviso. Se fuerza devolviendo el pedido a pagable, que es
-- el peor caso: la función vuelve a ejecutar el encolado entero.

update public.orders set status = 'pending_payment'
where id = '90000000-0000-4000-8000-000000000001';
update public.inventory_reservations set status = 'active'
where order_id = '90000000-0000-4000-8000-000000000001';

select lives_ok(
  $$ select public.finalize_paid_order('90000000-0000-4000-8000-000000000001', 'ref-test-1', 'pgtap') $$,
  'AC-004-02 una segunda confirmación no revienta'
);

select is(
  (select count(*)::int from public.email_queue
   where order_id = '90000000-0000-4000-8000-000000000001' and type = 'admin_new_order'),
  1,
  'AC-004-02 el aviso al negocio sigue siendo uno solo'
);

-- ── Limpieza ─────────────────────────────────────────────────────────────────

delete from public.email_queue where order_id = '90000000-0000-4000-8000-000000000001';
delete from public.inventory_reservation_items where reservation_id in (
  select id from public.inventory_reservations where order_id = '90000000-0000-4000-8000-000000000001');
delete from public.inventory_reservations where order_id = '90000000-0000-4000-8000-000000000001';
delete from public.payments where order_id = '90000000-0000-4000-8000-000000000001';
delete from public.order_status_history where order_id = '90000000-0000-4000-8000-000000000001';
delete from public.orders where id = '90000000-0000-4000-8000-000000000001';

select * from finish();
