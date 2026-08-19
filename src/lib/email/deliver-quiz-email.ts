import 'server-only'

import { getResend, FROM_EMAIL, REPLY_TO } from '@/lib/email/client'
import { quizWelcomeEmail } from '@/lib/email/templates/quiz-welcome'

export type QuizEmailDeliveryResult =
  | { status: 'captured'; html: string }
  | { status: 'sent' }

interface QuizWelcomePayload {
  result_token?: unknown
}

export async function deliverQuizWelcomeEmail(
  quizProfileId: string,
  recipientEmail: string,
  payload: QuizWelcomePayload,
): Promise<QuizEmailDeliveryResult> {
  const resultToken = typeof payload.result_token === 'string' ? payload.result_token : null
  if (!resultToken) throw new Error('quiz_result_token_missing')
  if (!recipientEmail) throw new Error('quiz_email_missing')
  if (process.env.EMAIL_DELIVERY_MODE !== 'capture' && !process.env.RESEND_API_KEY) {
    throw new Error('email_not_configured')
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://liora.pe'
  const resultUrl = `${siteUrl}/api/quiz/result?token=${encodeURIComponent(resultToken)}`
  const html = quizWelcomeEmail({ resultUrl, siteUrl })

  if (process.env.EMAIL_DELIVERY_MODE === 'capture') return { status: 'captured', html }

  const { error } = await getResend().emails.send({
    from: FROM_EMAIL,
    replyTo: REPLY_TO,
    to: recipientEmail,
    subject: 'Tu kit personalizado LIORA está listo ✨',
    html,
  }, { idempotencyKey: `quiz:${quizProfileId}:welcome` })

  if (error) throw new Error(`resend_quiz_welcome_failed:${error.message}`)
  return { status: 'sent' }
}
