-- El panel admin usa NULL = stock ilimitado (igual que product_variants.stock_quantity),
-- pero products.stock_quantity quedó NOT NULL DEFAULT 0 en el remoto: crear producto
-- con stock ilimitado fallaba con not-null violation.
-- La columna original fue creada fuera del historial; la declaración
-- idempotente permite reconstruir una base limpia antes de retirarla en la
-- migración de hardening.
alter table public.products add column if not exists stock_quantity integer default null;
alter table public.products alter column stock_quantity drop not null;
alter table public.products alter column stock_quantity set default null;

-- Los 167 productos existentes tenían el default 0 sin que nadie lo eligiera
-- (el guardado de stock nunca funcionó); restaurar la semántica "ilimitado".
update public.products set stock_quantity = null where stock_quantity = 0;;
