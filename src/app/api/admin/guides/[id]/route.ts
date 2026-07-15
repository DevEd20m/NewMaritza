import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/guards'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response
  const { id } = await params
  const body = await req.json()

  const allowed = ['is_active', 'matching_keywords', 'sort_order', 'kit_name', 'tagline', 'description', 'color']
  const update = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)))

  const admin = createAdminClient()
  const { data, error } = await (admin as any).from('kit_guides').update(update).eq('id', id).select('id').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, id: data.id })
}
