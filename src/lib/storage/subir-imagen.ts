import { createClient } from '@/lib/supabase/client'

/**
 * Sube una imagen al bucket `product-images` y devuelve su URL pública.
 *
 * Vive aquí y no dentro de `ImageUploadField.tsx` porque no es parte del componente: es la
 * política de subida del proyecto, y tenerla en un `.tsx` obligaba a arrastrar React y los
 * iconos para poder probarla.
 *
 * Requiere las políticas `admin_*` sobre `storage.objects` (migración 20260714194153). La
 * subida va del navegador directo al almacenamiento, así que **las comprobaciones de aquí son
 * del cliente**: ver AUD-001, que es el hallazgo de que el bucket no las repite.
 */

/** Un año. AC-006-03 · el nombre lleva marca de tiempo, así que el contenido nunca cambia. */
export const CACHE_UN_AÑO = '31536000'

const LIMITE_BYTES = 5 * 1024 * 1024

export async function uploadAdminImage(
  file: File,
  path: string,
): Promise<{ url?: string; error?: string }> {
  if (!file.type.startsWith('image/')) return { error: 'Solo se aceptan imágenes' }
  if (file.size > LIMITE_BYTES) return { error: 'La imagen no puede superar 5 MB' }

  const supabase = createClient()
  const { error } = await supabase.storage
    .from('product-images')
    .upload(path, file, {
      upsert: true,
      contentType: file.type,
      // Revalidar en cada visita una imagen que nunca cambia es pagar dos veces por lo mismo:
      // es parte de lo que agotó la cuota de egress (AUD-013). Los guiones de importación ya
      // lo piden; esto lo iguala para lo que se sube desde el panel.
      cacheControl: CACHE_UN_AÑO,
    })
  if (error) return { error: 'Error al subir: ' + error.message }

  const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(path)
  return { url: publicUrl }
}
