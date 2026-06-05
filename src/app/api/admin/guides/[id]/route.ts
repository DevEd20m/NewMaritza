import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data } = await (supabase as any).from('profiles').select('role').eq('id', user.id).single()
  return (data as any)?.role === 'admin'
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await assertAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  const { id } = await params
  const body = await req.json()

  const allowed = ['is_active', 'matching_keywords', 'sort_order', 'kit_name', 'tagline', 'description', 'color']
  const update = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)))

  const admin = createAdminClient()
  const { data, error } = await (admin as any).from('kit_guides').update(update).eq('id', id).select('id').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, id: data.id })
}
