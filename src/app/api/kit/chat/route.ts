import { randomUUID } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { consumeRateLimit, requestIp } from '@/lib/security/rate-limit'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { loadCatalog, type CatalogItem } from '@/lib/recommendation/related'
import {
  buildCartSwapSuggestions,
  containsExternalRecommendation,
  deterministicAssistantReply,
  type CartSwapSuggestion,
} from '@/lib/assistant/cart-agent'

export const maxDuration = 30

const schema = z.object({
  message: z.string().trim().min(1).max(300),
  profileId: z.string().uuid(),
  conversationId: z.string().uuid().optional(),
  cart: z.array(z.object({
    variantId: z.string().uuid(),
    quantity: z.number().int().min(1).max(99),
  })).min(1).max(10),
})

type ConversationRow = { id: string }

async function canAccessProfile(request: NextRequest, profileId: string) {
  const admin = createAdminClient()
  const supabase = await createClient()
  const [{ data: { user } }, { data: profile }] = await Promise.all([
    supabase.auth.getUser(),
    admin.from('quiz_profiles').select('id, user_id, session_token').eq('id', profileId).maybeSingle(),
  ])
  if (!profile) return { allowed: false as const, admin, user: null }
  const sessionToken = request.cookies.get('liora_session')?.value
  const allowed = Boolean(
    (user && profile.user_id === user.id)
    || (sessionToken && profile.session_token === sessionToken),
  )
  return { allowed, admin, user }
}

function publicSuggestion(suggestion: CartSwapSuggestion, catalogByVariant: Map<string, CatalogItem>) {
  const replacement = catalogByVariant.get(suggestion.replacementVariantId)
  if (!replacement) return null
  return {
    id: suggestion.id,
    sourceVariantId: suggestion.sourceVariantId,
    quantity: suggestion.quantity,
    reason: suggestion.reason,
    savingsCents: suggestion.savingsCents,
    replacement: {
      variantId: replacement.variantId,
      productId: replacement.productId,
      name: replacement.name,
      brand: replacement.brand,
      variantName: replacement.variantName,
      categoryName: replacement.categoryName,
      priceCents: replacement.priceCents,
      currency: replacement.currency,
      imageUrl: replacement.imageUrl,
      categoryColor: replacement.categoryColor,
      stockQuantity: replacement.stockQuantity,
      usageInstructions: replacement.usageInstructions,
    },
  }
}

export async function POST(request: NextRequest) {
  if (!await consumeRateLimit('kit-chat', requestIp(request), 20, 60)) {
    return NextResponse.json({ reply: 'Demasiadas solicitudes. Espera un momento.' }, { status: 429 })
  }

  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Mensaje inválido.' }, { status: 400 })

  const { message, profileId, cart } = parsed.data
  const access = await canAccessProfile(request, profileId)
  if (!access.allowed) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  const { admin, user } = access

  let conversation: ConversationRow | null = null
  if (parsed.data.conversationId) {
    const { data } = await admin
      .from('bot_conversations')
      .select('id')
      .eq('id', parsed.data.conversationId)
      .eq('quiz_profile_id', profileId)
      .maybeSingle()
    conversation = data
  }
  if (!conversation) {
    const { data } = await admin
      .from('bot_conversations')
      .insert({
        user_id: user?.id ?? null,
        session_token: null,
        quiz_profile_id: profileId,
        context_product_ids: [],
        context_cart_id: null,
      })
      .select('id')
      .single()
    conversation = data
  }
  if (!conversation) return NextResponse.json({ error: 'No se pudo iniciar la conversación' }, { status: 500 })

  const catalog = await loadCatalog(admin)
  const catalogByVariant = new Map(catalog.map((item) => [item.variantId, item]))
  const resolvedCart = cart.filter((line) => catalogByVariant.has(line.variantId))
  if (!resolvedCart.length) return NextResponse.json({ error: 'El carrito no contiene productos vigentes' }, { status: 400 })

  await admin.from('bot_conversations').update({
    context_product_ids: resolvedCart.map((line) => catalogByVariant.get(line.variantId)!.productId),
  }).eq('id', conversation.id)

  await admin.from('bot_messages').insert({
    conversation_id: conversation.id,
    role: 'user',
    content: message,
    suggested_swap: null,
    swap_accepted: null,
  })

  const suggestions = buildCartSwapSuggestions(catalog, resolvedCart, message, randomUUID)
  const fallbackReply = deterministicAssistantReply(message, suggestions)
  let reply = fallbackReply

  if (process.env.OPENAI_API_KEY) {
    try {
      const { default: OpenAI } = await import('openai')
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 15000, maxRetries: 1 })
      const currentText = resolvedCart.map((line) => {
        const item = catalogByVariant.get(line.variantId)!
        return `- ${item.name} · ${item.brand ?? 'sin marca'} (${item.variantName}), ${item.categoryName}, S/${(item.priceCents / 100).toFixed(0)}`
      }).join('\n')
      const optionText = suggestions.map((suggestion, index) => {
        const item = catalogByVariant.get(suggestion.replacementVariantId)!
        return `#${index + 1}: ${item.name} · ${item.brand ?? 'sin marca'}, S/${(item.priceCents / 100).toFixed(0)}. ${suggestion.reason}`
      }).join('\n') || 'No hay alternativas validadas.'

      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
        temperature: 0.2,
        max_tokens: 140,
        messages: [
          {
            role: 'system',
            content: 'Eres Lía, asistente de compras de LIORA. Responde en español y máximo 2 oraciones. Solo puedes hablar del carrito y de las alternativas LIORA enumeradas. Nunca recomiendes farmacias, tiendas externas ni productos que no estén enumerados. No inventes precios, stock, efectos médicos ni dosificaciones. Si no hay alternativas validadas, pregunta qué producto quiere revisar y qué prioriza.',
          },
          { role: 'user', content: `Carrito actual:\n${currentText}\n\nAlternativas validadas:\n${optionText}\n\nPregunta: ${message}` },
        ],
      })
      const candidateReply = completion.choices[0]?.message?.content?.trim()
      if (candidateReply && !containsExternalRecommendation(candidateReply)) reply = candidateReply
    } catch (error) {
      console.error('[kit/chat] OpenAI fallback', error)
    }
  }

  const serializedSuggestions = suggestions
    .map((suggestion) => publicSuggestion(suggestion, catalogByVariant))
    .filter((suggestion) => suggestion !== null)
  const { data: assistantMessage } = await admin.from('bot_messages').insert({
    conversation_id: conversation.id,
    role: 'assistant',
    content: reply,
    suggested_swap: serializedSuggestions,
    swap_accepted: serializedSuggestions.length ? false : null,
  }).select('id').single()

  return NextResponse.json({
    conversationId: conversation.id,
    messageId: assistantMessage?.id ?? null,
    reply,
    suggestions: serializedSuggestions,
  })
}
