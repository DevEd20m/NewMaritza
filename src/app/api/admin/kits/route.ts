import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth/guards'

const kitSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['static', 'dynamic']).default('static'),
  is_active: z.boolean().default(true),
  variantIds: z.array(z.string()).min(1),
  cover_image_url: z.string().url().nullable().optional(),
  show_in_home: z.boolean().optional(),
  home_sort_order: z.number().int().min(0).optional(),
  benefits: z.array(z.object({
    icon: z.string(),
    title: z.string().min(1),
    desc: z.string(),
  })).max(3).optional(),
})

function toSlug(name: string) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const body = await request.json()
    const parsed = kitSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const { name, description, type, is_active, variantIds } = parsed.data
    const admin = createAdminClient()

    const { cover_image_url, show_in_home, home_sort_order, benefits } = parsed.data
    const { data: kit } = await (admin as any).from('kits').insert({
      name,
      slug: toSlug(name),
      description: description ?? null,
      type,
      is_active,
      cover_image_url: cover_image_url ?? null,
      show_in_home: show_in_home ?? false,
      home_sort_order: home_sort_order ?? 0,
      benefits: benefits ?? [],
    }).select('id').single()

    if (!kit) return NextResponse.json({ error: 'Error al crear kit' }, { status: 500 })

    await (admin as any).from('kit_products').insert(
      variantIds.map((vid: string, i: number) => ({
        kit_id: kit.id,
        variant_id: vid,
        quantity: 1,
        sort_order: i,
        is_required: true,
      }))
    )

    return NextResponse.json({ kitId: kit.id })
  } catch (err) {
    console.error('[admin/kits POST]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const body = await request.json()
    const parsed = kitSchema.extend({ id: z.string() }).safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const { id, name, description, type, is_active, variantIds, cover_image_url, show_in_home, home_sort_order, benefits } = parsed.data
    const admin = createAdminClient()

    await (admin as any).from('kits').update({
      name,
      slug: toSlug(name),
      description: description ?? null,
      type,
      is_active,
      cover_image_url: cover_image_url ?? null,
      show_in_home: show_in_home ?? false,
      home_sort_order: home_sort_order ?? 0,
      benefits: benefits ?? [],
    }).eq('id', id)

    await (admin as any).from('kit_products').delete().eq('kit_id', id)
    await (admin as any).from('kit_products').insert(
      variantIds.map((vid: string, i: number) => ({
        kit_id: id,
        variant_id: vid,
        quantity: 1,
        sort_order: i,
        is_required: true,
      }))
    )

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[admin/kits PUT]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response
    const { id, ...fields } = await request.json()
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    const allowed = ['show_in_home', 'home_sort_order', 'cover_image_url', 'is_active']
    const update = Object.fromEntries(Object.entries(fields).filter(([k]) => allowed.includes(k)))
    const admin = createAdminClient()
    await (admin as any).from('kits').update(update).eq('id', id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[admin/kits PATCH]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

    const admin = createAdminClient()
    await (admin as any).from('kit_products').delete().eq('kit_id', id)
    await (admin as any).from('kits').delete().eq('id', id)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[admin/kits DELETE]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
