create extension if not exists pgtap with schema extensions;
create extension if not exists dblink with schema extensions;

select plan(20);

-- Deterministic synthetic fixtures. This database is disposable (db reset in CI).
delete from public.orders where order_number like 'TEST-INV-%';
update public.product_variants
set stock_quantity = 1
where id = '30000000-0000-0000-0000-000000000001';
update public.product_variants
set stock_quantity = null
where id = '30000000-0000-0000-0000-000000000002';

insert into public.orders (
  id, order_number, subtotal_cents, total_cents, currency, status
) values
  ('50000000-0000-0000-0000-000000000001', 'TEST-INV-RACE-A', 100, 100, 'PEN', 'pending_payment'),
  ('50000000-0000-0000-0000-000000000002', 'TEST-INV-RACE-B', 100, 100, 'PEN', 'pending_payment');

insert into public.order_items (
  order_id, variant_id, product_name_snapshot, variant_name_snapshot, quantity, unit_price_cents, currency
) values
  ('50000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'Finito', 'Unidad', 1, 100, 'PEN'),
  ('50000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', 'Finito', 'Unidad', 1, 100, 'PEN');

-- Two independent sessions race for the final finite unit.
do $$
begin
  perform extensions.dblink_connect(
    'reserve_a',
    'host=supabase_db_liora port=5432 dbname=postgres user=postgres password=postgres'
  );
  perform extensions.dblink_connect(
    'reserve_b',
    'host=supabase_db_liora port=5432 dbname=postgres user=postgres password=postgres'
  );
  perform extensions.dblink_send_query(
    'reserve_a',
    $query$select public.reserve_order_inventory('50000000-0000-0000-0000-000000000001'::uuid, 1800)$query$
  );
  perform extensions.dblink_send_query(
    'reserve_b',
    $query$select public.reserve_order_inventory('50000000-0000-0000-0000-000000000002'::uuid, 1800)$query$
  );
  perform * from extensions.dblink_get_result('reserve_a', false) as result(expires_at timestamptz);
  perform * from extensions.dblink_get_result('reserve_b', false) as result(expires_at timestamptz);
  perform extensions.dblink_disconnect('reserve_a');
  perform extensions.dblink_disconnect('reserve_b');
end;
$$;

select is(
  (select stock_quantity from public.product_variants where id = '30000000-0000-0000-0000-000000000001'),
  0,
  'the last finite unit is decremented exactly once'
);
select is(
  (select count(*)::integer from public.inventory_reservations
   where order_id in ('50000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000002')
     and status = 'active'),
  1,
  'exactly one concurrent order owns an active reservation'
);
select ok(
  public.release_order_inventory('50000000-0000-0000-0000-000000000001', 'test_cleanup', false)
  or public.release_order_inventory('50000000-0000-0000-0000-000000000002', 'test_cleanup', false),
  'the winning reservation can be released'
);
select is(
  (select stock_quantity from public.product_variants where id = '30000000-0000-0000-0000-000000000001'),
  1,
  'releasing returns the finite unit exactly once'
);

insert into public.orders (
  id, order_number, subtotal_cents, total_cents, currency, status
) values ('50000000-0000-0000-0000-000000000003', 'TEST-INV-UNLIMITED', 100, 100, 'PEN', 'pending_payment');
insert into public.order_items (
  order_id, variant_id, product_name_snapshot, variant_name_snapshot, quantity, unit_price_cents, currency
) values (
  '50000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000002',
  'Ilimitado', 'Ilimitado', 4, 25, 'PEN'
);

select lives_ok(
  $$select public.reserve_order_inventory('50000000-0000-0000-0000-000000000003'::uuid, 1800)$$,
  'an unlimited-only order receives a checkout reservation'
);
select is(
  (select stock_quantity from public.product_variants where id = '30000000-0000-0000-0000-000000000002'),
  null::integer,
  'unlimited stock stays NULL while reserved'
);
select is(
  (select count(*)::integer from public.inventory_reservation_items items
   join public.inventory_reservations reservation on reservation.id = items.reservation_id
   where reservation.order_id = '50000000-0000-0000-0000-000000000003'),
  0,
  'unlimited variants are omitted from reserved items'
);
select throws_ok(
  $$update public.product_variants set stock_quantity = 10 where id = '30000000-0000-0000-0000-000000000002'$$,
  'P0001',
  'cannot_change_stock_mode_with_active_reservations',
  'admin cannot switch unlimited to finite during an active reservation'
);
select ok(
  public.release_order_inventory('50000000-0000-0000-0000-000000000003', 'test_release', false),
  'unlimited-only reservation releases idempotently'
);
select is(
  (select stock_quantity from public.product_variants where id = '30000000-0000-0000-0000-000000000002'),
  null::integer,
  'unlimited stock stays NULL after release'
);

insert into public.orders (
  id, order_number, subtotal_cents, total_cents, currency, status
) values ('50000000-0000-0000-0000-000000000004', 'TEST-INV-EXPIRED', 100, 100, 'PEN', 'pending_payment');
insert into public.order_items (
  order_id, variant_id, product_name_snapshot, variant_name_snapshot, quantity, unit_price_cents, currency
) values (
  '50000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000001',
  'Finito', 'Unidad', 1, 100, 'PEN'
);

select lives_ok(
  $$select public.reserve_order_inventory('50000000-0000-0000-0000-000000000004'::uuid, 1800)$$,
  'finite inventory can be reserved for expiry testing'
);
update public.inventory_reservations
set expires_at = now() - interval '1 second'
where order_id = '50000000-0000-0000-0000-000000000004';
select is(public.release_expired_inventory_reservations(), 1, 'one expired reservation is recovered');
select is(
  (select stock_quantity from public.product_variants where id = '30000000-0000-0000-0000-000000000001'),
  1,
  'expiry returns finite inventory exactly once'
);
select is(
  (select status from public.orders where id = '50000000-0000-0000-0000-000000000004'),
  'cancelled',
  'expired pending order is cancelled'
);

insert into public.orders (
  id, order_number, subtotal_cents, total_cents, currency, status
) values ('50000000-0000-0000-0000-000000000005', 'TEST-INV-PAID', 100, 100, 'PEN', 'pending_payment');
insert into public.order_items (
  order_id, variant_id, product_name_snapshot, variant_name_snapshot, quantity, unit_price_cents, currency
) values (
  '50000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000001',
  'Finito', 'Unidad', 1, 100, 'PEN'
);
insert into public.payments (
  order_id, provider, status, amount_cents, currency, idempotency_key
) values (
  '50000000-0000-0000-0000-000000000005', 'stripe', 'pending', 100, 'PEN', 'TEST-INV-PAID'
);

select lives_ok(
  $$select public.reserve_order_inventory('50000000-0000-0000-0000-000000000005'::uuid, 1800)$$,
  'paid-order fixture reserves its finite inventory'
);
select is(
  public.finalize_paid_order('50000000-0000-0000-0000-000000000005', 'cs_test_once', 'test'),
  'paid',
  'payment consumes the reservation'
);
select is(
  public.finalize_paid_order('50000000-0000-0000-0000-000000000005', 'cs_test_once', 'test'),
  'already_paid',
  'duplicate fulfillment is idempotent'
);
select is(
  (select count(*)::integer from public.email_queue where order_id = '50000000-0000-0000-0000-000000000005'),
  2,
  'duplicate fulfillment creates one day0 and one day7 outbox job'
);
select is(
  (select stock_quantity from public.product_variants where id = '30000000-0000-0000-0000-000000000001'),
  0,
  'consuming does not decrement a second time'
);
select isnt(
  public.release_order_inventory('50000000-0000-0000-0000-000000000005', 'late_release', false),
  true,
  'a consumed reservation cannot return stock'
);

select * from finish();

delete from public.orders where order_number like 'TEST-INV-%';
update public.product_variants
set stock_quantity = 1
where id = '30000000-0000-0000-0000-000000000001';
