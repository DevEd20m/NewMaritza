import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Llamado diariamente por Vercel Cron (o manualmente)
// vercel.json: { "crons": [{ "path": "/api/cron/send-followup-emails", "schedule": "0 10 * * *" }] }

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  // Verificar secret. Vercel Cron envía `Authorization: Bearer <CRON_SECRET>`;
  // también aceptamos `?secret=` para llamadas manuales.
  const expected = process.env.CRON_SECRET
  const bearer = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  const querySecret = req.nextUrl.searchParams.get('secret')
  if (!expected || (bearer !== expected && querySecret !== expected)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://liora.pe'

  // Buscar emails pendientes cuya fecha de envío ya pasó
  const { data: pending } = await (admin as any)
    .from('email_queue')
    .select('id, order_id, type')
    .eq('sent', false)
    .lte('scheduled_for', new Date().toISOString())
    .limit(50)

  if (!pending?.length) return NextResponse.json({ sent: 0 })

  let sent = 0, errors = 0

  for (const item of pending) {
    try {
      const res = await fetch(`${siteUrl}/api/email/send-guide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: item.order_id, type: item.type }),
      })

      if (res.ok) {
        await (admin as any).from('email_queue').update({ sent: true, sent_at: new Date().toISOString() }).eq('id', item.id)
        sent++
      } else {
        const err = await res.text()
        await (admin as any).from('email_queue').update({ error: err }).eq('id', item.id)
        errors++
      }
    } catch (e) {
      await (admin as any).from('email_queue').update({ error: String(e) }).eq('id', item.id)
      errors++
    }
  }

  return NextResponse.json({ sent, errors })
}
