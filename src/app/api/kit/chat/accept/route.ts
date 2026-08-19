import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { consumeRateLimit, requestIp } from '@/lib/security/rate-limit'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { loadCatalog } from '@/lib/recommendation/related'

const schema = z.object({
  profileId: z.string().uuid(),
  conversationId: z.string().uuid(),
  messageId: z.string().uuid(),
  suggestionId: z.string().uuid(),
  quantity: z.number().int().min(1).max(99),
})

interface StoredSuggestion {
  id: string
  sourceVariantId: string
  quantity: number
  replacement: { variantId: string }
}

export async function POST(request: NextRequest) {
  if (!await consumeRateLimit('kit-chat-accept', requestIp(request), 20, 60)) {
    return NextResponse.json({ error: 'Demasiadas solicitudes' }, { status: 429 })
  }
  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Cambio inválido' }, { status: 400 })

  const { profileId, conversationId, messageId, suggestionId, quantity } = parsed.data
  const admin = createAdminClient()
  const supabase = await createClient()
  const [{ data: { user } }, { data: profile }] = await Promise.all([
    supabase.auth.getUser(),
    admin.from('quiz_profiles').select('id, user_id, session_token').eq('id', profileId).maybeSingle(),
  ])
  const sessionToken = request.cookies.get('liora_session')?.value
  const ownsProfile = Boolean(profile && (
    (user && profile.user_id === user.id)
    || (sessionToken && profile.session_token === sessionToken)
  ))
  if (!ownsProfile) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { data: conversation } = await admin
    .from('bot_conversations')
    .select('id')
    .eq('id', conversationId)
    .eq('quiz_profile_id', profileId)
    .maybeSingle()
  if (!conversation) return NextResponse.json({ error: 'Conversación inválida' }, { status: 404 })

  const { data: message } = await admin.from('bot_messages')
    .select('id, suggested_swap, swap_accepted')
    .eq('id', messageId)
    .eq('conversation_id', conversationId)
    .eq('role', 'assistant')
    .maybeSingle()
  if (!message || message.swap_accepted) return NextResponse.json({ error: 'Sugerencia no disponible' }, { status: 409 })

  const suggestions = Array.isArray(message.suggested_swap)
    ? message.suggested_swap as unknown as StoredSuggestion[]
    : []
  const suggestion = suggestions.find((entry) => entry.id === suggestionId)
  if (!suggestion || suggestion.quantity !== quantity) {
    return NextResponse.json({ error: 'Sugerencia manipulada' }, { status: 400 })
  }

  const catalog = await loadCatalog(admin)
  const replacement = catalog.find((item) => item.variantId === suggestion.replacement.variantId)
  if (!replacement || (replacement.stockQuantity !== null && replacement.stockQuantity < quantity)) {
    return NextResponse.json({ error: 'La alternativa ya no está disponible' }, { status: 409 })
  }

  const { data: accepted } = await admin.from('bot_messages').update({ swap_accepted: true })
    .eq('id', messageId)
    .eq('conversation_id', conversationId)
    .eq('swap_accepted', false)
    .select('id')
    .maybeSingle()
  if (!accepted) return NextResponse.json({ error: 'La sugerencia ya fue utilizada' }, { status: 409 })

  return NextResponse.json({
    sourceVariantId: suggestion.sourceVariantId,
    replacement: {
      variantId: replacement.variantId,
      productId: replacement.productId,
      name: replacement.name,
      brand: replacement.brand,
      variantName: replacement.variantName,
      priceCents: replacement.priceCents,
      currency: replacement.currency,
      imageUrl: replacement.imageUrl,
      categoryColor: replacement.categoryColor,
      categoryName: replacement.categoryName,
      stockQuantity: replacement.stockQuantity,
      usageInstructions: replacement.usageInstructions,
    },
  })
}
