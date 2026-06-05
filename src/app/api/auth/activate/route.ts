import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getResend, FROM_EMAIL } from '@/lib/email/client'
import { accountActivationEmail } from '@/lib/email/templates/account-activation'

export const dynamic = 'force-dynamic'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://liora.pe'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { email, firstName } = body as { email?: string; firstName?: string }

  if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 })

  const admin = createAdminClient()

  const { data, error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo: `${SITE_URL}/auth/callback?next=/cuenta` },
  })

  if (error) {
    console.error('[auth/activate] generateLink error:', error)
    return NextResponse.json({ error: 'No se pudo generar el enlace' }, { status: 500 })
  }

  const activationUrl = data.properties.action_link

  if (process.env.RESEND_API_KEY) {
    const html = accountActivationEmail({ activationUrl, siteUrl: SITE_URL, firstName })
    const { error: emailError } = await getResend().emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Activa tu cuenta LIORA — un solo click ✨',
      html,
    })
    if (emailError) console.error('[auth/activate] email send error:', emailError)
  }

  return NextResponse.json({ ok: true })
}
