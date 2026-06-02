import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { Package } from '@phosphor-icons/react/dist/ssr'
import { MiniQuizInline } from '@/components/products/MiniQuizInline'
import { buildKitMetadata, buildKitJsonLd } from '@/lib/seo/metadata'
import { ViewerBadge } from '@/components/urgency/ViewerBadge'
import { StockUrgency } from '@/components/urgency/StockUrgency'

interface Props { params: Promise<{ slug: string }> }

async function getKit(slug: string) {
  const admin = createAdminClient()
  const { data } = await (admin as any)
    .from('kits')
    .select(`id, name, slug, description, is_active,
      kit_products(quantity, variant_id,
        product_variants!variant_id(id, name, sku,
          products!product_id(id, name, slug, cover_image_url, description,
            categories!category_id(name, slug)
          ),
          product_prices!variant_id(amount_cents, compare_at_cents, effective_to)
        )
      )`)
    .eq('slug', slug)
    .eq('is_active', true)
    .single()
  return data
}

async function getMiniQuizTemplate(kitId: string) {
  const admin = createAdminClient()
  const { data: template } = await admin
    .from('quiz_templates')
    .select('id')
    .eq('kit_id', kitId)
    .single()
  if (!template) return null

  const { data: groups } = await (admin as any)
    .from('quiz_question_groups')
    .select('id, quiz_questions(id, text, subtext, type, sort_order, quiz_question_options!question_id(id, text, slug, sort_order))')
    .eq('template_id', template.id)
    .order('sort_order')

  return { templateId: template.id, groups: groups ?? [] }
}

const KIT_COLORS: Record<string, string> = {
  energia: 'var(--cat-mostaza)',
  piel: 'var(--cat-coral)',
  colageno: 'var(--cat-coral)',
  capilar: 'var(--cat-coral)',
  'post-entreno': 'var(--cat-durazno)',
  gym: 'var(--cat-durazno)',
  reset: 'var(--cat-menta)',
  detox: 'var(--cat-menta)',
  andino: 'var(--cat-menta)',
  bienestar: 'var(--cat-menta)',
  articulaciones: 'var(--cat-mostaza)',
}
function kitColor(slug: string) {
  for (const [k, v] of Object.entries(KIT_COLORS)) if (slug.includes(k)) return v
  return 'var(--cat-lavanda)'
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const kit = await getKit(slug)
  if (!kit) return { title: 'Kit no encontrado' }
  return buildKitMetadata(kit as any)
}

export default async function KitPage({ params }: Props) {
  const { slug } = await params
  const [kit, miniQuiz] = await Promise.all([getKit(slug), (async () => {
    const k = await getKit(slug)
    if (!k) return null
    return getMiniQuizTemplate(k.id)
  })()])

  if (!kit) notFound()

  const bg = kitColor(slug)
  const items = (kit.kit_products ?? []) as any[]
  const totalCents = items.reduce((s: number, kp: any) => {
    const price = kp.product_variants?.product_prices?.find((p: any) => !p.effective_to)
      ?? kp.product_variants?.product_prices?.[0]
    return s + (price?.amount_cents ?? 0) * (kp.quantity ?? 1)
  }, 0)

  const jsonLdProducts = items
    .map((kp: any) => {
      const v = kp.product_variants
      const p = v?.products
      const price = v?.product_prices?.find((pp: any) => !pp.effective_to) ?? v?.product_prices?.[0]
      if (!p) return null
      return { name: p.name, slug: p.slug, cover_image_url: p.cover_image_url, priceCents: price?.amount_cents }
    })
    .filter(Boolean) as Array<{ name: string; slug: string; cover_image_url?: string | null; priceCents?: number }>

  return (
    <div style={{ background: 'var(--liora-crema)', minHeight: '100vh' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildKitJsonLd(kit as any, jsonLdProducts)) }}
      />
      {/* Hero */}
      <div style={{ background: bg, padding: '64px 48px 56px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--liora-uva)', opacity: 0.7, marginBottom: 12 }}>
            Bundle · {items.length} productos
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 64, lineHeight: 1.0, color: 'var(--liora-uva)', margin: '0 0 16px', fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1" }}>
            {kit.name}
          </h1>
          {kit.description && (
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 18, color: 'var(--liora-uva)', opacity: 0.8, maxWidth: 540, margin: '0 0 32px', lineHeight: 1.5 }}>
              {kit.description}
            </p>
          )}
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 40, color: 'var(--liora-uva)' }}>
            S/{(totalCents / 100).toFixed(0)}
          </div>
          <ViewerBadge baseCount={8 + (kit.slug.charCodeAt(4) % 8)} />
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 48px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 40, alignItems: 'start' }}>

          {/* Products */}
          <div>
            <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--liora-uva)', opacity: 0.6, marginBottom: 20 }}>
              Qué incluye
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {items.map((kp: any, i: number) => {
                const variant = kp.product_variants
                const product = variant?.products
                const price = variant?.product_prices?.find((p: any) => !p.effective_to) ?? variant?.product_prices?.[0]
                const cat = product?.categories
                if (!product) return null
                return (
                  <div key={i} style={{ background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-arena)', borderRadius: 20, padding: '18px 20px', display: 'flex', gap: 16, alignItems: 'center' }}>
                    <div style={{ width: 72, height: 72, borderRadius: 14, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                      {product.cover_image_url
                        ? <img src={product.cover_image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <Package size={32} weight="bold" color="var(--liora-uva)" style={{ opacity: 0.4 }} />
                      }
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, color: 'var(--liora-uva)', opacity: 0.55, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{cat?.name ?? ''}</div>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--liora-uva)', margin: '2px 0' }}>{product.name}</div>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--liora-uva)', opacity: 0.6 }}>{variant?.name}</div>
                    </div>
                    <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 16, color: 'var(--liora-uva)' }}>
                      {price ? `S/${(price.amount_cents / 100).toFixed(0)}` : '—'}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Mini-quiz or direct add */}
          <div style={{ position: 'sticky', top: 24 }}>
            {miniQuiz ? (
              <div style={{ background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-arena)', borderRadius: 24, padding: '28px 28px' }}>
                <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--liora-uva)', opacity: 0.6, marginBottom: 8 }}>
                  3 preguntas · 45 segundos
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, color: 'var(--liora-uva)', marginBottom: 4, fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1" }}>
                  Personaliza este kit para ti.
                </div>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--liora-uva)', opacity: 0.65, marginBottom: 24, lineHeight: 1.5 }}>
                  Respondemos 3 preguntas rápidas para asegurarnos de que este kit es perfecto para tu cuerpo y objetivos.
                </p>
                <MiniQuizInline
                  templateId={miniQuiz.templateId}
                  groups={miniQuiz.groups}
                  kitName={kit.name}
                />
              </div>
            ) : (
              <div style={{ background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-arena)', borderRadius: 24, padding: '28px 28px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 36, color: 'var(--liora-uva)', marginBottom: 4 }}>S/{(totalCents / 100).toFixed(0)}</div>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--liora-uva)', opacity: 0.65, marginBottom: 16 }}>
                  Bundle de {items.length} productos
                </p>
                <StockUrgency productId={kit.id} threshold={8} />
                <a href="/cuestionario" style={{ display: 'block', marginTop: 20, background: 'var(--liora-uva)', color: 'var(--liora-crema)', borderRadius: 999, padding: '16px 24px', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 16, textDecoration: 'none', textAlign: 'center' }}>
                  Hacer cuestionario completo
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
