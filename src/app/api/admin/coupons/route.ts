import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  code: z.string().min(2),
  description: z.string().nullable().optional(),
  type: z.enum(['percentage', 'fixed_amount', 'free_shipping']),
  value: z.number().min(0),
  is_active: z.boolean().default(true),
  min_purchase_cents: z.number().int().min(0).nullable().optional(),
  max_uses: z.number().int().positive().nullable().optional(),
  max_uses_per_user: z.number().int().positive().default(1),
  starts_at: z.string().nullable().optional(),
  expires_at: z.string().nullable().optional(),
  color: z.string().default('var(--cat-lavanda)'),
  is_public: z.boolean().default(false),
  new_customers_only: z.boolean().default(false),
  scope: z.enum(['all', 'category']).default('all'),
  scope_category_ids: z.array(z.string().uuid()).nullable().optional(),
})

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if ((profile as { role: string | null } | null)?.role !== 'admin') return null
  return user
}

export async function GET() {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = createAdminClient()
  const { data, error } = await admin.from('coupons').select('*').order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    const fe = parsed.error.flatten().fieldErrors
    const msg = Object.entries(fe).map(([k, v]) => `${k}: ${(v as string[]).join(', ')}`).join(' · ')
    return NextResponse.json({ error: msg || 'Datos inválidos' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await (admin as any).from('coupons').insert({
    ...parsed.data,
    code: parsed.data.code.toUpperCase().replace(/\s+/g, ''),
    created_by: user.id,
  }).select('id').single()

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Ese código ya existe' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ id: data.id })
}
