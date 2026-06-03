import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth/guards'

const schema = z.object({
  name: z.string().min(1).max(60),
  slug: z.string().min(1).max(60).regex(/^[a-z0-9-]+$/),
  parent_id: z.string().uuid().nullable().optional(),
  sort_order: z.number().int().min(0).optional(),
})

export async function GET() {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const admin = createAdminClient()
  const { data: categories } = await admin
    .from('categories')
    .select('id, name, slug, parent_id, sort_order, created_at')
    .order('sort_order')
    .order('name')

  const { data: products } = await admin
    .from('products')
    .select('category_id')
    .eq('is_active', true)

  const countMap: Record<string, number> = {}
  for (const p of (products ?? []) as Array<{ category_id: string | null }>) {
    if (p.category_id) countMap[p.category_id] = (countMap[p.category_id] ?? 0) + 1
  }

  const result = ((categories ?? []) as Array<{ id: string; name: string; slug: string; parent_id: string | null; sort_order: number; created_at: string }>)
    .map(c => ({ ...c, product_count: countMap[c.id] ?? 0 }))

  return NextResponse.json({ categories: result })
}

export async function POST(request: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    const msg = Object.entries(parsed.error.flatten().fieldErrors).map(([k, v]) => `${k}: ${(v as string[]).join(', ')}`).join(' · ')
    return NextResponse.json({ error: msg || 'Datos inválidos' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin.from('categories').insert({
    name: parsed.data.name,
    slug: parsed.data.slug,
    parent_id: parsed.data.parent_id ?? null,
    sort_order: parsed.data.sort_order ?? 0,
  })
  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Ya existe una categoría con ese slug' }, { status: 400 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
