import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const kitSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['static', 'dynamic']).default('static'),
  is_active: z.boolean().default(true),
  variantIds: z.array(z.string()).min(1),
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
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = await request.json()
    const parsed = kitSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const { name, description, type, is_active, variantIds } = parsed.data
    const admin = createAdminClient()

    const { data: kit } = await (admin as any).from('kits').insert({
      name,
      slug: toSlug(name),
      description: description ?? null,
      type,
      is_active,
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
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = await request.json()
    const parsed = kitSchema.extend({ id: z.string() }).safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const { id, name, description, type, is_active, variantIds } = parsed.data
    const admin = createAdminClient()

    await (admin as any).from('kits').update({
      name,
      slug: toSlug(name),
      description: description ?? null,
      type,
      is_active,
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

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

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
