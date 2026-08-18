import { NextResponse } from 'next/server'
import { optOutCurrentAnalyticsSession } from '@/lib/analytics/server'

export async function POST() {
  await optOutCurrentAnalyticsSession()
  return NextResponse.json({ ok: true })
}
