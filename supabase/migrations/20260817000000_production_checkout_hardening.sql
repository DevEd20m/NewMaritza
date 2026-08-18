-- LIORA production checkout hardening
-- Forward-only and backwards compatible with the currently deployed application.

create extension if not exists pgcrypto with schema extensions;

alter table public.product_variants
  add column if not exists stock_quantity integer default null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'product_variants_stock_quantity_nonnegative'
      and conrelid = 'public.product_variants'::regclass
  ) then
    alter table public.product_variants
      add constraint product_variants_stock_quantity_nonnegative
      check (stock_quantity is null or stock_quantity >= 0) not valid;
    alter table public.product_variants
      validate constraint product_variants_stock_quantity_nonnegative;
  end if;
end;
$$;

alter table public.orders
  add column if not exists checkout_token_hash text,
  add column if not exists tracking_token_hash text,
  add column if not exists reservation_expires_at timestamptz;

create unique index if not exists orders_tracking_token_hash_key
  on public.orders (tracking_token_hash)
  where tracking_token_hash is not null;

do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'orders_status_check'
      and conrelid = 'public.orders'::regclass
  ) then
    alter table public.orders drop constraint orders_status_check;
  end if;
  alter table public.orders add constraint orders_status_check
    check (status in (
      'pending_payment', 'paid', 'payment_review', 'processing',
      'shipped', 'delivered', 'cancelled', 'refunded'
    ));
end;
$$;

create table if not exists public.inventory_reservations (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  status text not null default 'active'
    check (status in ('active', 'consumed', 'released', 'expired')),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  released_at timestamptz,
  release_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.inventory_reservation_items (
  reservation_id uuid not null references public.inventory_reservations(id) on delete cascade,
  variant_id uuid not null references public.product_variants(id),
  quantity integer not null check (quantity > 0),
  primary key (reservation_id, variant_id)
);

create index if not exists inventory_reservations_active_expiry
  on public.inventory_reservations (expires_at)
  where status = 'active';

create index if not exists inventory_reservation_items_variant
  on public.inventory_reservation_items (variant_id);

alter table public.inventory_reservations enable row level security;
alter table public.inventory_reservation_items enable row level security;

alter table public.payment_events
  add column if not exists provider_event_id text,
  add column if not exists processing_error text;

create unique index if not exists payment_events_provider_event_key
  on public.payment_events (provider, provider_event_id)
  where provider_event_id is not null;

alter table public.email_queue
  add column if not exists status text not null default 'pending',
  add column if not exists attempts integer not null default 0,
  add column if not exists locked_at timestamptz,
  add column if not exists last_error text,
  add column if not exists idempotency_key text,
  add column if not exists payload jsonb not null default '{}'::jsonb,
  add column if not exists html_snapshot text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'email_queue_status_check'
      and conrelid = 'public.email_queue'::regclass
  ) then
    alter table public.email_queue add constraint email_queue_status_check
      check (status in ('pending', 'processing', 'sent', 'captured', 'failed'));
  end if;
end;
$$;

update public.email_queue
set status = case when sent then 'sent' else 'pending' end;

create unique index if not exists email_queue_idempotency_key
  on public.email_queue (idempotency_key)
  where idempotency_key is not null;

create index if not exists email_queue_pending_jobs
  on public.email_queue (scheduled_for, attempts)
  where status in ('pending', 'failed');

create table if not exists public.rate_limit_buckets (
  bucket_key text primary key,
  request_count integer not null default 0,
  window_started_at timestamptz not null default now(),
  expires_at timestamptz not null
);

alter table public.rate_limit_buckets enable row level security;

create or replace view public.admin_inventory_reservation_summary
with (security_invoker = true)
as
select
  reservation.id,
  reservation.order_id,
  orders.order_number,
  reservation.status,
  reservation.expires_at,
  reservation.created_at,
  coalesce(sum(item.quantity), 0)::integer as finite_units
from public.inventory_reservations reservation
join public.orders orders on orders.id = reservation.order_id
left join public.inventory_reservation_items item on item.reservation_id = reservation.id
group by reservation.id, orders.order_number;

create or replace view public.admin_failed_email_jobs
with (security_invoker = true)
as
select id, order_id, type, attempts, last_error, scheduled_for, locked_at, created_at
from public.email_queue
where status = 'failed';

create or replace view public.admin_payment_review
with (security_invoker = true)
as
select
  orders.id,
  orders.order_number,
  orders.total_cents,
  orders.currency,
  orders.created_at,
  payments.provider,
  payments.provider_reference,
  payments.updated_at as payment_updated_at
from public.orders
left join public.payments on payments.order_id = orders.id
where orders.status = 'payment_review';

create or replace function public.consume_rate_limit(
  p_bucket_key text,
  p_limit integer,
  p_window_seconds integer
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  if p_limit < 1 or p_window_seconds < 1 then
    raise exception 'invalid_rate_limit_configuration';
  end if;

  insert into public.rate_limit_buckets (
    bucket_key, request_count, window_started_at, expires_at
  ) values (
    p_bucket_key, 1, now(), now() + make_interval(secs => p_window_seconds)
  )
  on conflict (bucket_key) do update set
    request_count = case
      when public.rate_limit_buckets.expires_at <= now() then 1
      else public.rate_limit_buckets.request_count + 1
    end,
    window_started_at = case
      when public.rate_limit_buckets.expires_at <= now() then now()
      else public.rate_limit_buckets.window_started_at
    end,
    expires_at = case
      when public.rate_limit_buckets.expires_at <= now()
        then now() + make_interval(secs => p_window_seconds)
      else public.rate_limit_buckets.expires_at
    end
  returning request_count into v_count;

  return v_count <= p_limit;
end;
$$;

create or replace function public.claim_email_jobs(p_limit integer default 25)
returns setof public.email_queue
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_limit < 1 or p_limit > 100 then
    raise exception 'invalid_email_claim_limit';
  end if;

  return query
  with candidates as (
    select queue.id
    from public.email_queue queue
    where queue.scheduled_for <= now()
      and queue.attempts < 5
      and (
        queue.status in ('pending', 'failed')
        or (queue.status = 'processing' and queue.locked_at < now() - interval '10 minutes')
      )
    order by queue.scheduled_for
    for update skip locked
    limit p_limit
  )
  update public.email_queue queue
  set status = 'processing',
      locked_at = now(),
      attempts = queue.attempts + 1,
      last_error = null
  from candidates
  where queue.id = candidates.id
  returning queue.*;
end;
$$;

create or replace function public.release_order_inventory(
  p_order_id uuid,
  p_reason text default 'released',
  p_expired boolean default false
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reservation public.inventory_reservations%rowtype;
begin
  select * into v_reservation
  from public.inventory_reservations
  where order_id = p_order_id
  for update;

  if not found or v_reservation.status <> 'active' then
    return false;
  end if;

  update public.product_variants as variant
  set stock_quantity = variant.stock_quantity + item.quantity
  from public.inventory_reservation_items as item
  where item.reservation_id = v_reservation.id
    and item.variant_id = variant.id
    and variant.stock_quantity is not null;

  update public.inventory_reservations
  set status = case when p_expired then 'expired' else 'released' end,
      released_at = now(),
      release_reason = p_reason,
      updated_at = now()
  where id = v_reservation.id;

  update public.orders
  set reservation_expires_at = null,
      updated_at = now()
  where id = p_order_id;

  return true;
end;
$$;

create or replace function public.release_expired_inventory_reservations()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_released integer := 0;
begin
  for v_order_id in
    select order_id
    from public.inventory_reservations
    where status = 'active' and expires_at <= now()
    order by expires_at
    for update skip locked
  loop
    if public.release_order_inventory(v_order_id, 'reservation_timeout', true) then
      update public.orders
      set status = 'cancelled', updated_at = now()
      where id = v_order_id and status = 'pending_payment';
      v_released := v_released + 1;
    end if;
  end loop;
  return v_released;
end;
$$;

create or replace function public.reserve_order_inventory(
  p_order_id uuid,
  p_ttl_seconds integer default 1800
) returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reservation_id uuid;
  v_expires_at timestamptz;
  v_status text;
  v_bad_variant uuid;
begin
  if p_ttl_seconds < 60 or p_ttl_seconds > 86400 then
    raise exception 'invalid_reservation_ttl';
  end if;

  perform public.release_expired_inventory_reservations();

  select status into v_status
  from public.orders
  where id = p_order_id
  for update;

  if not found then raise exception 'order_not_found'; end if;
  if v_status <> 'pending_payment' then raise exception 'order_not_pending'; end if;

  select id, expires_at into v_reservation_id, v_expires_at
  from public.inventory_reservations
  where order_id = p_order_id and status = 'active'
  for update;

  if found then return v_expires_at; end if;

  -- Lock every variant in deterministic order before validating/decrementing.
  perform variant.id
  from public.product_variants as variant
  join (
    select variant_id, sum(quantity)::integer as quantity
    from public.order_items
    where order_id = p_order_id and variant_id is not null
    group by variant_id
  ) as requested on requested.variant_id = variant.id
  order by variant.id
  for update of variant;

  select requested.variant_id into v_bad_variant
  from (
    select variant_id, sum(quantity)::integer as quantity
    from public.order_items
    where order_id = p_order_id and variant_id is not null
    group by variant_id
  ) as requested
  left join public.product_variants as variant on variant.id = requested.variant_id
  left join public.products as product on product.id = variant.product_id
  where variant.id is null
     or not coalesce(variant.is_active, false)
     or not coalesce(product.is_active, false)
     or (variant.stock_quantity is not null and variant.stock_quantity < requested.quantity)
  limit 1;

  if v_bad_variant is not null then
    raise exception using
      errcode = 'P0001',
      message = 'stock_insufficient',
      detail = v_bad_variant::text;
  end if;

  v_expires_at := now() + make_interval(secs => p_ttl_seconds);

  insert into public.inventory_reservations (order_id, expires_at)
  values (p_order_id, v_expires_at)
  on conflict (order_id) do update set
    status = 'active',
    expires_at = excluded.expires_at,
    consumed_at = null,
    released_at = null,
    release_reason = null,
    updated_at = now()
  returning id into v_reservation_id;

  delete from public.inventory_reservation_items
  where reservation_id = v_reservation_id;

  -- Unlimited variants (NULL) deliberately never become reservation items.
  insert into public.inventory_reservation_items (
    reservation_id, variant_id, quantity
  )
  select v_reservation_id, variant.id, requested.quantity
  from (
    select variant_id, sum(quantity)::integer as quantity
    from public.order_items
    where order_id = p_order_id and variant_id is not null
    group by variant_id
  ) as requested
  join public.product_variants as variant on variant.id = requested.variant_id
  where variant.stock_quantity is not null;

  update public.product_variants as variant
  set stock_quantity = variant.stock_quantity - item.quantity
  from public.inventory_reservation_items as item
  where item.reservation_id = v_reservation_id
    and item.variant_id = variant.id;

  update public.orders
  set reservation_expires_at = v_expires_at, updated_at = now()
  where id = p_order_id;

  return v_expires_at;
end;
$$;

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

  insert into public.email_queue (
    order_id, type, scheduled_for, status, idempotency_key
  ) values
    (p_order_id, 'day0', now(), 'pending', 'order:' || p_order_id || ':day0'),
    (p_order_id, 'day7', now() + interval '7 days', 'pending', 'order:' || p_order_id || ':day7')
  on conflict (idempotency_key) where idempotency_key is not null do nothing;

  return 'paid';
end;
$$;

create or replace function public.prevent_stock_mode_change_with_active_reservations()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (old.stock_quantity is null) <> (new.stock_quantity is null)
     and exists (
       select 1
       from public.inventory_reservations reservation
       join public.order_items item on item.order_id = reservation.order_id
       where item.variant_id = old.id and reservation.status = 'active'
     ) then
    raise exception 'cannot_change_stock_mode_with_active_reservations';
  end if;
  return new;
end;
$$;

drop trigger if exists product_variants_stock_mode_guard on public.product_variants;
create trigger product_variants_stock_mode_guard
before update of stock_quantity on public.product_variants
for each row execute function public.prevent_stock_mode_change_with_active_reservations();

-- Retire both legacy stock paths. Application code already reads and writes
-- product_variants only; decrementing is now exclusive to reservation RPCs.
drop function if exists public.decrement_variant_stock(uuid, integer);
alter table public.products drop column if exists stock_quantity;

revoke all on table public.inventory_reservations from anon, authenticated;
revoke all on table public.inventory_reservation_items from anon, authenticated;
revoke all on table public.rate_limit_buckets from anon, authenticated;
revoke all on table public.admin_inventory_reservation_summary from anon, authenticated;
revoke all on table public.admin_failed_email_jobs from anon, authenticated;
revoke all on table public.admin_payment_review from anon, authenticated;
grant select on table public.admin_inventory_reservation_summary to service_role;
grant select on table public.admin_failed_email_jobs to service_role;
grant select on table public.admin_payment_review to service_role;

revoke all on function public.consume_rate_limit(text, integer, integer) from public, anon, authenticated;
revoke all on function public.claim_email_jobs(integer) from public, anon, authenticated;
revoke all on function public.reserve_order_inventory(uuid, integer) from public, anon, authenticated;
revoke all on function public.release_order_inventory(uuid, text, boolean) from public, anon, authenticated;
revoke all on function public.release_expired_inventory_reservations() from public, anon, authenticated;
revoke all on function public.finalize_paid_order(uuid, text, text) from public, anon, authenticated;

grant execute on function public.consume_rate_limit(text, integer, integer) to service_role;
grant execute on function public.claim_email_jobs(integer) to service_role;
grant execute on function public.reserve_order_inventory(uuid, integer) to service_role;
grant execute on function public.release_order_inventory(uuid, text, boolean) to service_role;
grant execute on function public.release_expired_inventory_reservations() to service_role;
grant execute on function public.finalize_paid_order(uuid, text, text) to service_role;

comment on column public.product_variants.stock_quantity is
  'NULL = unlimited inventory. Non-negative integer = available finite inventory after active reservations.';
