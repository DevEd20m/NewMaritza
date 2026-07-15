import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { SLUG_WEIGHTS, ALLERGY_LABELS, SAFETY_FLAG_TEXTS } from '@/lib/recommendation/slug-weights'
import { calculateCategoryScores } from '@/lib/recommendation/score'

const CAT_COLORS: Record<string, string> = {
  piel:          'var(--cat-coral)',
  solar:         'var(--cat-mostaza)',
  bienestar:     'var(--cat-lavanda)',
  gym:           'var(--cat-durazno)',
  viaje:         'var(--cat-cielo)',
  hogar:         'var(--cat-rosa)',
  digestivo:     'var(--cat-menta)',
  'pies-cuerpo': 'var(--cat-durazno)',
}


export interface KitItem {
  variantId: string
  productId: string
  name: string
  variantName: string
  categoryName: string
  categorySlug: string
  priceCents: number
  currency: string
  imageUrl: string | null
  categoryColor: string
}

export async function GET(request: NextRequest) {
  const profileId = request.nextUrl.searchParams.get('profileId')
  if (!profileId) return NextResponse.json({ error: 'Missing profileId' }, { status: 400 })

  // Validate UUID format before hitting the DB
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(profileId)) return NextResponse.json({ error: 'Invalid profileId' }, { status: 400 })

  const admin = createAdminClient()

  // Ownership check: profile must belong to the current session or session_token cookie
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const sessionToken = request.cookies.get('liora_session')?.value

  const { data: profile } = await admin
    .from('quiz_profiles')
    .select('id, answers, template_id, user_id, session_token')
    .eq('id', profileId)
    .single()

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  // Auto-claim: if user is logged in and profile has no owner, link it now
  if (user && !profile.user_id) {
    await (admin as any).from('quiz_profiles').update({ user_id: user.id }).eq('id', profileId)
    ;(profile as any).user_id = user.id
  }

  // Allow access if: authenticated user owns the profile, OR session_token matches
  const ownsProfile =
    (user && profile.user_id === user.id) ||
    (sessionToken && profile.session_token === sessionToken)

  if (!ownsProfile) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const answers = profile.answers as Record<string, string[]>
  const questionIds = Object.keys(answers)

  // Get human-readable Q&A for OpenAI
  type QuizQ = { id: string; text: string; quiz_question_options: { id: string; text: string; slug: string }[] }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: questionsRaw } = await (admin as any)
    .from('quiz_questions')
    .select('id, text, quiz_question_options(id, text, slug)')
    .in('id', questionIds)
  const questions = (questionsRaw ?? []) as QuizQ[]

  const qaLines: string[] = []
  const allSlugs: string[] = []

  for (const q of questions) {
    const selected = q.quiz_question_options
      .filter((o) => (answers[q.id] ?? []).includes(o.id))
    if (selected.length) {
      qaLines.push(`${q.text}: ${selected.map((o) => o.text).join(', ')}`)
      allSlugs.push(...selected.map((o) => o.slug))
    }
  }

  // Load full product catalog
  const { data: products } = await admin
    .from('products')
    .select('id, name, cover_image_url, category_id')
    .eq('is_active', true)

  const { data: categories } = await admin
    .from('categories')
    .select('id, name, slug')

  const { data: variants } = await admin
    .from('product_variants')
    .select('id, product_id, name')
    .eq('is_active', true)

  const { data: prices } = await admin
    .from('product_prices')
    .select('variant_id, amount_cents, currency, effective_to')
    .is('effective_to', null)

  const catMap = Object.fromEntries((categories ?? []).map((c) => [c.id, c]))

  type CatalogEntry = KitItem
  const catalog: CatalogEntry[] = []

  for (const v of (variants ?? [])) {
    const price = (prices ?? []).find((p) => p.variant_id === v.id)
    if (!price) continue
    const product = (products ?? []).find((p) => p.id === v.product_id)
    if (!product) continue
    const cat = catMap[product.category_id ?? '']
    const color = cat ? (CAT_COLORS[cat.slug] ?? 'var(--cat-lavanda)') : 'var(--cat-lavanda)'

    catalog.push({
      variantId: v.id,
      productId: product.id,
      name: product.name,
      variantName: v.name,
      categoryName: cat?.name ?? '',
      categorySlug: cat?.slug ?? '',
      priceCents: price.amount_cents,
      currency: price.currency,
      imageUrl: product.cover_image_url,
      categoryColor: color,
    })
  }

  let kitVariantIds: string[] = []
  let suggestionVariantIds: string[] = []
  let diagnosis = ''
  let tags: string[] = []

  // OpenAI path
  if (process.env.OPENAI_API_KEY) {
    try {
      const { default: OpenAI } = await import('openai')
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 25000, maxRetries: 1 })

      const catalogText = catalog
        .map((c) => `ID:${c.variantId} | ${c.name} (${c.variantName}) | ${c.categoryName} | S/${(c.priceCents / 100).toFixed(0)}`)
        .join('\n')

      // Extract context signals for prompt enrichment
      const budgetSlug = allSlugs.find(s => s.startsWith('presupuesto-'))
      const budgetLabel: Record<string, string> = {
        'presupuesto-bajo': 'hasta S/80',
        'presupuesto-medio': 'entre S/80 y S/150',
        'presupuesto-alto': 'entre S/150 y S/250',
        'presupuesto-premium': 'sin límite de presupuesto',
      }
      const allergySlugs = allSlugs.filter(s => s in ALLERGY_LABELS)
      const restrictions = allergySlugs.map(s => ALLERGY_LABELS[s]).filter(Boolean)
      const prefersNatural = allSlugs.includes('prefiere-natural')

      const activeSafetyFlags = allSlugs
        .filter(s => SAFETY_FLAG_TEXTS[s])
        .map(s => SAFETY_FLAG_TEXTS[s])
      const ageSlug = allSlugs.find(s => s.startsWith('edad-'))

      const genderSlug = allSlugs.find(s => s.startsWith('genero-'))
      const genderLabel = genderSlug === 'genero-femenino' ? 'mujer' : genderSlug === 'genero-masculino' ? 'hombre' : null
      const pronoun = genderSlug === 'genero-masculino' ? 'él' : 'ella'

      const objSlug = allSlugs.find(s => s.startsWith('obj-'))
      const objLabels: Record<string, string> = {
        'obj-rendimiento':  'rendimiento físico y deporte',
        'obj-belleza':      'cuidado de piel y cabello',
        'obj-bienestar':    'bienestar emocional (estrés o sueño)',
        'obj-digestivo':    'digestión e hidratación',
        'obj-nutricion':    'nutrición general y vitaminas',
        'obj-solar':        'protección solar y cuidado al sol',
        'obj-viaje':        'kit de viaje y outdoor',
        'obj-hogar':        'botiquín y primeros auxilios en casa',
        'obj-pies-cuerpo':  'cuidado de pies y cuerpo',
        'obj-guia':         'descubrir qué productos necesita',
      }
      const objLabel = objSlug ? objLabels[objSlug] : null

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.3,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `Eres el motor de recomendaciones de LIORA, una marca peruana de bienestar natural.
Dado el cuestionario de un/a cliente/a y el catálogo actual, devuelve un kit personalizado.

Responde SOLO con JSON:
{
  "kit_variant_ids": ["id",...],
  "suggestion_variant_ids": ["id",...],
  "diagnosis": "string",
  "tags": ["string",...]
}

Reglas estrictas:
- kit_variant_ids: 4-5 variantes en orden de prioridad (IDs exactos del catálogo)
- suggestion_variant_ids: 3-4 variantes adicionales NO incluidas en el kit
- diagnosis: 2-3 oraciones personalizadas. Empieza con un insight sobre el perfil de la persona (no empieces con "Te recomendamos"). Usa el pronombre correcto si conoces el género.
- tags: 3-5 etiquetas cortas en español que describan el perfil
- NO repitas el mismo producto en kit y suggestions
- OBJETIVO PRINCIPAL: ${objLabel ? `La persona busca ${objLabel}. Prioriza productos de esa área.` : 'Objetivo no especificado — analiza las respuestas.'}
- GÉNERO: ${genderLabel ? `La persona es ${genderLabel}. Usa pronombres correctos (${pronoun}) en el diagnosis y adapta si hay necesidades específicas de su biología.` : 'Género no especificado — usa lenguaje neutro.'}
- PRESUPUESTO: ${budgetSlug ? `Quiere invertir ${budgetLabel[budgetSlug] ?? 'precio moderado'}. Prioriza productos dentro de ese rango.` : 'Sin dato de presupuesto.'}
- RESTRICCIONES: ${restrictions.length ? `EXCLUIR productos que contengan ${restrictions.join(', ')}. CRÍTICO para su seguridad.` : 'Sin restricciones.'}
- PREFERENCIA: ${prefersNatural ? 'Prefiere productos 100% naturales y orgánicos.' : 'Abierta/o a todo tipo de suplementos.'}
- EDAD: ${ageSlug ? `Etapa: ${ageSlug}. Adapta según necesidades de esa etapa de vida.` : ''}
- CONTEXTO LOCAL: Somos una marca peruana. El clima costero (húmedo) afecta la piel — menciónalo si aplica al perfil de skin care.${activeSafetyFlags.length ? `\n- ADVERTENCIAS MÉDICAS (CRÍTICO — reportadas por el usuario, respetar siempre):\n${activeSafetyFlags.map((f, i) => `  ${i + 1}. ${f}`).join('\n')}` : ''}
- Responde completamente en español`,
          },
          {
            role: 'user',
            content: `Respuestas del cuestionario:\n${qaLines.join('\n')}\n\nCatálogo:\n${catalogText}`,
          },
        ],
      })

      const raw = completion.choices[0]?.message?.content ?? '{}'
      const parsed = JSON.parse(raw)
      // Solo aceptar IDs que existan realmente en el catálogo (GPT puede alucinar IDs),
      // sin duplicados y sin solaparse entre kit y sugerencias.
      const validIds = new Set(catalog.map((c) => c.variantId))
      const seen = new Set<string>()
      const cleanKit: string[] = []
      for (const id of (parsed.kit_variant_ids ?? []) as string[]) {
        if (validIds.has(id) && !seen.has(id)) { seen.add(id); cleanKit.push(id) }
      }
      const cleanSugg: string[] = []
      for (const id of (parsed.suggestion_variant_ids ?? []) as string[]) {
        if (validIds.has(id) && !seen.has(id)) { seen.add(id); cleanSugg.push(id) }
      }
      kitVariantIds = cleanKit
      suggestionVariantIds = cleanSugg
      diagnosis = parsed.diagnosis ?? ''
      tags = parsed.tags ?? []
    } catch (err) {
      console.error('[kit/recommend] OpenAI error:', err)
    }
  }

  // Scoring fallback: si la IA no dio IDs válidos, o quedó sin kit tras la limpieza
  if (kitVariantIds.length === 0) {
    const scores = calculateCategoryScores(allSlugs)

    const sortedCats = Object.entries(scores).sort(([, a], [, b]) => b - a)
    const usedProducts = new Set<string>()
    const kitItems: CatalogEntry[] = []
    const suggItems: CatalogEntry[] = []

    for (const [catSlug, score] of sortedCats) {
      const catProds = catalog.filter((c) => c.categorySlug === catSlug && !usedProducts.has(c.productId))
      const count = score >= 2 ? 2 : 1
      catProds.slice(0, count).forEach((p) => { kitItems.push(p); usedProducts.add(p.productId) })
    }

    if (kitItems.length === 0) catalog.slice(0, 5).forEach((c) => kitItems.push(c))

    for (const item of catalog) {
      if (!usedProducts.has(item.productId) && suggItems.length < 4) {
        suggItems.push(item)
        usedProducts.add(item.productId)
      }
    }

    kitVariantIds = kitItems.slice(0, 6).map((c) => c.variantId)
    suggestionVariantIds = suggItems.map((c) => c.variantId)

    const topTags: string[] = []
    if (scores.gym > 0) topTags.push('Rendimiento')
    if (scores.piel > 0) topTags.push('Cuidado de piel')
    if (scores.digestivo > 0) topTags.push('Alimentación limpia')
    if (scores.bienestar > 0) topTags.push('Bienestar')
    const objFallback = allSlugs.find(s => s.startsWith('obj-'))
    const objFallbackLabels: Record<string, string> = {
      'obj-bienestar': 'Bienestar emocional',
      'obj-digestivo': 'Digestión',
      'obj-cabello': 'Cuidado capilar',
    }
    if (objFallback && objFallbackLabels[objFallback]) topTags.push(objFallbackLabels[objFallback])
    diagnosis = 'Seleccionamos los productos que mejor se adaptan a tus objetivos de bienestar.'
    tags = topTags.length ? topTags : ['Bienestar', 'Personalizado']
  }

  // Persist to recommendations
  const { data: existing } = await admin
    .from('recommendations')
    .select('variant_id')
    .eq('quiz_profile_id', profileId)

  if (!existing?.length) {
    const rows = [
      ...kitVariantIds.map((vid, i) => ({
        quiz_profile_id: profileId,
        variant_id: vid,
        score: (kitVariantIds.length - i) * 10 + 10,
        rationale: 'kit',
      })),
      ...suggestionVariantIds.map((vid, i) => ({
        quiz_profile_id: profileId,
        variant_id: vid,
        score: (suggestionVariantIds.length - i) * 5,
        rationale: 'suggestion',
      })),
    ]
    if (rows.length) await admin.from('recommendations').insert(rows)
  }

  const kit = kitVariantIds.map((vid) => catalog.find((c) => c.variantId === vid)).filter(Boolean) as CatalogEntry[]
  const suggestions = suggestionVariantIds.map((vid) => catalog.find((c) => c.variantId === vid)).filter(Boolean) as CatalogEntry[]

  return NextResponse.json({ kit, suggestions, diagnosis, tags })
}
