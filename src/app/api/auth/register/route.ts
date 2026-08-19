import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { consumeRateLimit, requestIp } from '@/lib/security/rate-limit'
import { sanitizeNextPath } from '@/lib/auth/next-path'
import { accountActivationEmail } from '@/lib/email/templates/account-activation'
import { FROM_EMAIL, getResend, REPLY_TO } from '@/lib/email/client'

export const dynamic = 'force-dynamic'

const schema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(128),
  next: z.string().optional(),
})

export async function POST(request: NextRequest) {
  if (!await consumeRateLimit('auth-register', requestIp(request), 3, 15 * 60)) {
    return NextResponse.json({ ok: true })
  }
  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })

  const email = parsed.data.email.toLowerCase()
  const nextPath = sanitizeNextPath(parsed.data.next)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://liora.pe'
  const admin = createAdminClient()
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'signup',
    email,
    password: parsed.data.password,
    options: { redirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(nextPath)}` },
  })

  // Do not reveal whether an account already exists.
  if (error || !data.properties.action_link) {
    console.error('[auth/register] link generation failed', error?.message)
    return NextResponse.json({ ok: true })
  }

  const html = accountActivationEmail({
    activationUrl: data.properties.action_link,
    siteUrl,
  })
  if (process.env.EMAIL_DELIVERY_MODE !== 'capture') {
    if (!process.env.RESEND_API_KEY) return NextResponse.json({ error: 'Correo no configurado' }, { status: 503 })
    const { error: emailError } = await getResend().emails.send({
      from: FROM_EMAIL,
      replyTo: REPLY_TO,
      to: email,
      subject: 'Activa tu cuenta LIORA — un solo click ✨',
      html,
    }, { idempotencyKey: `signup:${data.user.id}` })
    if (emailError) {
      console.error('[auth/register] email failed', emailError.message)
      return NextResponse.json({ error: 'No se pudo enviar el correo' }, { status: 502 })
    }
  }

  return NextResponse.json({ ok: true })
}
