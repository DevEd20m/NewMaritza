import { describe, expect, it, vi, beforeEach } from 'vitest'

// US-006 · AC-006-03 · Una imagen de catálogo se sube como cacheable
// docs/specs/TIENDA/servir-el-catalogo-sin-malgastar.md
//
// El nombre de archivo lleva marca de tiempo, así que el contenido de una URL nunca cambia: no hay
// motivo para que el navegador revalide. Los guiones de importación ya lo piden; el uploader del
// panel no, y es el que se usa a diario.

const upload = vi.fn()
const getPublicUrl = vi.fn(() => ({ data: { publicUrl: 'https://ejemplo.test/imagen.png' } }))

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    storage: { from: () => ({ upload, getPublicUrl }) },
  }),
}))

/** Un año. Es lo que ya piden scripts/catalog-builder.mjs y scripts/migrate-images.mjs. */
const UN_AÑO = '31536000'

describe('AC-006-03 una imagen de catálogo se sube como cacheable', () => {
  beforeEach(() => {
    upload.mockReset()
    upload.mockResolvedValue({ error: null })
  })

  it('AC-006-03 la subida declara una caché larga', async () => {
    const { uploadAdminImage } = await import('@/lib/storage/subir-imagen')
    const archivo = new File([new Uint8Array([1, 2, 3])], 'foto.png', { type: 'image/png' })

    await uploadAdminImage(archivo, 'catalog/producto/cover-123.png')

    const opciones = upload.mock.calls.at(-1)![2]
    expect(opciones?.cacheControl, 'la subida no declara cacheControl').toBeDefined()
    expect(String(opciones.cacheControl)).toBe(UN_AÑO)
  })

  it('AC-006-03 sigue conservando el tipo de contenido y el upsert', async () => {
    const { uploadAdminImage } = await import('@/lib/storage/subir-imagen')
    const archivo = new File([new Uint8Array([1])], 'foto.webp', { type: 'image/webp' })

    await uploadAdminImage(archivo, 'catalog/producto/cover-456.webp')

    const opciones = upload.mock.calls.at(-1)![2]
    expect(opciones.contentType).toBe('image/webp')
    expect(opciones.upsert).toBe(true)
  })
})
