import { createClient } from '@/lib/supabase/server'
import { KitCard } from '@/components/products/KitCard'
import { ShopProductsSection, type ShopProduct } from '@/components/products/ShopProductsSection'
import Link from 'next/link'
import type { Metadata } from 'next'
import type { KitWithProducts } from '@/types/database'
import { ArrowRight, Sparkle } from '@phosphor-icons/react/dist/ssr'

export const metadata: Metadata = {
  title: 'Tienda — Kits y productos',
  description: 'Arma tu kit personalizado con IA o elige productos sueltos. Suplementos, skin care, vitaminas y más.',
}

async function getProducts(): Promise<ShopProduct[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select(`
      id, name, slug, cover_image_url, category_id,
      categories ( slug ),
      product_variants (
        id, name,
        product_prices ( amount_cents, compare_at_cents, currency, effective_to )
      )
    `)
    .eq('is_active', true)
    .order('name')
  return (data as ShopProduct[]) ?? []
}

async function getKits(): Promise<KitWithProducts[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('kits')
    .select(`
      *,
      kit_products (
        kit_id, variant_id, quantity, sort_order, is_required,
        variant:product_variants (
          id, name, sku,
          product:products ( id, name, slug, cover_image_url ),
          prices:product_prices ( amount_cents, compare_at_cents, currency, effective_to )
        )
      )
    `)
    .eq('is_active', true)
  return (data as KitWithProducts[]) ?? []
}

const STEPS = [
  { n: '01', title: '8 preguntas sobre ti', sub: 'Cuerpo, objetivos, alergias, presupuesto' },
  { n: '02', title: 'IA analiza tu perfil', sub: 'GPT-4 elige de nuestro catálogo para ti' },
  { n: '03', title: 'Tu kit personalizado', sub: '4–5 productos + diagnóstico incluido' },
]

interface Props { searchParams: Promise<{ categoria?: string }> }

export default async function ShopPage({ searchParams }: Props) {
  const { categoria } = await searchParams
  const [products, kits] = await Promise.all([getProducts(), getKits()])

  return (
    <div style={{ background: 'var(--liora-crema)' }}>

      {/* ── HERO: Quiz CTA ─────────────────────────────────────────────── */}
      <section className="liora-shop-hero-section" style={{ background: 'var(--liora-uva)', padding: '72px 48px 80px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div className="liora-shop-hero-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 56, alignItems: 'center' }}>

          {/* Texto */}
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(255,255,255,0.1)', borderRadius: 999,
              padding: '6px 14px', marginBottom: 28,
            }}>
              <Sparkle size={14} weight="fill" color="var(--liora-lima)" />
              <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, color: 'var(--liora-crema)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                Personalización con IA · Gratis
              </span>
            </div>

            <h1 className="liora-shop-hero-title" style={{
              fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 62,
              lineHeight: 1.0, letterSpacing: '-0.025em', color: 'var(--liora-crema)',
              margin: '0 0 20px',
              fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1",
            }}>
              Tu rutina de bienestar,{' '}
              <span style={{ fontFamily: 'var(--font-script)', fontWeight: 400 }}>exactamente</span>{' '}
              para ti.
            </h1>

            <p style={{
              fontFamily: 'var(--font-body)', fontSize: 18, lineHeight: 1.55,
              color: 'var(--liora-crema)', opacity: 0.72, margin: '0 0 36px', maxWidth: 520,
            }}>
              8 preguntas. 45 segundos. Nuestra IA elige entre {products.length} productos los que tu cuerpo necesita — con diagnóstico incluido.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
              <Link href="/cuestionario" style={{
                background: 'var(--liora-crema)', color: 'var(--liora-uva)',
                borderRadius: 999, padding: '16px 32px',
                fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 16,
                textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10,
              }}>
                Armar mi kit gratis
                <ArrowRight size={16} weight="bold" />
              </Link>
              <a href="#kits-base" style={{
                fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600,
                color: 'var(--liora-crema)', opacity: 0.55, textDecoration: 'none',
                borderBottom: '1px solid rgba(255,255,255,0.3)', paddingBottom: 2,
              }}>
                o elige un kit base ↓
              </a>
            </div>
          </div>

          {/* Pasos */}
          <div className="liora-shop-hero-steps" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {STEPS.map((s) => (
              <div key={s.n} style={{
                background: 'rgba(255,255,255,0.07)', borderRadius: 20,
                padding: '18px 20px', display: 'flex', alignItems: 'flex-start', gap: 16,
                border: '1px solid rgba(255,255,255,0.1)',
              }}>
                <div style={{
                  fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22,
                  color: 'var(--liora-lima)', lineHeight: 1, flexShrink: 0, marginTop: 2,
                }}>
                  {s.n}
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, color: 'var(--liora-crema)', marginBottom: 3 }}>
                    {s.title}
                  </div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--liora-crema)', opacity: 0.55, lineHeight: 1.4 }}>
                    {s.sub}
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
        </div>
      </section>

      <div className="liora-px" style={{ maxWidth: 1280, margin: '0 auto', padding: '64px 48px 96px' }}>

        {/* ── KITS BASE ──────────────────────────────────────────────────── */}
        <section id="kits-base" style={{ marginBottom: 80 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 36 }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--liora-lima)', borderRadius: 999, padding: '5px 14px', marginBottom: 14 }}>
                <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, color: 'var(--liora-uva)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Kits base · Personalízalos en 45 seg
                </span>
              </div>
              <h2 style={{
                fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 44,
                color: 'var(--liora-uva)', margin: 0, lineHeight: 1.0,
                fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1",
              }}>
                Los más populares
              </h2>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--liora-uva)', opacity: 0.65, margin: '8px 0 0', maxWidth: 480 }}>
                Cada kit está pensado para un objetivo. Entra y personalízalo con 3 preguntas rápidas — o cómpralo tal cual.
              </p>
            </div>
            <Link href="/cuestionario" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14,
              color: 'var(--liora-uva)', textDecoration: 'none',
              borderBottom: '1.5px solid var(--liora-uva)', paddingBottom: 2,
            }}>
              ¿Prefieres que la IA elija por ti?
              <ArrowRight size={13} weight="bold" />
            </Link>
          </div>

          <div className="liora-kits-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
            {kits.map((kit) => <KitCard key={kit.id} kit={kit} />)}
          </div>
        </section>

        <ShopProductsSection products={products} initialCategoria={categoria ?? ''} />

      </div>
    </div>
  )
}
