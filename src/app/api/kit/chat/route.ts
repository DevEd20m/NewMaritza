import { randomUUID } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { consumeRateLimit, requestIp } from '@/lib/security/rate-limit'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { loadCatalog, describeForPrompt, type CatalogItem } from '@/lib/recommendation/related'
import { loadProfileIndexById } from '@/lib/recommendation/profile-loader'
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

      // Lía conoce el cuestionario de la persona y para quién es cada producto
      // del kit. Sin esto no podía responder «¿por qué me diste esto?» — solo
      // veía nombres y precios.
      const loaded = await loadProfileIndexById(admin, profileId)
      const currentText = resolvedCart.map((line) => {
        const item = catalogByVariant.get(line.variantId)!
        const para = describeForPrompt(item)
        return `- ${item.name} · ${item.brand ?? 'sin marca'} (${item.variantName}), ${item.categoryName}, S/${(item.priceCents / 100).toFixed(0)}${para ? `\n  Para quién es: ${para}` : ''}`
      }).join('\n')
      const optionText = suggestions.map((suggestion, index) => {
        const item = catalogByVariant.get(suggestion.replacementVariantId)!
        return `#${index + 1}: ${item.name} · ${item.brand ?? 'sin marca'}, S/${(item.priceCents / 100).toFixed(0)}. ${suggestion.reason}`
      }).join('\n') || 'No hay alternativas validadas.'

      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
        temperature: 0.3,
        max_tokens: 260,
        messages: [
          {
            role: 'system',
            content: `Eres Lía, la asistente de bienestar de LIORA. Este kit se armó a partir del cuestionario de la persona; tu trabajo es que entienda su rutina y confíe en ella.

Puedes:
- Explicar POR QUÉ cada producto del kit encaja con su perfil (cruza el perfil con el «para quién es» de cada producto).
- Explicar cómo y cuándo usar cada producto del kit.
- Ofrecer las alternativas LIORA enumeradas si pregunta por cambios, precio o preferencias.

Reglas estrictas:
- Responde en español, cálida y concreta, en 2 a 4 oraciones.
- Solo hablas de los productos del kit y de las alternativas enumeradas. Jamás recomiendes farmacias, tiendas externas ni productos no enumerados.
- No inventes precios, stock, efectos médicos ni dosificaciones; no prometas tratar ni curar condiciones.
- Si la persona menciona embarazo, medicamentos o una condición médica, sugiere consultar a su médico.
- Si preguntan algo fuera del kit o del cuestionario, redirige con amabilidad a la rutina.`,
          },
          {
            role: 'user',
            content: `PERFIL DEL CUESTIONARIO:\n${loaded?.perfilTexto ?? 'sin datos del cuestionario'}\n\nKIT ACTUAL:\n${currentText}\n\nALTERNATIVAS VALIDADAS:\n${optionText}\n\nPregunta de la persona: ${message}`,
          },
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
