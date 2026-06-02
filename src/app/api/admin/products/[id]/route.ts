import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth/guards'

const schema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  brand: z.string().optional(),
  category_id: z.string().uuid().nullable().optional(),
  cover_image_url: z.string().url().nullable().optional(),
  is_active: z.boolean(),
  stock_quantity: z.number().int().min(0).nullable(),
  variant_id: z.string().uuid().nullable(),
  variant_name: z.string().min(1),
  sku: z.string().optional(),
  price_cents: z.number().int().positive(),
  compare_at_cents: z.number().int().positive().nullable().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const { id } = await params
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      const fe = parsed.error.flatten().fieldErrors
      const msg = Object.entries(fe).map(([k, v]) => `${k}: ${(v as string[]).join(', ')}`).join(' · ')
      return NextResponse.json({ error: msg || 'Datos inválidos' }, { status: 400 })
    }

    const { name, description, brand, category_id, cover_image_url, is_active, stock_quantity, variant_id, variant_name, sku, price_cents, compare_at_cents } = parsed.data
    const admin = createAdminClient()

    await (admin as any).from('products').update({
      name, description: description ?? null, brand: brand ?? null,
      category_id: category_id ?? null,
      cover_image_url: cover_image_url ?? null,
      is_active, stock_quantity,
    }).eq('id', id)

    if (variant_id) {
      await (admin as any).from('product_variants').update({
        name: variant_name,
        sku: sku || undefined,
      }).eq('id', variant_id)

      // Update active price, or insert if none
      const { data: existingPrice } = await (admin as any)
        .from('product_prices')
        .select('id')
        .eq('variant_id', variant_id)
        .is('effective_to', null)
        .single()

      if (existingPrice) {
        await (admin as any).from('product_prices').update({
          amount_cents: price_cents,
          compare_at_cents: compare_at_cents ?? null,
        }).eq('id', existingPrice.id)
      } else {
        await (admin as any).from('product_prices').insert({
          variant_id,
          currency: 'PEN',
          amount_cents: price_cents,
          compare_at_cents: compare_at_cents ?? null,
          effective_from: new Date().toISOString(),
        })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[admin/products PUT]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const { id } = await params
    const admin = createAdminClient()

    // Soft delete — just deactivate
    await admin.from('products').update({ is_active: false }).eq('id', id)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[admin/products DELETE]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
