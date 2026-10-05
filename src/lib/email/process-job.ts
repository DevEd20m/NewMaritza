import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { deliverOrderEmail, type OrderEmailType } from '@/lib/email/deliver-order-email'
import { deliverQuizWelcomeEmail } from '@/lib/email/deliver-quiz-email'
import { deliverAdminNewOrderEmail } from '@/lib/email/deliver-admin-order-email'
import type { Json } from '@/types/database'

export interface EmailJob {
  id: string
  order_id: string | null
  quiz_profile_id?: string | null
  recipient_email?: string | null
  type: string
  payload?: Json
}

export type EmailJobResult = 'sent' | 'captured' | 'failed' | 'skipped'

/**
 * Delivers one outbox row through the protected internal renderer/sender.
 * Resend and the database row both use order+type idempotency.
 */
export async function processEmailJob(
  job: EmailJob,
  alreadyClaimed = false,
): Promise<EmailJobResult> {
  const admin = createAdminClient()

  if (!alreadyClaimed) {
    const { data: claimed } = await admin
      .from('email_queue')
      .update({
        status: 'processing',
        locked_at: new Date().toISOString(),
        last_error: null,
      })
      .eq('id', job.id)
      .in('status', ['pending', 'failed'])
      .select('id, attempts')
      .maybeSingle()

    if (!claimed) return 'skipped'
    await admin.from('email_queue')
      .update({ attempts: claimed.attempts + 1 })
      .eq('id', job.id)
      .eq('status', 'processing')
  }

  try {
    // US-004 · el aviso al negocio es un tipo más de la misma cola, así que hereda los
    // reintentos, el repesque por cron y la idempotencia sin inventar otro camino.
    const result = job.type === 'quiz_welcome'
      ? await deliverQuizWelcomeEmail(
          job.quiz_profile_id ?? '',
          job.recipient_email ?? '',
          (job.payload ?? {}) as Record<string, unknown>,
        )
      : job.type === 'admin_new_order'
        ? await deliverAdminNewOrderEmail(job.order_id ?? '')
        : await deliverOrderEmail(job.order_id ?? '', job.type as OrderEmailType)
    const captured = result.status === 'captured'
    await admin.from('email_queue').update({
      status: captured ? 'captured' : 'sent',
      sent: true,
      sent_at: new Date().toISOString(),
      locked_at: null,
      html_snapshot: captured ? result.html : null,
    }).eq('id', job.id).eq('status', 'processing')
    return result.status
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    await admin.from('email_queue').update({
      status: 'failed',
      locked_at: null,
      last_error: message.slice(0, 2000),
    }).eq('id', job.id).eq('status', 'processing')
    return 'failed'
  }
}
