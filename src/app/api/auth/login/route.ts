import { after, NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { linkCurrentAnalyticsSession } from '@/lib/analytics/server'

const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(1_024),
})

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 })
  }

  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Correo o contraseña inválidos' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data)
  if (error || !data.session) {
    return NextResponse.json({ error: 'Correo o contraseña incorrectos' }, { status: 401 })
  }

  const { data: claims, error: claimsError } = await supabase.auth.getClaims()
  if (claimsError || typeof claims?.claims?.sub !== 'string') {
    await supabase.auth.signOut({ scope: 'local' })
    return NextResponse.json({ error: 'No se pudo verificar la sesión' }, { status: 401 })
  }

  after(async () => {
    await linkCurrentAnalyticsSession({}).catch(linkError => {
      console.error('[analytics/login-link]', linkError instanceof Error ? linkError.message : 'unknown')
    })
  })

  return NextResponse.json(
    { ok: true },
    {
      headers: {
        'Cache-Control': 'private, no-cache, no-store, must-revalidate, max-age=0',
        Expires: '0',
        Pragma: 'no-cache',
      },
    },
  )
}
