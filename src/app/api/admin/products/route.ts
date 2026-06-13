import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth/guards'
import { generateSkuBase } from '@/lib/utils/generate-sku'

const schema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  brand: z.string().optional(),
  category_id: z.string().uuid().nullable().optional(),
  cover_image_url: z.string().url().nullable().optional(),
  is_active: z.boolean().default(true),
  stock_quantity: z.number().int().min(0).nullable().default(null),
  variant_name: z.string().min(1),
  sku: z.string().optional(),
  price_cents: z.number().int().positive(),
  compare_at_cents: z.number().int().positive().nullable().optional(),
  usage_instructions: z.string().optional(),
  indications: z.string().optional(),
  contraindications: z.string().optional(),
  gallery_urls: z.array(z.string().url()).optional(),
})

function toSlug(name: string) {
  return name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      const fe = parsed.error.flatten().fieldErrors
      const msg = Object.entries(fe).map(([k, v]) => `${k}: ${(v as string[]).join(', ')}`).join(' · ')
      return NextResponse.json({ error: msg || 'Datos inválidos' }, { status: 400 })
    }

    const { name, description, brand, category_id, cover_image_url, is_active, stock_quantity, variant_name, sku, price_cents, compare_at_cents, usage_instructions, indications, contraindications, gallery_urls } = parsed.data
    const admin = createAdminClient()

    // Ensure unique slug
    const baseSlug = toSlug(name)
    let slug = baseSlug
    const { data: existing } = await admin.from('products').select('slug').like('slug', `${baseSlug}%`)
    if ((existing ?? []).some((p: { slug: string }) => p.slug === baseSlug)) {
      slug = `${baseSlug}-${Date.now()}`
    }

    const { data: product, error: pErr } = await (admin as any).from('products').insert({
      name, slug, description: description ?? null, brand: brand ?? null,
      category_id: category_id ?? null, cover_image_url: cover_image_url ?? null,
      is_active, stock_quantity,
      usage_instructions: usage_instructions ?? null,
      indications: indications ?? null,
      contraindications: contraindications ?? null,
      gallery_urls: gallery_urls ?? [],
    }).select('id').single()
    if (pErr || !product) return NextResponse.json({ error: pErr?.message ?? 'Error al crear producto' }, { status: 500 })

    let finalSku = sku || ''
    if (!finalSku) {
      const { data: catRow } = await admin.from('categories').select('slug').eq('id', category_id ?? '').single()
      const base = generateSkuBase(catRow?.slug ?? null, name, variant_name)
      finalSku = base
      for (let i = 2; i <= 5; i++) {
        const { data: clash } = await (admin as any).from('product_variants').select('id').eq('sku', finalSku).maybeSingle()
        if (!clash) break
        finalSku = `${base}-${i}`
      }
    }

    const { data: variant, error: vErr } = await (admin as any).from('product_variants').insert({
      product_id: product.id,
      name: variant_name,
      sku: finalSku,
      is_active: true,
    }).select('id').single()
    if (vErr || !variant) return NextResponse.json({ error: vErr?.message ?? 'Error al crear variante' }, { status: 500 })

    await (admin as any).from('product_prices').insert({
      variant_id: variant.id,
      currency: 'PEN',
      amount_cents: price_cents,
      compare_at_cents: compare_at_cents ?? null,
      effective_from: new Date().toISOString(),
    })

    return NextResponse.json({ productId: product.id, slug })
  } catch (err) {
    console.error('[admin/products POST]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
