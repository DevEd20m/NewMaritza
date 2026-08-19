import { randomUUID } from 'node:crypto'
import { after, NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { createOpaqueToken, hashOpaqueToken } from '@/lib/security/tokens'
import { consumeRateLimit, requestIp } from '@/lib/security/rate-limit'
import { linkCurrentAnalyticsSession } from '@/lib/analytics/server'
import { processEmailJob } from '@/lib/email/process-job'

export const maxDuration = 60

const schema = z.object({
  templateId: z.string().min(1),
  answers: z.record(z.string(), z.array(z.string())),
  email: z.string().email().optional(),
  phone: z.string().trim().max(30).optional(),
  whatsappConsent: z.boolean().optional().default(false),
  submissionId: z.string().uuid().optional(),
})

export async function POST(request: NextRequest) {
  try {
    if (!await consumeRateLimit('quiz-submit', requestIp(request), 10, 60)) {
      return NextResponse.json({ error: 'Demasiadas solicitudes' }, { status: 429 })
    }
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const { templateId, answers, phone, whatsappConsent } = parsed.data
    const supabase = await createClient()
    const admin = createAdminClient()
    const { data: { user } } = await supabase.auth.getUser()
    const email = (parsed.data.email ?? user?.email)?.trim().toLowerCase()
    if (!email) return NextResponse.json({ error: 'El email es obligatorio' }, { status: 400 })

    // Collect applied tags from options
    const optionIds = Object.values(answers).flat()
    const { data: options } = await admin
      .from('quiz_question_options')
      .select('id, tag_ids')
      .in('id', optionIds)

    const tagIds = [...new Set((options ?? []).flatMap((o) => o.tag_ids ?? []))]

    const sessionToken = createOpaqueToken()
    const resultToken = createOpaqueToken()
    const submissionId = parsed.data.submissionId ?? randomUUID()
    const { data: submissionRows, error: submissionError } = await admin.rpc(
      'submit_quiz_profile_and_email',
      {
        p_submission_key: submissionId,
        p_session_token: sessionToken,
        p_result_token: resultToken,
        p_result_token_hash: hashOpaqueToken(resultToken),
        p_template_id: templateId,
        p_answers: answers,
        p_applied_tags: tagIds,
        p_email: email,
        p_phone: phone ?? null,
        p_whatsapp_consent: whatsappConsent,
        p_user_id: user?.id ?? null,
      },
    )

    const submission = (submissionRows?.[0] ?? null) as {
      profile_id: string
      lead_id: string
      email_job_id: string
      profile_session_token: string
    } | null
    if (submissionError || !submission) {
      console.error('[quiz/submit] transaction failed', submissionError)
      return NextResponse.json({ error: 'Error al guardar el perfil' }, { status: 500 })
    }

    await linkCurrentAnalyticsSession({
      leadId: submission.lead_id,
      quizProfileId: submission.profile_id,
    })

    if (submission.email_job_id) {
      after(async () => {
        const { data: emailJob } = await admin
          .from('email_queue')
          .select('id, order_id, quiz_profile_id, recipient_email, type, payload')
          .eq('id', submission.email_job_id)
          .maybeSingle()
        if (emailJob) {
          const result = await processEmailJob(emailJob)
          if (result === 'failed') console.error('[quiz/submit] welcome email queued for retry')
        }
      })
    }

    // Las recomendaciones las genera y persiste /api/kit/recommend (el motor
    // real) cuando el carrito carga el perfil — aquí no se insertan filas
    // rápidas por tags para que la tabla siempre refleje el kit mostrado.
    const response = NextResponse.json({ profileId: submission.profile_id, emailQueued: true })
    response.cookies.set('liora_session', submission.profile_session_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    })
    return response
  } catch (err) {
    console.error('[quiz/submit]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
