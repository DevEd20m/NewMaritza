-- Synthetic development/staging data only. Never copy production identities,
-- customers, addresses, orders or sessions into this file.

insert into public.categories (id, name, slug, sort_order)
values ('10000000-0000-0000-0000-000000000001', 'Pruebas', 'pruebas', 1)
on conflict (id) do nothing;

insert into public.products (
  id, name, slug, description, category_id, is_active
) values
  (
    '20000000-0000-0000-0000-000000000001',
    'Producto finito de prueba',
    'producto-finito-prueba',
    'Dato sintético para validar inventario en staging.',
    '10000000-0000-0000-0000-000000000001',
    true
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    'Producto ilimitado de prueba',
    'producto-ilimitado-prueba',
    'Dato sintético para validar inventario ilimitado en staging.',
    '10000000-0000-0000-0000-000000000001',
    true
  )
on conflict (id) do nothing;

insert into public.product_variants (
  id, product_id, sku, name, is_active, stock_quantity
) values
  (
    '30000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    'TEST-FINITE-1',
    'Última unidad',
    true,
    1
  ),
  (
    '30000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000002',
    'TEST-UNLIMITED',
    'Ilimitado',
    true,
    null
  )
on conflict (id) do update set
  stock_quantity = excluded.stock_quantity,
  is_active = excluded.is_active;

insert into public.product_prices (
  id, variant_id, currency, amount_cents, effective_from, effective_to
) values
  (
    '40000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    'PEN',
    100,
    now(),
    null
  ),
  (
    '40000000-0000-0000-0000-000000000002',
    '30000000-0000-0000-0000-000000000002',
    'PEN',
    100,
    now(),
    null
  )
on conflict (id) do nothing;
