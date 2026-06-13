import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth/guards'

const schema = z.object({
  name: z.string().min(1).max(60).optional(),
  slug: z.string().min(1).max(60).regex(/^[a-z0-9-]+$/).optional(),
  sort_order: z.number().int().min(0).optional(),
  show_in_hero: z.boolean().optional(),
  hero_sort_order: z.number().int().min(0).optional(),
  hero_tagline: z.string().max(100).nullable().optional(),
  color: z.string().max(80).optional(),
  image_url: z.string().url().nullable().optional(),
})

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const { id } = await params
  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await (admin as any).from('categories').update(parsed.data).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const { id } = await params
  const admin = createAdminClient()

  const { count } = await admin
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('category_id', id)

  if ((count ?? 0) > 0) {
    return NextResponse.json({ error: `No se puede eliminar: tiene ${count} producto(s) asignados` }, { status: 400 })
  }

  const { error } = await admin.from('categories').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
