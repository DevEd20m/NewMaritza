import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

interface PersonalizationResult {
  intro: string
  highlightedTipIndex: number | null
  activeWarnings: string[]
}

export async function POST(req: NextRequest) {
  const { profileId, guideSlug } = await req.json().catch(() => ({}))
  if (!profileId || !guideSlug) return NextResponse.json(null, { status: 400 })

  const admin = createAdminClient()

  // Return cached result if available
  const { data: cached } = await (admin as any)
    .from('guide_personalizations')
    .select('intro_text, highlighted_tip_index, active_warnings')
    .eq('quiz_profile_id', profileId)
    .eq('guide_slug', guideSlug)
    .maybeSingle()

  if (cached) {
    return NextResponse.json({
      intro: cached.intro_text,
      highlightedTipIndex: cached.highlighted_tip_index,
      activeWarnings: cached.active_warnings ?? [],
    } satisfies PersonalizationResult)
  }

  if (!process.env.OPENAI_API_KEY) return NextResponse.json(null)

  // Load quiz profile
  const { data: profile } = await (admin as any)
    .from('quiz_profiles')
    .select('answers, applied_tags, user_id')
    .eq('id', profileId)
    .maybeSingle()

  if (!profile) return NextResponse.json(null)

  // Load guide tips
  const { data: guide } = await (admin as any)
    .from('kit_guides')
    .select('kit_name, tagline, tips')
    .eq('slug', guideSlug)
    .eq('is_active', true)
    .maybeSingle()

  if (!guide) return NextResponse.json(null)

  // Get user first name if logged in
  let firstName: string | null = null
  if (profile.user_id) {
    const { data: p } = await (admin as any)
      .from('profiles')
      .select('first_name')
      .eq('id', profile.user_id)
      .maybeSingle()
    firstName = p?.first_name ?? null
  }

  // Build human-readable Q&A from answers JSONB
  const answerEntries = Object.entries(profile.answers ?? {})
  let readableQA = ''

  if (answerEntries.length > 0) {
    const questionIds = answerEntries.map(([id]) => id)
    const { data: questions } = await (admin as any)
      .from('quiz_questions')
      .select('id, text, quiz_question_options(id, text)')
      .in('id', questionIds)

    if (questions?.length) {
      const lines: string[] = []
      for (const [questionId, optionIds] of answerEntries) {
        const q = (questions as any[]).find((x: any) => x.id === questionId)
        if (!q) continue
        const selected = (q.quiz_question_options as any[])
          .filter((o: any) => (optionIds as string[]).includes(o.id))
          .map((o: any) => o.text)
        if (selected.length) lines.push(`- ${q.text}: ${selected.join(', ')}`)
      }
      readableQA = lines.join('\n')
    }
  }

  // Fallback: use applied_tags if no Q&A could be resolved
  if (!readableQA && profile.applied_tags?.length) {
    readableQA = `- Tags de perfil: ${(profile.applied_tags as string[]).join(', ')}`
  }

  const tipTitles = (guide.tips as any[]).map((t: any, i: number) => `${i}: "${t.title}"`)

  const { default: OpenAI } = await import('openai')
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const nameGreeting = firstName ? firstName : 'amig@'

  let result: PersonalizationResult = { intro: '', highlightedTipIndex: null, activeWarnings: [] }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.4,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `Eres la voz de LIORA, marca peruana de wellness personalizado. Tu tono es cálido, directo y cercano — como una amiga que sabe mucho de salud. Escribes en español. Nunca menciones que eres IA ni que estás analizando datos.`,
        },
        {
          role: 'user',
          content: `${nameGreeting} acaba de comprar el ${guide.kit_name}: "${guide.tagline}"

Sus respuestas del cuestionario:
${readableQA || '(sin datos de cuestionario)'}

Escribe una introducción personalizada de 2-3 oraciones para su guía de uso:
- Conecta su situación específica con por qué este kit les va a funcionar
- Menciona algo concreto de sus respuestas
- No des instrucciones de dosis — esas van en la guía
- Máximo 55 palabras. Tono cálido y motivador.

Tips disponibles (elige el más relevante para esta persona):
${tipTitles.join('\n')}

Condiciones especiales a detectar: "embarazada" (si mencionó embarazo/lactancia), "digestivos" (si tiene problemas digestivos), "piel-sensible" (si tiene piel sensible/alergias).

Responde SOLO en JSON: {"intro": "...", "highlightedTipIndex": N_o_null, "activeWarnings": []}`,
        },
      ],
    })

    const raw = JSON.parse(completion.choices[0].message.content ?? '{}')
    result = {
      intro: typeof raw.intro === 'string' ? raw.intro : '',
      highlightedTipIndex: typeof raw.highlightedTipIndex === 'number' ? raw.highlightedTipIndex : null,
      activeWarnings: Array.isArray(raw.activeWarnings) ? raw.activeWarnings : [],
    }
  } catch (err) {
    console.error('[guides/personalize] OpenAI error:', err)
    return NextResponse.json(null)
  }

  if (!result.intro) return NextResponse.json(null)

  // Cache result
  await (admin as any).from('guide_personalizations').upsert({
    quiz_profile_id: profileId,
    guide_slug: guideSlug,
    intro_text: result.intro,
    highlighted_tip_index: result.highlightedTipIndex,
    active_warnings: result.activeWarnings,
  }, { onConflict: 'quiz_profile_id,guide_slug' })

  return NextResponse.json(result)
}
