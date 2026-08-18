-- El upload de storage hace INSERT ... RETURNING *, que exige política de SELECT
create policy "public_read_product_images" on storage.objects
  for select
  using (bucket_id = 'product-images');

-- Restaurar la política de INSERT limpia (sin la sonda de diagnóstico)
drop policy "admin_insert_product_images" on storage.objects;
create policy "admin_insert_product_images" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'product-images'
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Limpieza de artefactos de diagnóstico
drop function if exists public._debug_storage_ctx();
drop sequence if exists public._probe_executed;
drop sequence if exists public._probe_uid_ok;
drop sequence if exists public._probe_admin_ok;;
