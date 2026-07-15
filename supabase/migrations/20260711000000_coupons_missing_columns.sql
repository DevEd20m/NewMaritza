-- Sincroniza columnas de coupons que existen en la BD remota pero faltaban en migraciones.
-- En producción ya existen (no-op por IF NOT EXISTS); esto alinea entornos nuevos y db reset.

alter table public.coupons add column if not exists description text;
alter table public.coupons add column if not exists used_count integer default 0;
alter table public.coupons add column if not exists color text default 'var(--cat-lavanda)';
alter table public.coupons add column if not exists is_public boolean default false;
alter table public.coupons add column if not exists new_customers_only boolean default false;
alter table public.coupons add column if not exists audience text default 'everyone';
alter table public.coupons add column if not exists placements text[] default array['exit_modal'::text];
alter table public.coupons add column if not exists promo_title text;
alter table public.coupons add column if not exists promo_subtitle text;
alter table public.coupons add column if not exists promo_cta text;
