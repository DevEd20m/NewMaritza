import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth/guards'

const schema = z.object({
  name: z.string().min(1).max(60),
  slug: z.string().min(1).max(60).regex(/^[a-z0-9-]+$/),
  group: z.enum(['objetivo', 'uso', 'nivel', 'intensidad', 'piel', 'preferencia', 'momento', 'alerta']),
})

export async function GET() {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const admin = createAdminClient()
  const { data: tags } = await (admin as any)
    .from('tags')
    .select('id, name, slug, group')
    .order('group')
    .order('name')

  // Count products per tag
  const { data: counts } = await (admin as any)
    .from('product_tags')
    .select('tag_id')

  const countMap: Record<string, number> = {}
  for (const row of (counts ?? []) as Array<{ tag_id: string }>) {
    countMap[row.tag_id] = (countMap[row.tag_id] ?? 0) + 1
  }

  const result = ((tags ?? []) as Array<{ id: string; name: string; slug: string; group: string }>)
    .map(t => ({ ...t, product_count: countMap[t.id] ?? 0 }))

  return NextResponse.json({ tags: result })
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
  const { error } = await (admin as any).from('tags').insert(parsed.data)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
