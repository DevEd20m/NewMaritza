import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Sparkle, Package } from '@phosphor-icons/react/dist/ssr'

const KIT_COLORS: Record<string, string> = {
  piel:      'var(--cat-coral)',
  solar:     'var(--cat-mostaza)',
  calma:     'var(--cat-lavanda)',
  descanso:  'var(--cat-lavanda)',
  bienestar: 'var(--cat-lavanda)',
  gym:       'var(--cat-durazno)',
  dolor:     'var(--cat-durazno)',
  viaje:     'var(--cat-cielo)',
  playa:     'var(--cat-cielo)',
  digestivo: 'var(--cat-menta)',
  hogar:     'var(--cat-rosa)',
  auxilios:  'var(--cat-rosa)',
  botiquin:  'var(--cat-rosa)',
  pies:      'var(--cat-mostaza)',
  cuerpo:    'var(--cat-durazno)',
  pantallas: 'var(--cat-lavanda)',
}

function inferColor(slug: string) {
  for (const [key, color] of Object.entries(KIT_COLORS)) {
    if (slug.includes(key)) return color
  }
  return 'var(--cat-lavanda)'
}

interface FeaturedKit {
  id: string
  name: string
  slug: string
  description: string | null
  cover_image_url: string | null
  totalCents: number
  productCount: number
}

async function getFeaturedKits(): Promise<{ kits: FeaturedKit[]; totalActive: number }> {
  const admin = createAdminClient()

  const [{ data: kits }, { count }] = await Promise.all([
    (admin as any)
      .from('kits')
      .select(`
        id, name, slug, description, cover_image_url,
        kit_products(
          product_variants(
            product_prices(amount_cents, effective_to)
          )
        )
      `)
      .eq('show_in_home', true)
      .eq('is_active', true)
      .order('home_sort_order')
      .limit(6),
    (admin as any)
      .from('kits')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true),
  ])

  if (!kits?.length) return { kits: [], totalActive: count ?? 0 }

  const featuredKits = (kits as any[]).map((k: any) => {
    const products = (k.kit_products ?? []) as any[]
    const totalCents = products.reduce((sum: number, kp: any) => {
      const price = (kp.product_variants?.product_prices ?? []).find((p: any) => !p.effective_to)
      return sum + (price?.amount_cents ?? 0)
    }, 0)
    return {
      id: k.id,
      name: k.name,
      slug: k.slug,
      description: k.description,
      cover_image_url: k.cover_image_url,
      totalCents,
      productCount: products.length,
    }
  })

  return { kits: featuredKits, totalActive: count ?? featuredKits.length }
}

export async function FeaturedKits() {
  const { kits, totalActive } = await getFeaturedKits()
  if (!kits.length) return null

  return (
    <section className="liora-kits-section" style={{ background: 'var(--liora-crema)', padding: '0 48px 80px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12, color: 'var(--liora-uva)', opacity: 0.6 }}>
              Soluciones personalizadas
            </div>
            <h2 className="liora-section-title" style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 52, color: 'var(--liora-uva)', margin: 0, lineHeight: 1, fontVariationSettings: "'opsz' 144,'SOFT' 60,'WONK' 0" }}>
              Los kits más pedidos
            </h2>
          </div>
          <Link href="/tienda" style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 15, color: 'var(--liora-uva)', display: 'inline-flex', alignItems: 'center', gap: 6, borderBottom: '1.5px solid var(--liora-uva)', paddingBottom: 2, textDecoration: 'none' }}>
            Ver todos <ArrowRight size={14} weight="bold" />
          </Link>
        </div>

        {/* Kit grid */}
        <div className="liora-kits-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {kits.map(kit => {
            const color = inferColor(kit.slug)
            const tint = `color-mix(in srgb, ${color} 30%, white)`
            return (
              <article key={kit.id} style={{
                background: 'var(--liora-blanco)',
                borderRadius: 28,
                padding: 10,
                display: 'flex',
                flexDirection: 'column',
                height: 400,
                position: 'relative',
                boxShadow: 'var(--shadow-1)',
              }}>

                {/* Image area — tinted blob */}
                <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: tint, borderRadius: 20 }}>
                  {kit.cover_image_url ? (
                    <Image
                      src={kit.cover_image_url}
                      alt={kit.name}
                      fill
                      sizes="320px"
                      style={{ objectFit: 'cover', objectPosition: 'center center' }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 56, opacity: 0.25 }}>
                      🌿
                    </div>
                  )}

                  {/* Product count badge */}
                  <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)', borderRadius: 999, padding: '5px 12px', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, color: 'var(--liora-uva)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <Package size={13} weight="bold" />
                    {kit.productCount} productos
                  </div>
                </div>

                {/* Content on white */}
                <div style={{ padding: '16px 12px 10px' }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 19, color: 'var(--liora-uva)', margin: '0 0 6px', lineHeight: 1.1, fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1" }}>
                    {kit.name}
                  </h3>
                  {kit.description && (
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--liora-uva)', opacity: 0.7, margin: '0 0 12px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {kit.description}
                    </p>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 21, color: 'var(--liora-uva)' }}>
                      {kit.totalCents > 0 ? `S/${Math.round(kit.totalCents / 100)}` : '—'}
                    </div>
                    <Link
                      href={`/tienda/kit/${kit.slug}`}
                      style={{ background: 'var(--liora-uva)', color: 'var(--liora-crema)', borderRadius: 999, padding: '9px 16px', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}
                    >
                      Ver kit <ArrowRight size={13} weight="bold" />
                    </Link>
                  </div>
                </div>
              </article>
            )
          })}
        </div>

        {/* Quiz CTA */}
        <div style={{ marginTop: 28, background: 'var(--liora-uva)', borderRadius: 20, padding: '20px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 12, color: 'var(--liora-lima)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
              ¿No sabes cuál es el tuyo?
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: 'var(--liora-crema)', lineHeight: 1.1 }}>
              Tenemos {totalActive} kits especializados. Responde unas preguntas y te mostramos el tuyo.
            </div>
          </div>
          <Link href="/cuestionario" style={{ background: 'var(--liora-lima)', color: 'var(--liora-uva)', borderRadius: 999, padding: '13px 26px', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap', flexShrink: 0 }}>
            <Sparkle size={16} weight="bold" /> Hacer el cuestionario
          </Link>
        </div>

      </div>
    </section>
  )
}
