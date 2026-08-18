import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request: NextRequest) {
  const expected = process.env.CRON_SECRET
  const bearer = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!expected || bearer !== expected) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: deleted } = await admin.rpc('cleanup_analytics_journeys', { p_retention_days: 180 })
  const amplitudeKey = process.env.AMPLITUDE_API_KEY
  if (!amplitudeKey) return NextResponse.json({ deleted: deleted ?? 0, delivered: 0, skipped: 'amplitude_not_configured' })

  const { data: jobs, error } = await admin.rpc('claim_analytics_outbox', { p_limit: 100 })
  if (error) return NextResponse.json({ error: 'Could not claim analytics jobs' }, { status: 500 })
  if (!jobs?.length) return NextResponse.json({ deleted: deleted ?? 0, delivered: 0 })

  try {
    const response = await fetch('https://api2.amplitude.com/2/httpapi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: amplitudeKey, events: jobs.map((job: { payload: unknown }) => job.payload) }),
    })
    if (!response.ok) throw new Error(`amplitude_http_${response.status}`)
    await Promise.all(jobs.map((job: { id: string }) => admin.from('analytics_delivery_outbox').update({
      status: 'sent', sent_at: new Date().toISOString(), locked_at: null,
    }).eq('id', job.id)))
    return NextResponse.json({ deleted: deleted ?? 0, delivered: jobs.length })
  } catch (deliveryError) {
    const message = deliveryError instanceof Error ? deliveryError.message.slice(0, 300) : 'unknown'
    await Promise.all(jobs.map((job: { id: string; attempts: number }) => admin.from('analytics_delivery_outbox').update({
      status: 'failed', last_error: message, locked_at: null,
      next_attempt_at: new Date(Date.now() + Math.min(24 * 60, 2 ** job.attempts) * 60_000).toISOString(),
    }).eq('id', job.id)))
    return NextResponse.json({ deleted: deleted ?? 0, delivered: 0, failed: jobs.length }, { status: 502 })
  }
}
