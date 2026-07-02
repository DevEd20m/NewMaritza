import { createAdminClient } from '@/lib/supabase/admin'
import { detectKitFromItemsDB } from './db'
import { evaluateSafetyFlags } from './safety'

export async function generateOrderGuideSnapshot(orderId: string): Promise<void> {
  const admin = createAdminClient()

  // 1. Cargar orden con items y sus datos de producto
  const { data: order } = await (admin as any)
    .from('orders')
    .select(`
      id,
      user_id,
      guest_email,
      quiz_profile_id,
      order_items (
        variant_id,
        product_name_snapshot,
        variant_name_snapshot,
        product_variants (
          products (
            usage_instructions,
            indications,
            contraindications
          )
        )
      )
    `)
    .eq('id', orderId)
    .single()

  if (!order) return

  // 2. Detectar kit_guide por keywords a partir de los nombres de productos
  const productNames: string[] = (order.order_items ?? []).map(
    (i: { product_name_snapshot: string }) => i.product_name_snapshot
  )
  const guide = await detectKitFromItemsDB(productNames)

  // 3. Cargar quiz_profile si la orden tiene uno asociado
  let quizAnswers: Record<string, unknown> = {}
  let appliedTags: string[] = []
  let quizProfileId: string | null = order.quiz_profile_id ?? null

  if (quizProfileId) {
    const { data: qp } = await (admin as any)
      .from('quiz_profiles')
      .select('answers, applied_tags')
      .eq('id', quizProfileId)
      .single()

    if (qp) {
      quizAnswers = qp.answers ?? {}
      appliedTags = qp.applied_tags ?? []
    }
  }

  // 4. Construir snapshot de productos con instrucciones de uso
  const productsSnapshot = (order.order_items ?? []).map((item: {
    product_name_snapshot: string
    variant_name_snapshot: string
    product_variants?: { products?: { usage_instructions?: string | null; indications?: string | null; contraindications?: string | null } | null } | null
  }) => ({
    name: item.product_name_snapshot,
    variant: item.variant_name_snapshot,
    usage_instructions: item.product_variants?.products?.usage_instructions ?? null,
    indications: item.product_variants?.products?.indications ?? null,
    contraindications: item.product_variants?.products?.contraindications ?? null,
  }))

  // 5. Evaluar safety flags con reglas locales (sin IA)
  const safetyFlags = evaluateSafetyFlags(appliedTags)

  // 6. Insertar snapshot (idempotente: omitir si ya existe para esta orden)
  const { data: existing } = await (admin as any)
    .from('order_guide_snapshots')
    .select('id')
    .eq('order_id', orderId)
    .maybeSingle()

  if (existing) return // ya fue generado

  await (admin as any).from('order_guide_snapshots').insert({
    order_id: order.id,
    user_id: order.user_id ?? null,
    guest_email: order.guest_email ?? null,
    kit_template_id: null, // kit_guides no tiene id expuesto en KitGuide type — se puede extender si se necesita
    quiz_profile_id: quizProfileId,
    guide_snapshot_json: guide ? (guide as unknown as Record<string, unknown>) : {},
    products_snapshot_json: productsSnapshot,
    safety_flags_snapshot_json: safetyFlags,
    quiz_answers_snapshot_json: quizAnswers,
  })
}
