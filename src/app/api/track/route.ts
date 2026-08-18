import { NextRequest, NextResponse } from 'next/server'
import { analyticsBatchSchema, sanitizeAnalyticsMetadata } from '@/lib/analytics/schema'
import { ensureAnalyticsSession, ingestAnalyticsEvents } from '@/lib/analytics/server'
import { consumeRateLimit, requestIp } from '@/lib/security/rate-limit'

const BOT_UA = /bot|crawler|spider|crawling|headless|lighthouse|pingdom|facebookexternalhit/i

export async function POST(request: NextRequest) {
  try {
    const ua = request.headers.get('user-agent') ?? ''
    if (!ua || BOT_UA.test(ua)) return new NextResponse(null, { status: 204 })

    if (!await consumeRateLimit('analytics', requestIp(request), 240, 60)) {
      return new NextResponse(null, { status: 429 })
    }
    const parsed = analyticsBatchSchema.safeParse(await request.json())
    if (!parsed.success) return new NextResponse(null, { status: 400 })

    const session = await ensureAnalyticsSession()
    if (!session) return new NextResponse(null, { status: 204 })
    const events = parsed.data.events.map(event => ({
      ...event,
      metadata: sanitizeAnalyticsMetadata(event.metadata ?? {}),
    }))
    await ingestAnalyticsEvents(session.id, events)
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('[analytics/track]', error instanceof Error ? error.message : 'unknown')
    return new NextResponse(null, { status: 503 })
  }
}
