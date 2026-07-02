import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://liora.pe'

// Google Product Taxonomy IDs
const GOOGLE_CAT: Record<string, string> = {
  piel:          '2973',  // Health & Beauty > Personal Care > Cosmetics > Skin Care
  solar:         '2973',
  bienestar:     '5765',  // Health & Beauty > Health Care > Fitness & Nutrition > Vitamins & Supplements
  gym:           '5765',
  digestivo:     '5765',
  hogar:         '491',   // Health & Beauty > Health Care
  'pies-cuerpo': '491',
  viaje:         '491',
}

function escXml(str: string): string {
  return str.replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c]!))
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createClient<any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: products, error } = await sb
    .from('products')
    .select(`
      name, slug, description, cover_image_url, brand,
      categories ( slug ),
      product_variants (
        sku, is_active,
        product_prices ( amount_cents, currency, effective_to )
      )
    `)
    .eq('is_active', true)

  if (error) {
    return new NextResponse('Feed unavailable', { status: 500 })
  }

  const items: string[] = []

  for (const p of products ?? []) {
    const variant = (p.product_variants as any[])?.find((v: any) => v.is_active)
      ?? (p.product_variants as any[])?.[0]
    if (!variant) continue

    const price = (variant.product_prices as any[])?.find((pr: any) => !pr.effective_to)
    if (!price?.amount_cents) continue

    if (!p.cover_image_url) continue

    const catSlug = (p.categories as any)?.slug ?? ''
    const gcat = GOOGLE_CAT[catSlug] ?? '491'
    const priceFormatted = (price.amount_cents / 100).toFixed(2) + ' PEN'
    const id = variant.sku ?? p.slug
    const desc = p.description ?? p.name

    items.push(`    <item>
      <g:id>${escXml(id)}</g:id>
      <g:title>${escXml(p.name)}</g:title>
      <g:description>${escXml(desc.slice(0, 5000))}</g:description>
      <g:link>${SITE_URL}/tienda/${p.slug}</g:link>
      <g:image_link>${escXml(p.cover_image_url)}</g:image_link>
      <g:price>${priceFormatted}</g:price>
      <g:availability>in_stock</g:availability>
      <g:condition>new</g:condition>${p.brand ? `\n      <g:brand>${escXml(p.brand)}</g:brand>` : ''}
      <g:google_product_category>${gcat}</g:google_product_category>
    </item>`)
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>LIORA</title>
    <link>${SITE_URL}</link>
    <description>Tienda LIORA — Bienestar personalizado</description>
${items.join('\n')}
  </channel>
</rss>`

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
