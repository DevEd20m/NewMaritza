import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { loadCatalog, getOtherKits } from '@/lib/recommendation/related'

// Índice ligero para el buscador instantáneo del cliente: catálogo activo
// (productos con precio vigente) + kits. Con ~170 productos el filtrado
// client-side sobra; si el catálogo crece 10x, migrar a full-text en Postgres.

export async function GET() {
  const admin = createAdminClient()
  const [catalog, kits] = await Promise.all([
    loadCatalog(admin),
    getOtherKits(admin, undefined, 50),
  ])

  return NextResponse.json(
    {
      products: catalog.map((c) => ({
        variantId: c.variantId,
        productId: c.productId,
        name: c.name,
        brand: c.brand,
        slug: c.productSlug,
        variantName: c.variantName,
        categoryName: c.categoryName,
        priceCents: c.priceCents,
        currency: c.currency,
        imageUrl: c.imageUrl,
        categoryColor: c.categoryColor,
      })),
      kits: kits.map((k) => ({
        name: k.name,
        slug: k.slug,
        coverImageUrl: k.coverImageUrl,
        totalCents: k.totalCents,
        productCount: k.productCount,
      })),
    },
    { headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=600' } },
  )
}
