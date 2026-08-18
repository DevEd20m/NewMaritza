-- Políticas de storage para que los admins puedan subir imágenes al bucket
-- product-images desde el panel (el bucket es público para lectura, pero
-- storage.objects no tenía ninguna política => todo INSERT era rechazado).

-- El upload de storage-api hace INSERT ... RETURNING *: sin política de SELECT
-- el RETURNING falla con "new row violates row-level security policy" aunque
-- el INSERT en sí esté permitido. Que el bucket sea public:true no cubre esto.
create policy "public_read_product_images" on storage.objects
  for select
  using (bucket_id = 'product-images');

create policy "admin_insert_product_images" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'product-images'
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- upsert:true en el cliente requiere también UPDATE
create policy "admin_update_product_images" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'product-images'
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  )
  with check (
    bucket_id = 'product-images'
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "admin_delete_product_images" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'product-images'
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Hardening: estas tablas estaban expuestas vía PostgREST sin RLS.
-- Solo el service role las usa (src/lib/settings.ts, cron, mark-paid),
-- así que habilitar RLS sin políticas no rompe nada.
alter table public.store_settings enable row level security;
alter table public.email_queue enable row level security;
