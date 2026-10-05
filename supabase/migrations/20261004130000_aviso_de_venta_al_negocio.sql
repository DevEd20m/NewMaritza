-- US-004 · Enterarse de que entró un pedido
-- docs/specs/ADMIN/enterarse-de-que-entro-un-pedido.md
--
-- finalize_paid_order encolaba dos correos, ambos al cliente. Añade un tercero para el negocio.
-- Se reescribe la función entera porque PostgreSQL no permite parchear un cuerpo: el resto es
-- idéntico a 20260817000000_production_checkout_hardening.sql, salvo el bloque marcado AC-004.

create or replace function public.finalize_paid_order(
  p_order_id uuid,
  p_provider_reference text,
  p_source text
) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_reservation public.inventory_reservations%rowtype;
  v_bad_variant uuid;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then return 'order_not_found'; end if;
  if v_order.status = 'paid' then return 'already_paid'; end if;
  if v_order.status not in ('pending_payment', 'payment_review') then
    return 'order_not_payable';
  end if;

  select * into v_reservation
  from public.inventory_reservations
  where order_id = p_order_id
  for update;

  if not found then return 'reservation_not_found'; end if;

  if v_reservation.status in ('released', 'expired') then
    perform variant.id
    from public.product_variants as variant
    join public.inventory_reservation_items as item
      on item.variant_id = variant.id and item.reservation_id = v_reservation.id
    order by variant.id
    for update of variant;

    select item.variant_id into v_bad_variant
    from public.inventory_reservation_items as item
    join public.product_variants as variant on variant.id = item.variant_id
    where item.reservation_id = v_reservation.id
      and (variant.stock_quantity is null or variant.stock_quantity < item.quantity)
    limit 1;

    if v_bad_variant is not null then
      update public.orders set status = 'payment_review', updated_at = now()
      where id = p_order_id;
      update public.payments
      set status = 'succeeded', provider_reference = p_provider_reference, updated_at = now()
      where order_id = p_order_id;
      insert into public.order_status_history (order_id, status, note, created_by)
      values (p_order_id, 'payment_review', 'Pago recibido sin inventario disponible', p_source);
      return 'payment_review';
    end if;

    update public.product_variants as variant
    set stock_quantity = variant.stock_quantity - item.quantity
    from public.inventory_reservation_items as item
    where item.reservation_id = v_reservation.id
      and item.variant_id = variant.id;
  end if;

  update public.inventory_reservations
  set status = 'consumed', consumed_at = now(), updated_at = now()
  where id = v_reservation.id;

  update public.orders
  set status = 'paid', reservation_expires_at = null, updated_at = now()
  where id = p_order_id;

  update public.payments
  set status = 'succeeded', provider_reference = p_provider_reference, updated_at = now()
  where order_id = p_order_id;

  insert into public.order_status_history (order_id, status, note, created_by)
  values (p_order_id, 'paid', 'Pago confirmado y reserva consumida', p_source);

  if v_order.coupon_id is not null then
    update public.coupons
    set used_count = coalesce(used_count, 0) + 1
    where id = v_order.coupon_id;
  end if;

  -- AC-004-01 · el aviso al negocio va por la misma cola que los correos al cliente: así
  -- hereda los reintentos, el repesque por cron y la idempotencia que ya existen.
  -- AC-004-02 · esa idempotencia es la clave única parcial sobre idempotency_key: una segunda
  -- confirmación del pago reejecuta este insert y el `do nothing` lo absorbe.
  -- Nótese que este bloque solo se alcanza en el camino que devuelve 'paid'. Un pedido que
  -- queda en 'payment_review' sale antes y no genera aviso de venta, que es lo que pide la
  -- historia: no hay nada que despachar todavía.
  insert into public.email_queue (
    order_id, type, scheduled_for, status, idempotency_key
  ) values
    (p_order_id, 'day0', now(), 'pending', 'order:' || p_order_id || ':day0'),
    (p_order_id, 'day7', now() + interval '7 days', 'pending', 'order:' || p_order_id || ':day7'),
    (p_order_id, 'admin_new_order', now(), 'pending', 'order:' || p_order_id || ':admin_new_order')
  on conflict (idempotency_key) where idempotency_key is not null do nothing;

  return 'paid';
end;
$$;

-- Los permisos no cambian: create or replace los conserva, pero se repiten para que esta
-- migración sea legible por sí sola y para que un `db reset` no dependa del orden.
revoke all on function public.finalize_paid_order(uuid, text, text) from public, anon, authenticated;
grant execute on function public.finalize_paid_order(uuid, text, text) to service_role;
