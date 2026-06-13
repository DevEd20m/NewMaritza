import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  free_shipping_threshold_cents: z.number().int().min(0),
  shipping_cost_cents: z.number().int().min(0),
  delivery_message: z.string().min(1).max(120),
  whatsapp_number: z.string().regex(/^\d{7,15}$/, 'Número inválido (solo dígitos, con código de país)'),
  hero_image_url: z.string().url().or(z.literal('')).optional(),
  instagram_url: z.string().url().or(z.literal('')).optional(),
  tiktok_url: z.string().url().or(z.literal('')).optional(),
  email_contact: z.string().email().or(z.literal('')).optional(),
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
  const { data } = await (admin as any).from('store_settings').select('key, value')
  const map = Object.fromEntries(((data ?? []) as Array<{ key: string; value: string }>).map((r) => [r.key, r.value]))

  return NextResponse.json({
    free_shipping_threshold_cents: Number(map.free_shipping_threshold_cents ?? 15000),
    shipping_cost_cents: Number(map.shipping_cost_cents ?? 1500),
    delivery_message: map.delivery_message ?? 'Lima 36–48h · Provincias 3–5 días',
    whatsapp_number: map.whatsapp_number ?? '51999999999',
    hero_image_url: map.hero_image_url ?? null,
    instagram_url: map.instagram_url ?? null,
    tiktok_url: map.tiktok_url ?? null,
    email_contact: map.email_contact ?? null,
  })
}

export async function PUT(request: NextRequest) {
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
  const upserts = (Object.entries(parsed.data) as Array<[string, string | number]>).map(([key, value]) => ({
    key,
    value: String(value),
    updated_at: new Date().toISOString(),
  }))

  const { error } = await (admin as any)
    .from('store_settings')
    .upsert(upserts, { onConflict: 'key' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
