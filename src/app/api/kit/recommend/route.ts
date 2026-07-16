import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ALLERGY_LABELS, SAFETY_FLAG_TEXTS } from '@/lib/recommendation/slug-weights'
import { calculateCategoryScores, scoresSortedDesc } from '@/lib/recommendation/score'
import { selectRoutineKit, FALLBACK_DIAGNOSIS, FALLBACK_TAGS } from '@/lib/recommendation/kit-routes'
import { validateAiRoutine } from '@/lib/recommendation/ai-routine'

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

// Rangos de presupuesto del quiz (sincronizados con quiz_question_options,
// migración 20260716000000_update_budget_ranges)
const BUDGET_RANGES: Record<string, { label: string; min?: number; max?: number }> = {
  'presupuesto-bajo':    { label: 'hasta S/200', max: 200 },
  'presupuesto-medio':   { label: 'entre S/200 y S/400', min: 200, max: 400 },
  'presupuesto-alto':    { label: 'entre S/400 y S/600', min: 400, max: 600 },
  'presupuesto-premium': { label: 'más de S/600, sin límite', min: 600 },
}

export interface KitItem {
  variantId: string
  productId: string
  name: string
  brand: string | null
  variantName: string
  categoryName: string
  categorySlug: string
  priceCents: number
  currency: string
  imageUrl: string | null
  categoryColor: string
  stepLabel?: string | null
  stepWhen?: string | null
  stepInstruction?: string | null
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any).from('quiz_profiles').update({ user_id: user.id }).eq('id', profileId)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(profile as any).user_id = user.id
  }

  // Allow access if: authenticated user owns the profile, OR session_token matches
  const ownsProfile =
    (user && profile.user_id === user.id) ||
    (sessionToken && profile.session_token === sessionToken)

  if (!ownsProfile) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const answers = profile.answers as Record<string, string[]>
  const questionIds = Object.keys(answers)

  // Get human-readable Q&A + slugs. El hint !question_id es obligatorio:
  // quiz_question_options tiene dos FKs hacia quiz_questions (question_id y
  // next_question_id) y sin él PostgREST rechaza el embed por ambigüedad.
  type QuizQ = { id: string; text: string; quiz_question_options: { id: string; text: string; slug: string }[] }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: questionsRaw, error: questionsError } = await (admin as any)
    .from('quiz_questions')
    .select('id, text, quiz_question_options!question_id(id, text, slug)')
    .in('id', questionIds)
  const questions = (questionsRaw ?? []) as QuizQ[]

  if (questionsError || questions.length === 0) {
    console.error('[kit/recommend] questions fetch failed:', questionsError ?? 'no questions matched answers')
    return NextResponse.json({ error: 'No pudimos leer tus respuestas. Intenta de nuevo.' }, { status: 500 })
  }

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

  const scores = calculateCategoryScores(allSlugs)

  // Load full product catalog
  const { data: products } = await admin
    .from('products')
    .select('id, name, brand, cover_image_url, category_id')
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
      brand: (product as { brand?: string | null }).brand ?? null,
      variantName: v.name,
      categoryName: cat?.name ?? '',
      categorySlug: cat?.slug ?? '',
      priceCents: price.amount_cents,
      currency: price.currency,
      imageUrl: product.cover_image_url,
      categoryColor: color,
    })
  }

  const catalogByVariant = new Map(catalog.map((c) => [c.variantId, c]))

  let kitItems: CatalogEntry[] = []
  let suggestions: CatalogEntry[] = []
  let diagnosis = ''
  let tags: string[] = []
  let routineName: string | null = null
  let routineSlug: string | null = null

  // ══ CORAZÓN DEL SISTEMA: la IA arma la rutina desde TODO el catálogo ══
  if (process.env.OPENAI_API_KEY && catalog.length > 0) {
    try {
      const { default: OpenAI } = await import('openai')
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 25000, maxRetries: 1 })

      // Catálogo completo al inicio del system prompt: es el prefijo estable
      // entre llamadas, así el prompt caching de OpenAI abarata cada quiz.
      // Se numera con índices cortos (#1..#N) — los modelos confunden UUIDs —
      // y se ordena por categoría para que los productos afines queden juntos.
      const promptCatalog = [...catalog].sort((a, b) =>
        a.categoryName.localeCompare(b.categoryName) || a.name.localeCompare(b.name))
      const catalogText = promptCatalog
        .map((c, i) => `#${i + 1} | ${c.name}${c.brand ? ` · ${c.brand}` : ''} (${c.variantName}) | ${c.categoryName} | S/${(c.priceCents / 100).toFixed(0)}`)
        .join('\n')

      const budgetSlug = allSlugs.find((s) => s in BUDGET_RANGES)
      const budget = budgetSlug ? BUDGET_RANGES[budgetSlug] : null

      const restrictions = allSlugs.filter((s) => s in ALLERGY_LABELS).map((s) => ALLERGY_LABELS[s])
      const prefersNatural = allSlugs.includes('prefiere-natural')
      const activeSafetyFlags = allSlugs.filter((s) => SAFETY_FLAG_TEXTS[s]).map((s) => SAFETY_FLAG_TEXTS[s])

      const genderSlug = allSlugs.find((s) => s.startsWith('genero-'))
      const genderLabel = genderSlug === 'genero-femenino' ? 'mujer' : genderSlug === 'genero-masculino' ? 'hombre' : null
      const pronoun = genderSlug === 'genero-masculino' ? 'él' : 'ella'

      const routineSizeSlug = allSlugs.find((s) => s.startsWith('rutina-'))
      const routineSizeHint: Record<string, string> = {
        'rutina-simple':     'Prefiere una rutina MUY simple: usa 3-4 pasos.',
        'rutina-balanceada': 'Prefiere una rutina balanceada: usa 4-5 pasos.',
        'rutina-completa':   'Quiere una rutina completa: usa 5-6 pasos.',
        'rutina-guiada':     'Pidió ser guiada/o: usa 4-5 pasos.',
      }

      const systemPrompt = `Eres el motor de recomendaciones de LIORA, una marca peruana de bienestar natural.

CATÁLOGO COMPLETO (#item | producto · marca (presentación) | categoría | precio):
Nota: puede haber productos con el mismo nombre en marcas distintas y precios distintos — son productos diferentes; elige la marca que mejor convenga al perfil y presupuesto.
${catalogText}

Tu tarea: a partir del cuestionario de la persona, ARMA UNA RUTINA PERSONALIZADA paso a paso eligiendo productos del catálogo. La rutina es un plan de uso diario: paso 1 toma/usa esto, paso 2 esto, en orden cronológico.

Responde SOLO con JSON:
{
  "routine_name": "string",
  "diagnosis": "string",
  "tags": ["string", ...],
  "steps": [{ "item": número, "product_name": "string", "step_label": "string", "step_when": "string", "step_instruction": "string" }, ...],
  "suggestion_items": [número, ...]
}

Reglas estrictas:
- steps: 4 a 6 pasos (cada paso = un producto DIFERENTE). ${routineSizeSlug ? routineSizeHint[routineSizeSlug] ?? '' : ''}
- item: el número EXACTO del catálogo (#N). product_name: copia EXACTA del nombre de ese mismo item. Si no coinciden, el paso se descarta — verifica que el número y el nombre sean de la MISMA línea del catálogo.
- COHERENCIA (lo más importante): TODOS los productos deben servir directamente al objetivo principal de la persona. Nunca incluyas productos de otras áreas solo para llenar (ej: jamás desodorante o proteína de gym en una rutina digestiva). Respeta las características que la persona indicó (ej: si su piel es grasa, no elijas productos formulados para piel seca).
- Orden cronológico de uso: mañana → noche. step_when corto con emoji y momento, coherente con el tipo de producto (suplementos: en ayunas o con comidas; cosméticos: "🌅 Mañana" / "🌙 Noche" — un sérum no se toma "en ayunas").
- step_label: el ROL del producto en la rutina, 2-4 palabras (ej: "Probiótico vivo intensivo") — NO repitas el nombre del producto.
- step_instruction: 1-2 oraciones concretas: cómo tomarlo/aplicarlo, cantidad, y qué logra en la rutina.
- PRESUPUESTO: ${budget ? `el TOTAL del kit debe quedar ${budget.label}${budget.max ? ` (suma los precios: no pases de S/${budget.max}${budget.min ? ` ni armes algo muy por debajo de S/${budget.min}` : ''})` : ' — puedes elegir lo mejor del catálogo'}. Si el objetivo no se puede cubrir dentro del rango, acércate lo más posible priorizando lo esencial.` : 'sin dato — apunta a un total moderado (S/200-400).'}
- RESTRICCIONES: ${restrictions.length ? `la persona evita: ${restrictions.join(', ')}. CRÍTICO para su seguridad — no incluyas productos que los contengan.` : 'sin restricciones.'}
- PREFERENCIA: ${prefersNatural ? 'prefiere productos 100% naturales y orgánicos — priorízalos.' : 'abierta/o a todo tipo de productos.'}
- GÉNERO: ${genderLabel ? `la persona es ${genderLabel}; usa pronombres correctos (${pronoun}) en el diagnosis.` : 'no especificado — usa lenguaje neutro.'}
- routine_name: nombre corto y atractivo en español que describa el objetivo (ej: "Rutina Digestión Ligera").
- diagnosis: 2-3 oraciones cálidas. Empieza con un insight sobre el perfil (no con "Te recomendamos") y explica por qué esta rutina encaja.${activeSafetyFlags.length ? ' Cierra recordando con calidez consultar a su médico antes de iniciar.' : ''}
- tags: 3-5 etiquetas cortas en español del perfil.
- suggestion_items: 2-4 items del catálogo NO incluidos en steps y afines al MISMO objetivo (nunca de otras áreas). Varía: no repitas el mismo ingrediente o tipo de producto en distintas marcas. Si no hay complementos coherentes, devuelve [].
- CONTEXTO LOCAL: marca peruana; el clima costero húmedo afecta la piel — menciónalo solo si aplica.${activeSafetyFlags.length ? `\n- ADVERTENCIAS MÉDICAS (CRÍTICO — reportadas por la persona, respetar siempre):\n${activeSafetyFlags.map((f, i) => `  ${i + 1}. ${f}`).join('\n')}` : ''}
- Responde completamente en español.`

      type ChatMsg = { role: 'system' | 'user' | 'assistant'; content: string }
      const messages: ChatMsg[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Respuestas del cuestionario:\n${qaLines.join('\n')}` },
      ]

      const callAi = async () => {
        const completion = await openai.chat.completions.create({
          model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
          temperature: 0.4,
          response_format: { type: 'json_object' },
          messages,
        })
        const raw = completion.choices[0]?.message?.content ?? '{}'
        // promptCatalog en el mismo orden con el que se numeró el prompt (#1 = [0])
        return { raw, validated: validateAiRoutine(JSON.parse(raw), promptCatalog) }
      }

      const routineTotalCents = (steps: { variantId: string }[]) =>
        steps.reduce((sum, s) => sum + (catalogByVariant.get(s.variantId)?.priceCents ?? 0), 0)

      let { raw, validated } = await callAi()

      // gpt-4o-mini es débil sumando precios: si se pasó del tope (>15% de
      // tolerancia), se reintenta con la aritmética ya resuelta (desglose por
      // item) hasta 2 veces, quedándonos siempre con la versión más barata
      // válida. Si aun así queda sobre el tope, se acepta: mejor una rutina
      // coherente algo cara que un kit roto (el fallback curado tampoco
      // respeta presupuesto).
      if (validated && budget?.max) {
        const maxCents = budget.max * 100
        for (let retryN = 0; retryN < 2; retryN++) {
          const totalCents = routineTotalCents(validated.steps)
          if (totalCents <= maxCents * 1.15) break

          const breakdown = validated.steps
            .map((s) => {
              const c = catalogByVariant.get(s.variantId)
              return c ? `- ${c.name}: S/${Math.round(c.priceCents / 100)}` : null
            })
            .filter(Boolean)
            .join('\n')

          messages.push(
            { role: 'assistant', content: raw },
            { role: 'user', content: `Tu rutina se pasó del presupuesto. Suma S/${Math.round(totalCents / 100)}:\n${breakdown}\n\nEl máximo de la persona es S/${budget.max}. Rearma la rutina para que el TOTAL quede en S/${budget.max} o menos: reemplaza los productos caros por opciones más económicas del catálogo (revisa los precios de cada línea) o usa menos pasos, manteniendo la coherencia con su objetivo. Responde con el mismo formato JSON.` },
          )
          const retry = await callAi()
          if (!retry.validated) break
          if (routineTotalCents(retry.validated.steps) < totalCents) {
            validated = retry.validated
            raw = retry.raw
          } else {
            break
          }
        }
      }

      if (validated) {
        kitItems = validated.steps.map((s) => ({
          ...catalogByVariant.get(s.variantId)!,
          stepLabel: s.stepLabel,
          stepWhen: s.stepWhen,
          stepInstruction: s.stepInstruction,
        }))
        suggestions = validated.suggestionVariantIds
          .map((id) => catalogByVariant.get(id))
          .filter(Boolean) as CatalogEntry[]
        diagnosis = validated.diagnosis
        tags = validated.tags
        routineName = validated.routineName
      } else {
        console.error('[kit/recommend] AI routine failed validation, falling back to curated routine. Raw:', raw.slice(0, 400))
      }
    } catch (err) {
      console.error('[kit/recommend] OpenAI error:', err)
    }
  }

  // ── Fallback 1: rutina curada de la categoría ganadora ──
  if (kitItems.length === 0) {
    const { kitSlug, topCategory } = selectRoutineKit(allSlugs)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: routineKit, error: routineError } = await (admin as any)
      .from('kits')
      .select(`id, name, slug,
        kit_products(quantity, variant_id, sort_order, step_label, step_when, step_instruction)`)
      .eq('slug', kitSlug)
      .eq('is_active', true)
      .single()

    if (routineError) console.error('[kit/recommend] routine kit fetch failed:', kitSlug, routineError)

    type RoutineRow = { variant_id: string; sort_order: number | null; step_label: string | null; step_when: string | null; step_instruction: string | null }
    const routineRows = (((routineKit?.kit_products ?? []) as RoutineRow[]))
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))

    kitItems = routineRows
      .map((kp) => {
        const base = catalogByVariant.get(kp.variant_id)
        if (!base) return null
        return { ...base, stepLabel: kp.step_label, stepWhen: kp.step_when, stepInstruction: kp.step_instruction }
      })
      .filter(Boolean) as CatalogEntry[]

    if (kitItems.length > 0) {
      routineName = routineKit?.name ?? null
      routineSlug = routineKit ? kitSlug : null
      diagnosis = topCategory ? FALLBACK_DIAGNOSIS[topCategory] : 'Armamos una rutina de bienestar pensada para ti, paso a paso.'
      tags = topCategory ? FALLBACK_TAGS[topCategory] : ['Bienestar', 'Personalizado']
    }
  }

  // ── Fallback 2 (red de seguridad): solo categorías que puntuaron ──
  if (kitItems.length === 0) {
    const usedProducts = new Set<string>()
    for (const { cat, score } of scoresSortedDesc(scores)) {
      if (score <= 0) continue
      const catProds = catalog.filter((c) => c.categorySlug === cat && !usedProducts.has(c.productId))
      catProds.slice(0, 2).forEach((p) => { kitItems.push(p); usedProducts.add(p.productId) })
    }
    if (kitItems.length === 0) {
      console.error('[kit/recommend] no routine and no scored categories for profile', profileId)
      return NextResponse.json({ error: 'No pudimos armar tu kit. Intenta de nuevo.' }, { status: 500 })
    }
    const top = scoresSortedDesc(scores)[0]?.cat
    diagnosis = top ? FALLBACK_DIAGNOSIS[top] : 'Seleccionamos productos alineados a tus objetivos de bienestar.'
    tags = top ? FALLBACK_TAGS[top] : ['Bienestar', 'Personalizado']
  }

  // ── Sugerencias: completar si la IA no dio suficientes ──
  // Identidad de producto = nombre + marca (hay productos con el mismo nombre
  // en marcas distintas y ambos son válidos)
  const identity = (item: CatalogEntry) => `${item.name} · ${item.brand ?? ''}`.trim().toLowerCase()
  const kitProductIds = new Set(kitItems.map((k) => k.productId))
  const kitIdentities = new Set(kitItems.map(identity))
  const notInKit = (item: CatalogEntry) =>
    !kitProductIds.has(item.productId) && !kitIdentities.has(identity(item))

  if (suggestions.length === 0) {
    // Fuentes en orden de afinidad: categorías con señal clara del quiz (score >= 2)
    // y luego las categorías que componen la propia rutina.
    const suggestionCats: string[] = []
    for (const { cat, score } of scoresSortedDesc(scores)) {
      if (score >= 2) suggestionCats.push(cat)
    }
    for (const k of kitItems) {
      if (k.categorySlug && !suggestionCats.includes(k.categorySlug)) suggestionCats.push(k.categorySlug)
    }
    for (const cat of suggestionCats) {
      if (suggestions.length >= 4) break
      for (const item of catalog) {
        if (suggestions.length >= 4) break
        if (item.categorySlug === cat && notInKit(item) &&
            !suggestions.some((s) => s.productId === item.productId || identity(s) === identity(item))) {
          suggestions.push(item)
        }
      }
    }
  }

  const kitVariantIds = kitItems.map((k) => k.variantId)
  const suggestionVariantIds = suggestions.map((s) => s.variantId)

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

  return NextResponse.json({
    kit: kitItems,
    suggestions,
    diagnosis,
    tags,
    routineName,
    routineSlug,
  })
}
