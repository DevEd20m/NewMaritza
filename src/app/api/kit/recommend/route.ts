import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const CAT_COLORS: Record<string, string> = {
  organicos: 'var(--cat-menta)',
  gym: 'var(--cat-coral)',
  'skin-care': 'var(--cat-lavanda)',
  vitaminas: 'var(--cat-mostaza)',
}

const SLUG_WEIGHTS: Record<string, Record<string, number>> = {
  gym: { gym: 3 },
  'alto-rendimiento': { gym: 3 },
  activo: { gym: 2 },
  principiante: { gym: 1 },
  peso: { gym: 2, vitaminas: 1 },
  skin: { 'skin-care': 3 },
  'piel-grasa': { 'skin-care': 3 },
  'piel-seca': { 'skin-care': 3 },
  'piel-mixta': { 'skin-care': 3 },
  'piel-sensible': { 'skin-care': 3 },
  belleza: { 'skin-care': 2, vitaminas: 1 },
  organico: { organicos: 3 },
  'muy-saludable': { organicos: 2 },
  'en-proceso': { organicos: 2 },
  'quiero-mejorar': { organicos: 2 },
  irregular: { organicos: 1 },
  energia: { vitaminas: 3, organicos: 1 },
  'energia-mental': { vitaminas: 3 },
  inmune: { vitaminas: 2 },
  'manana-lenta': { vitaminas: 2 },
  'manana-cafe': { vitaminas: 1 },
  'tiempo-minimo': {},
  'tiempo-medio': {},
  'tiempo-completo': {},
  'sin-condicion': {},
  embarazo: {},
  digestivo: { organicos: 2 },
  alergias: { 'skin-care': 1 },
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

  const admin = createAdminClient()

  const { data: profile } = await admin
    .from('quiz_profiles')
    .select('id, answers, template_id')
    .eq('id', profileId)
    .single()

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

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
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

      const catalogText = catalog
        .map((c) => `ID:${c.variantId} | ${c.name} (${c.variantName}) | ${c.categoryName} | S/${(c.priceCents / 100).toFixed(0)}`)
        .join('\n')

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.3,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `Eres el motor de recomendaciones de LIORA, una marca peruana de bienestar.
Dado el cuestionario de una clienta y el catálogo, devuelve un kit personalizado.

Responde SOLO con JSON:
{
  "kit_variant_ids": ["id",...],
  "suggestion_variant_ids": ["id",...],
  "diagnosis": "string",
  "tags": ["string",...]
}

Reglas:
- kit_variant_ids: 4-5 variantes en orden de prioridad (usa los IDs exactos del catálogo)
- suggestion_variant_ids: 3-4 variantes adicionales no incluidas en el kit
- diagnosis: 1-2 oraciones en español personalizadas
- tags: 3-5 etiquetas cortas en español (ej: "Piel mixta", "Energía", "Post-entreno")
- No repitas el mismo producto
- Considera condiciones especiales
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
      kitVariantIds = parsed.kit_variant_ids ?? []
      suggestionVariantIds = parsed.suggestion_variant_ids ?? []
      diagnosis = parsed.diagnosis ?? ''
      tags = parsed.tags ?? []
    } catch (err) {
      console.error('[kit/recommend] OpenAI error:', err)
    }
  }

  // Scoring fallback
  if (kitVariantIds.length === 0) {
    const scores: Record<string, number> = { organicos: 0, gym: 0, 'skin-care': 0, vitaminas: 0 }
    for (const slug of allSlugs) {
      const w = SLUG_WEIGHTS[slug]
      if (w) {
        for (const [cat, pts] of Object.entries(w)) scores[cat] = (scores[cat] ?? 0) + pts
      }
    }

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
    if (scores.gym > 0) topTags.push('Gym')
    if (scores['skin-care'] > 0) topTags.push('Skin Care')
    if (scores.organicos > 0) topTags.push('Alimentación limpia')
    if (scores.vitaminas > 0) topTags.push('Vitaminas')
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
