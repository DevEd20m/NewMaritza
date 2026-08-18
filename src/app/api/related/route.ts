import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { loadCatalog, buildSuggestions } from '@/lib/recommendation/related'

// Sugerencias determinísticas para el carrito/drawer: dado el contenido del
// carrito (variantIds), devuelve productos afines de las mismas categorías
// sin repetir productos ni ingredientes ya presentes.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get('variants') ?? ''
  const variantIds = raw.split(',').map((s) => s.trim()).filter((s) => UUID_RE.test(s)).slice(0, 30)
  const limit = Math.min(Number(request.nextUrl.searchParams.get('limit')) || 4, 8)

  const admin = createAdminClient()
  const catalog = await loadCatalog(admin)

  const inCart = catalog.filter((c) => variantIds.includes(c.variantId))

  // Categorías del carrito en orden de aparición; si el carrito está vacío o
  // no matchea, sugerir desde las categorías con más surtido.
  const preferredCategories: string[] = []
  for (const item of inCart) {
    if (item.categorySlug && !preferredCategories.includes(item.categorySlug)) {
      preferredCategories.push(item.categorySlug)
    }
  }
  if (preferredCategories.length === 0) {
    const counts = new Map<string, number>()
    for (const c of catalog) {
      if (c.categorySlug) counts.set(c.categorySlug, (counts.get(c.categorySlug) ?? 0) + 1)
    }
    preferredCategories.push(...[...counts.entries()].sort((a, b) => b[1] - a[1]).map(([slug]) => slug))
  }

  const suggestions = buildSuggestions({
    catalog,
    exclude: inCart,
    preferredCategories,
    limit,
  })

  return NextResponse.json(
    { suggestions },
    { headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=600' } },
  )
}
