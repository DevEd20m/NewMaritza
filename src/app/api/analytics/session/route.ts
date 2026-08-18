import { NextResponse } from 'next/server'
import { ensureAnalyticsSession } from '@/lib/analytics/server'

export async function POST() {
  try {
    const session = await ensureAnalyticsSession()
    return NextResponse.json({ enabled: Boolean(session) })
  } catch (error) {
    console.error('[analytics/session]', error instanceof Error ? error.message : 'unknown')
    return NextResponse.json({ enabled: false }, { status: 503 })
  }
}
