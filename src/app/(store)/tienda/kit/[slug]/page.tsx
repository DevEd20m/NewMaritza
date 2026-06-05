import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { Package, ArrowRight, Sparkle } from '@phosphor-icons/react/dist/ssr'
import { MiniQuizInline } from '@/components/products/MiniQuizInline'
import { buildKitMetadata, buildKitJsonLd } from '@/lib/seo/metadata'
import { ViewerBadge } from '@/components/urgency/ViewerBadge'
import { StockUrgency } from '@/components/urgency/StockUrgency'
import Link from 'next/link'
import { getGuideBySlugDB } from '@/lib/guides/db'

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
  const guide = await getGuideBySlugDB(slug)
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

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <div className="liora-cart-outer" style={{ background: bg, padding: '56px 48px 52px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <Link href="/tienda#kits-base" style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'var(--liora-uva)', opacity: 0.55, textDecoration: 'none' }}>
              Kits base
            </Link>
            <span style={{ color: 'var(--liora-uva)', opacity: 0.35, fontSize: 13 }}>→</span>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'var(--liora-uva)', opacity: 0.8 }}>{kit.name}</span>
          </div>

          {/* Label */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(61,26,58,0.1)', borderRadius: 999, padding: '5px 14px', marginBottom: 16 }}>
            <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.13em', color: 'var(--liora-uva)', opacity: 0.7 }}>
              Kit base · {items.length} productos · Personalizable
            </span>
          </div>

          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 60, lineHeight: 1.0, color: 'var(--liora-uva)', margin: '0 0 14px', fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1" }}>
            {kit.name}
          </h1>
          {kit.description && (
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 17, color: 'var(--liora-uva)', opacity: 0.78, maxWidth: 520, margin: '0 0 28px', lineHeight: 1.5 }}>
              {kit.description}
            </p>
          )}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 38, color: 'var(--liora-uva)' }}>
              S/{(totalCents / 100).toFixed(0)}
            </span>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--liora-uva)', opacity: 0.55 }}>
              precio base del kit
            </span>
          </div>
          <ViewerBadge baseCount={8 + (kit.slug.charCodeAt(4) % 8)} />
        </div>
      </div>

      {/* ── Contenido ─────────────────────────────────────────────────── */}
      <div className="liora-cart-outer" style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 48px 96px' }}>
        <div className="liora-product-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 40, alignItems: 'start' }}>

          {/* Productos del kit */}
          <div>
            <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--liora-uva)', opacity: 0.55, marginBottom: 18 }}>
              Qué incluye este kit base
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {items.map((kp: any, i: number) => {
                const variant = kp.product_variants
                const product = variant?.products
                const price = variant?.product_prices?.find((p: any) => !p.effective_to) ?? variant?.product_prices?.[0]
                const cat = product?.categories
                if (!product) return null
                return (
                  <div key={i} style={{ background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-arena)', borderRadius: 20, padding: '16px 18px', display: 'flex', gap: 14, alignItems: 'center' }}>
                    <div style={{ width: 68, height: 68, borderRadius: 14, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                      {product.cover_image_url
                        ? <img src={product.cover_image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        : <Package size={28} weight="bold" color="var(--liora-uva)" style={{ opacity: 0.4 }} />
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700, color: 'var(--liora-uva)', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        {cat?.name ?? ''}
                      </div>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, color: 'var(--liora-uva)', margin: '2px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {product.name}
                      </div>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--liora-uva)', opacity: 0.55 }}>
                        {variant?.name}
                      </div>
                    </div>
                    <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15, color: 'var(--liora-uva)', flexShrink: 0 }}>
                      {price ? `S/${(price.amount_cents / 100).toFixed(0)}` : '—'}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Nota de personalización */}
            <div style={{
              marginTop: 24, background: 'var(--liora-lima)', borderRadius: 16,
              padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <Sparkle size={18} weight="fill" color="var(--liora-uva)" style={{ flexShrink: 0 }} />
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--liora-uva)', margin: 0, lineHeight: 1.45 }}>
                <strong>¿Algún producto no te convence?</strong> El cuestionario completo hace una selección diferente, ajustada exactamente a tu perfil.{' '}
                <Link href="/cuestionario" style={{ color: 'var(--liora-uva)', fontWeight: 700, textDecoration: 'underline' }}>
                  Probar el cuestionario →
                </Link>
              </p>
            </div>

            {/* ── Tu rutina del día (mini-preview de la guía) ── */}
            {guide && (
              <div style={{ marginTop: 24, background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-arena)', borderRadius: 20, overflow: 'hidden' }}>
                <div style={{ background: bg, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--liora-uva)', opacity: 0.7 }}>
                    Tu rutina del día
                  </div>
                  <Link href={`/guia/${slug}`} style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 12, color: 'var(--liora-uva)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, opacity: 0.75 }}>
                    Guía completa <ArrowRight size={12} weight="bold" />
                  </Link>
                </div>
                <div style={{ padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {guide.schedule.map((s, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <div style={{ width: 32, height: 32, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                        {s.emoji}
                      </div>
                      <div>
                        <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--liora-uva)', opacity: 0.5, marginBottom: 2 }}>
                          {s.time}
                        </div>
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--liora-uva)', opacity: 0.8, lineHeight: 1.35 }}>
                          {s.products.join(' + ')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Panel de acción: Quiz o compra */}
          <div style={{ position: 'sticky', top: 24 }}>
            {miniQuiz ? (
              /* ── Mini-quiz disponible: es el protagonista ── */
              <div style={{ background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-arena)', borderRadius: 24, overflow: 'hidden' }}>
                {/* Header con color del kit */}
                <div style={{ background: bg, padding: '24px 28px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Sparkle size={16} weight="fill" color="var(--liora-uva)" />
                    <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--liora-uva)', opacity: 0.7 }}>
                      3 preguntas · 45 segundos
                    </span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: 'var(--liora-uva)', lineHeight: 1.1, fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1" }}>
                    Personaliza este kit para ti.
                  </div>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--liora-uva)', opacity: 0.65, margin: '8px 0 0', lineHeight: 1.45 }}>
                    3 preguntas rápidas para asegurarnos de que cada producto es perfecto para tu cuerpo.
                  </p>
                </div>
                <div style={{ padding: '24px 28px 28px' }}>
                  <MiniQuizInline
                    templateId={miniQuiz.templateId}
                    groups={miniQuiz.groups}
                    kitName={kit.name}
                  />
                  {/* Compra directa como opción secundaria */}
                  <div style={{ textAlign: 'center', marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--liora-arena)' }}>
                    <StockUrgency productId={kit.id} threshold={8} />
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--liora-uva)', opacity: 0.45, margin: '12px 0 0' }}>
                      ¿Ya sabes lo que quieres?{' '}
                      <a href="/cuestionario" style={{ color: 'var(--liora-uva)', fontWeight: 600, opacity: 0.6, textDecoration: 'underline' }}>
                        Comprar kit tal cual
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* ── Sin mini-quiz: cuestionario completo como protagonista ── */
              <div style={{ background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-arena)', borderRadius: 24, overflow: 'hidden' }}>
                {/* Header */}
                <div style={{ background: bg, padding: '28px 28px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <Sparkle size={16} weight="fill" color="var(--liora-uva)" />
                    <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--liora-uva)', opacity: 0.7 }}>
                      Recomendado
                    </span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: 'var(--liora-uva)', lineHeight: 1.1, fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1" }}>
                    Que la IA lo personalice para ti.
                  </div>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--liora-uva)', opacity: 0.65, margin: '8px 0 0', lineHeight: 1.45 }}>
                    8 preguntas y nuestra IA elige exactamente los productos que tu cuerpo necesita — puede diferir de este kit base.
                  </p>
                </div>

                {/* Body */}
                <div style={{ padding: '24px 28px 28px' }}>
                  <Link href="/cuestionario" style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    background: 'var(--liora-uva)', color: 'var(--liora-crema)',
                    borderRadius: 999, padding: '16px 24px',
                    fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 16,
                    textDecoration: 'none', width: '100%', boxSizing: 'border-box',
                  }}>
                    Hacer cuestionario gratis
                    <ArrowRight size={16} weight="bold" />
                  </Link>

                  <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--liora-arena)' }}>
                    <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13, color: 'var(--liora-uva)', marginBottom: 12, opacity: 0.7 }}>
                      O compra este kit base
                    </div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, color: 'var(--liora-uva)', marginBottom: 8 }}>
                      S/{(totalCents / 100).toFixed(0)}
                    </div>
                    <StockUrgency productId={kit.id} threshold={8} />
                    <a href="/cuestionario" style={{
                      display: 'block', marginTop: 14,
                      background: 'transparent',
                      border: '1.5px solid var(--liora-uva)', color: 'var(--liora-uva)',
                      borderRadius: 999, padding: '12px 24px',
                      fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14,
                      textDecoration: 'none', textAlign: 'center',
                    }}>
                      Agregar kit tal cual
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
