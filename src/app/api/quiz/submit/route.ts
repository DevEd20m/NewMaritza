import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  templateId: z.string().min(1),
  answers: z.record(z.string(), z.array(z.string())),
  email: z.string().email().optional(),
  phone: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
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
    const sessionToken = `quiz_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
    const { data: profile } = await admin.from('quiz_profiles').insert({
      session_token: sessionToken,
      user_id: user?.id ?? null,
      template_id: templateId,
      answers,
      applied_tags: tagIds,
    }).select('id').single()

    if (!profile) return NextResponse.json({ error: 'Error al guardar el perfil' }, { status: 500 })

    // Save lead if email provided
    if (email) {
      await admin.from('leads').upsert({
        email,
        phone: phone ?? null,
        quiz_profile_id: profile.id,
        source: 'quiz_p7',
      }, { onConflict: 'email', ignoreDuplicates: true })
    }

    // Generate recommendations based on tags
    const { data: recommendations } = await admin
      .from('recommendations')
      .select('variant_id, score')
      .eq('quiz_profile_id', profile.id)

    // If no recommendations yet, generate simple ones based on tags
    if (!recommendations?.length && tagIds.length > 0) {
      const { data: taggedVariants } = await admin
        .from('product_tags')
        .select('product_id')
        .in('tag_id', tagIds)
        .limit(10)

      if (taggedVariants?.length) {
        const productIds = [...new Set(taggedVariants.map((t) => t.product_id))]
        const { data: variants } = await admin
          .from('product_variants')
          .select('id, product_id')
          .in('product_id', productIds)
          .eq('is_active', true)
          .limit(6)

        if (variants?.length) {
          await admin.from('recommendations').insert(
            variants.map((v, i) => ({
              quiz_profile_id: profile.id,
              variant_id: v.id,
              score: (variants.length - i) * 10,
            }))
          )
        }
      }
    }

    return NextResponse.json({ profileId: profile.id, sessionToken })
  } catch (err) {
    console.error('[quiz/submit]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
