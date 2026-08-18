import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { createOpaqueToken } from '@/lib/security/tokens'
import { consumeRateLimit, requestIp } from '@/lib/security/rate-limit'

const schema = z.object({
  templateId: z.string().min(1),
  answers: z.record(z.string(), z.array(z.string())),
  email: z.string().email().optional(),
  phone: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    if (!await consumeRateLimit('quiz-submit', requestIp(request), 10, 60)) {
      return NextResponse.json({ error: 'Demasiadas solicitudes' }, { status: 429 })
    }
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const { templateId, answers, email, phone } = parsed.data
    const supabase = await createClient()
    const admin = createAdminClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Collect applied tags from options
    const optionIds = Object.values(answers).flat()
    const { data: options } = await admin
      .from('quiz_question_options')
      .select('id, tag_ids')
      .in('id', optionIds)

    const tagIds = [...new Set((options ?? []).flatMap((o) => o.tag_ids ?? []))]

    // Create quiz profile
    const sessionToken = createOpaqueToken()
    const { data: profile } = await admin.from('quiz_profiles').insert({
      session_token: sessionToken,
      user_id: user?.id ?? null,
      template_id: templateId,
      answers,
      applied_tags: tagIds,
    }).select('id').single()

    if (!profile) return NextResponse.json({ error: 'Error al guardar el perfil' }, { status: 500 })

    // Link quiz profile to user's profile
    if (user?.id) {
      await (admin as any).from('profiles').update({ quiz_profile_id: profile.id }).eq('id', user.id)
    }

    // Save lead if email provided
    if (email) {
      await admin.from('leads').upsert({
        email,
        phone: phone ?? null,
        quiz_profile_id: profile.id,
        source: 'quiz_p7',
      }, { onConflict: 'email', ignoreDuplicates: true })
    }

    // Las recomendaciones las genera y persiste /api/kit/recommend (el motor
    // real) cuando el carrito carga el perfil — aquí no se insertan filas
    // rápidas por tags para que la tabla siempre refleje el kit mostrado.
    const response = NextResponse.json({ profileId: profile.id })
    response.cookies.set('liora_session', sessionToken, {
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
