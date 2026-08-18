import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { processEmailJob } from '@/lib/email/process-job'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(req: NextRequest) {
  const expected = process.env.CRON_SECRET
  const bearer = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!expected || bearer !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  await admin.rpc('release_expired_inventory_reservations')

  const { data: jobs, error: claimError } = await admin.rpc('claim_email_jobs', { p_limit: 25 })

  if (claimError) {
    console.error('[cron/email] claim failed', claimError)
    return NextResponse.json({ error: 'Could not claim email jobs' }, { status: 500 })
  }

  if (!jobs?.length) return NextResponse.json({ processed: 0, sent: 0, captured: 0, errors: 0 })

  let sent = 0
  let captured = 0
  let errors = 0

  for (const job of jobs) {
    const result = await processEmailJob(job, true)
    if (result === 'captured') captured++
    else if (result === 'sent') sent++
    else if (result === 'failed') errors++
  }

  return NextResponse.json({ processed: sent + captured + errors, sent, captured, errors })
}
