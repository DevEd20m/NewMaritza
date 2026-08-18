import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'

const eventSchema = z.object({
  session_id: z.string().min(8).max(64),
  event: z.string().min(1).max(60),
  path: z.string().max(300).optional(),
  referrer: z.string().max(500).optional(),
  utm_source: z.string().max(120).optional(),
  utm_medium: z.string().max(120).optional(),
  utm_campaign: z.string().max(120).optional(),
  product_slug: z.string().max(200).optional(),
  variant_id: z.string().uuid().optional(),
  value_cents: z.number().int().min(0).max(100_000_000).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  device: z.enum(['mobile', 'desktop']).optional(),
})

const bodySchema = z.object({ events: z.array(eventSchema).min(1).max(20) })

const BOT_UA = /bot|crawler|spider|crawling|headless|lighthouse|pingdom|facebookexternalhit/i

export async function POST(request: NextRequest) {
  try {
    const ua = request.headers.get('user-agent') ?? ''
    if (!ua || BOT_UA.test(ua)) return new NextResponse(null, { status: 204 })

    const { events } = bodySchema.parse(await request.json())

    const admin = createAdminClient()
    await admin.from('analytics_events').insert(
      events.map((e) => ({
        session_id: e.session_id,
        event: e.event,
        path: e.path ?? null,
        referrer: e.referrer ?? null,
        utm_source: e.utm_source ?? null,
        utm_medium: e.utm_medium ?? null,
        utm_campaign: e.utm_campaign ?? null,
        product_slug: e.product_slug ?? null,
        variant_id: e.variant_id ?? null,
        value_cents: e.value_cents ?? null,
        metadata: (e.metadata ?? {}) as never,
        device: e.device ?? null,
      }))
    )
  } catch {
    // La analítica nunca debe romper la experiencia del cliente.
  }
  return new NextResponse(null, { status: 204 })
}
