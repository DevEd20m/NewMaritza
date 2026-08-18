import { randomBytes, randomUUID } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { WHATSAPP_PLACEMENTS } from '@/lib/analytics/whatsapp'
import { ensureAnalyticsSession, ingestAnalyticsEvents } from '@/lib/analytics/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStoreSettings } from '@/lib/settings'

const querySchema = z.object({
  placement: z.enum(WHATSAPP_PLACEMENTS),
  message: z.string().max(240).optional(),
})

function sourcePath(request: NextRequest): string {
  const referrer = request.headers.get('referer')
  if (!referrer) return '/'
  try {
    const url = new URL(referrer)
    return url.origin === request.nextUrl.origin ? url.pathname : '/'
  } catch { return '/' }
}

async function assignWhatsappCode(sessionId: string): Promise<string> {
  const admin = createAdminClient()
  const { data: current } = await admin.from('analytics_sessions').select('whatsapp_code').eq('id', sessionId).single()
  if (current?.whatsapp_code) return current.whatsapp_code
  for (let attempt = 0; attempt < 4; attempt++) {
    const code = `LIO-${randomBytes(4).toString('hex').slice(0, 6).toUpperCase()}`
    const { error } = await admin.from('analytics_sessions').update({ whatsapp_code: code }).eq('id', sessionId).is('whatsapp_code', null)
    if (!error) {
      const { data } = await admin.from('analytics_sessions').select('whatsapp_code').eq('id', sessionId).single()
      if (data?.whatsapp_code) return data.whatsapp_code
    }
  }
  return `LIO-${sessionId.slice(0, 6).toUpperCase()}`
}

export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams))
  if (!parsed.success) return NextResponse.redirect(new URL('/', request.url), 302)

  const settings = await getStoreSettings()
  const number = settings.whatsapp_number.replace(/\D/g, '')
  let code: string | null = null
  try {
    const session = await ensureAnalyticsSession()
    if (session) {
      code = await assignWhatsappCode(session.id)
      await ingestAnalyticsEvents(session.id, [{
        event_id: randomUUID(), event: 'whatsapp_click', occurred_at: new Date().toISOString(),
        path: sourcePath(request), target_id: `whatsapp:${parsed.data.placement}`, target_type: 'link',
        device: /mobile|android|iphone/i.test(request.headers.get('user-agent') ?? '') ? 'mobile' : 'desktop',
        metadata: { placement: parsed.data.placement },
      }])
    }
  } catch (error) {
    console.error('[whatsapp/track]', error instanceof Error ? error.message : 'unknown')
  }

  const baseMessage = parsed.data.message ?? '¡Hola! Tengo una pregunta sobre los productos LIORA 🌿'
  const message = code ? `${baseMessage}\n\nRef. ${code}` : baseMessage
  return NextResponse.redirect(`https://wa.me/${number}?text=${encodeURIComponent(message)}`, 302)
}
