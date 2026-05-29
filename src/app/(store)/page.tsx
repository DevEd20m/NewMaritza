import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/products/ProductCard'
import type { Metadata } from 'next'
import { buildBaseMetadata } from '@/lib/seo/metadata'
import type { Category } from '@/types/database'
import { ArrowRight, Star, Play, Heart } from '@phosphor-icons/react/dist/ssr'
import { CategoryGrid } from '@/components/ui/CategoryGrid'
import { HomeBanners } from '@/components/home/HomeBanners'

export const metadata: Metadata = buildBaseMetadata()

interface FeaturedProduct {
  id: string; name: string; slug: string; cover_image_url: string | null; category_id: string | null
  product_variants: Array<{ id: string; name: string; product_prices: Array<{ amount_cents: number; compare_at_cents: number | null; currency: string; effective_to: string | null }> }>
}

async function getFeaturedProducts() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select(`id, name, slug, cover_image_url, category_id, product_variants (id, name, product_prices ( amount_cents, compare_at_cents, currency, effective_to ))`)
    .eq('is_active', true)
    .limit(4)
  return (data as FeaturedProduct[]) ?? []
}

async function getCategories() {
  const supabase = await createClient()
  const { data } = await supabase.from('categories').select('*').order('sort_order')
  return (data as Category[]) ?? []
}

const CATEGORY_COLORS: Record<string, string> = {
  gym: 'var(--cat-durazno)',
  'skin-care': 'var(--cat-coral)',
  vitaminas: 'var(--cat-mostaza)',
  organicos: 'var(--cat-menta)',
}

const STEPS = [
  { n: '01', title: 'Responde 8 preguntas', desc: 'Sobre tu día, tu cuerpo, tu rutina. Cero juicios.' },
  { n: '02', title: 'Recibe tu diagnóstico', desc: 'Te mostramos qué le falta a tu rutina — con data, sin tecnicismos.' },
  { n: '03', title: 'Arma tu kit', desc: 'Productos combinados, ajustados a tu perfil. Cambia lo que no te guste.' },
]

const REVIEWS = [
  { name: 'Camila R.', city: 'Lima', stars: 5, text: 'El cuestionario me cambió la rutina. Pasé de tomar 4 vitaminas random a un kit que sí me hace sentido.', bg: 'var(--cat-coral)' },
  { name: 'Diego M.', city: 'Arequipa', stars: 5, text: 'El bot del carrito me ahorró 80 soles. Cambió mi proteína por una con menos azúcar — yo no sabía.', bg: 'var(--cat-menta)' },
  { name: 'Valeria P.', city: 'Trujillo', stars: 4, text: 'Me llegó en 36h. El kit de skin care para piel mixta es lo mejor que he probado este año.', bg: 'var(--cat-lavanda)' },
]

const TIKTOK_CLIPS = [
  { tag: 'Mi kit LIORA', handle: '@valep_', views: '124K', bg: 'var(--cat-rosa)', label: 'Unboxing\nVit. C' },
  { tag: 'Rutina noche', handle: '@diegolife', views: '88K', bg: 'var(--cat-cielo)', label: 'Sérum + crema' },
  { tag: 'Antes & después', handle: '@cami.r', views: '210K', bg: 'var(--cat-mostaza)', label: '30 días' },
  { tag: 'Mi quiz', handle: '@josss', views: '47K', bg: 'var(--cat-menta)', label: 'Resultados' },
]

async function getHomeUserData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { isLoggedIn: false }

  const { data: profile } = await supabase.from('profiles').select('first_name').eq('id', user.id).single()
  const profileData = profile as { first_name: string | null } | null

  const { data: recentOrder } = await (supabase as any)
    .from('orders')
    .select('order_number')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const { data: rec } = await (supabase as any)
    .from('recommendations')
    .select('quiz_profiles(id, quiz_question_answers(quiz_question_options(quiz_questions(categories(name)))))')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return {
    isLoggedIn: true,
    userName: profileData?.first_name ?? undefined,
    orderNumber: (recentOrder as { order_number: string } | null)?.order_number ?? null,
    kitTitle: null as string | null,
  }
}

export default async function HomePage() {
  const [products, categories, userData] = await Promise.all([getFeaturedProducts(), getCategories(), getHomeUserData()])

  return (
    <div>
      <HomeBanners
        isLoggedIn={userData.isLoggedIn}
        userName={userData.isLoggedIn ? userData.userName : undefined}
        orderNumber={userData.isLoggedIn ? userData.orderNumber : null}
        kitTitle={userData.isLoggedIn ? userData.kitTitle : null}
      />

      {/* Hero */}
      <section style={{ background: 'var(--liora-crema)', padding: '64px 48px 96px', position: 'relative' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 48, alignItems: 'center', maxWidth: 1280, margin: '0 auto' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13, color: 'var(--liora-uva)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 20, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 24, height: 1.5, background: 'var(--liora-uva)', display: 'block' }} />
              Bienestar personalizado · 8 preguntas
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 88, lineHeight: 0.98, letterSpacing: '-0.025em', color: 'var(--liora-uva)', margin: 0, fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1" }}>
              Hecho<br />
              <span style={{ fontFamily: 'var(--font-script)', fontWeight: 600, fontSize: 92, color: 'var(--liora-uva)' }}>para </span>
              ti.
            </h1>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 18, lineHeight: 1.5, color: 'var(--liora-uva)', marginTop: 24, maxWidth: 460 }}>
              Tu cuerpo no es como el de nadie. Tu kit, tampoco. Responde 8 preguntas y armamos tu rutina de bienestar — orgánicos, vitaminas, skin care y gym.
            </p>
            <div style={{ display: 'flex', gap: 14, marginTop: 36 }}>
              <Link href="/cuestionario" style={{ background: 'var(--liora-uva)', color: 'var(--liora-crema)', border: 'none', borderRadius: 999, padding: '16px 32px', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 16, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                Empezar mi cuestionario <ArrowRight size={18} weight="bold" />
              </Link>
              <Link href="/tienda" style={{ background: 'transparent', color: 'var(--liora-uva)', border: '1.5px solid var(--liora-uva)', borderRadius: 999, padding: '16px 28px', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 16 }}>
                Ver tienda
              </Link>
            </div>
          </div>

          {/* Hero product stack */}
          <div style={{ position: 'relative', height: 520 }}>
            <div style={{ position: 'absolute', top: 20, left: 0, width: 260, height: 320, background: 'var(--cat-durazno)', borderRadius: 28, transform: 'rotate(-6deg)', boxShadow: 'var(--shadow-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ background: 'var(--liora-crema)', padding: '16px 20px', borderRadius: 12, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--liora-uva)', textAlign: 'center' }}>
                <div style={{ fontSize: 22, lineHeight: 1 }}>Whey</div>
                <div style={{ fontSize: 12, fontFamily: 'var(--font-body)', fontWeight: 500, marginTop: 6, opacity: 0.7 }}>Proteína</div>
              </div>
            </div>
            <div style={{ position: 'absolute', top: 60, right: 60, width: 240, height: 300, background: 'var(--cat-lavanda)', borderRadius: 28, transform: 'rotate(8deg)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-2)' }}>
              <div style={{ background: 'var(--liora-crema)', padding: '16px 20px', borderRadius: 12, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--liora-uva)', textAlign: 'center' }}>
                <div style={{ fontSize: 22, lineHeight: 1 }}>Sérum</div>
                <div style={{ fontSize: 12, fontFamily: 'var(--font-body)', fontWeight: 500, marginTop: 6, opacity: 0.7 }}>Vit. C</div>
              </div>
            </div>
            <div style={{ position: 'absolute', bottom: 30, left: 80, width: 260, height: 280, background: 'var(--cat-menta)', borderRadius: 28, transform: 'rotate(-2deg)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-2)' }}>
              <div style={{ background: 'var(--liora-crema)', padding: '16px 20px', borderRadius: 12, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--liora-uva)', textAlign: 'center' }}>
                <div style={{ fontSize: 22, lineHeight: 1 }}>Granola</div>
                <div style={{ fontSize: 12, fontFamily: 'var(--font-body)', fontWeight: 500, marginTop: 6, opacity: 0.7 }}>Orgánica</div>
              </div>
            </div>
            <div style={{ position: 'absolute', bottom: 80, right: 0, width: 96, height: 96, background: 'var(--liora-lima)', borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'rotate(-12deg)', fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--liora-uva)', fontSize: 13, textAlign: 'center', lineHeight: 1.1, letterSpacing: '0.04em' }}>
              ¡TU<br />KIT!
            </div>
          </div>
        </div>
      </section>

      {/* Category grid */}
      <section style={{ background: 'var(--liora-crema)', padding: '32px 48px 64px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>Nuestras categorías</div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 56, color: 'var(--liora-uva)', margin: 0, lineHeight: 1, fontVariationSettings: "'opsz' 144,'SOFT' 60,'WONK' 0" }}>¿Por dónde empezamos?</h2>
            </div>
            <Link href="/tienda" style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 15, color: 'var(--liora-uva)', display: 'inline-flex', alignItems: 'center', gap: 6, borderBottom: '1.5px solid var(--liora-uva)', paddingBottom: 2 }}>
              Ver todas <ArrowRight size={14} weight="bold" />
            </Link>
          </div>
          <CategoryGrid />
        </div>
      </section>

      {/* Featured products */}
      <section style={{ background: 'var(--liora-crema)', padding: '64px 48px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>Más pedidos esta semana</div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 56, color: 'var(--liora-uva)', margin: 0, lineHeight: 1, fontVariationSettings: "'opsz' 144,'SOFT' 60,'WONK' 0" }}>Lo que el público ama</h2>
            </div>
            <Link href="/tienda" style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 15, color: 'var(--liora-uva)', display: 'inline-flex', alignItems: 'center', gap: 6, borderBottom: '1.5px solid var(--liora-uva)', paddingBottom: 2 }}>
              Ver todo <ArrowRight size={14} weight="bold" />
            </Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
            {products.map((p) => {
              const variant = p.product_variants?.[0]
              const price = variant?.product_prices?.find((pp) => !pp.effective_to)
              if (!variant || !price) return null
              const catColor = CATEGORY_COLORS[p.category_id ?? ''] ?? 'var(--cat-lavanda)'
              return (
                <ProductCard
                  key={p.id}
                  variantId={variant.id}
                  productId={p.id}
                  slug={p.slug}
                  name={p.name}
                  subname={variant.name}
                  priceCents={price.amount_cents}
                  compareAtCents={price.compare_at_cents ?? undefined}
                  categoryColor={catColor}
                  imageUrl={p.cover_image_url ?? undefined}
                />
              )
            })}
          </div>
        </div>
      </section>

      {/* Personalize section */}
      <section style={{ background: 'var(--liora-uva)', padding: '96px 48px', borderRadius: '32px 32px 0 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 64, alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 12, color: 'var(--liora-lima)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 16 }}>
              Cómo funciona
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 64, lineHeight: 0.98, letterSpacing: '-0.025em', color: 'var(--liora-crema)', margin: 0, fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1" }}>
              Personaliza en{' '}
              <span style={{ fontFamily: 'var(--font-script)', color: 'var(--liora-lima)' }}>tres</span>{' '}
              pasos.
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 18, lineHeight: 1.5, color: 'var(--liora-crema)', opacity: 0.85, marginTop: 24, maxWidth: 420 }}>
              8 preguntas. 3 minutos. Un kit hecho para tu cuerpo, no para el promedio.
            </p>
            <Link href="/cuestionario" style={{ background: 'var(--liora-lima)', color: 'var(--liora-uva)', border: 'none', borderRadius: 999, padding: '16px 32px', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 16, marginTop: 32, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              Empezar mi cuestionario <ArrowRight size={18} weight="bold" />
            </Link>
            <div style={{ marginTop: 16, fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--liora-crema)', opacity: 0.55 }}>Gratis · Sin registro · 3 minutos</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {STEPS.map((s) => (
              <div key={s.n} style={{ background: 'rgba(251,241,226,0.08)', border: '1.5px solid rgba(251,241,226,0.2)', borderRadius: 24, padding: '24px 28px', display: 'flex', gap: 24, alignItems: 'center' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 48, color: 'var(--liora-lima)', lineHeight: 1, fontVariationSettings: "'opsz' 144,'SOFT' 60,'WONK' 0", flexShrink: 0 }}>{s.n}</div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, color: 'var(--liora-crema)', lineHeight: 1.1 }}>{s.title}</div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--liora-crema)', opacity: 0.75, marginTop: 4 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews + TikTok */}
      <section style={{ background: 'var(--liora-crema)', padding: '64px 48px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>Comunidad LIORA</div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 56, color: 'var(--liora-uva)', margin: 0, lineHeight: 1, fontVariationSettings: "'opsz' 144,'SOFT' 60,'WONK' 0" }}>Lo que dice el público</h2>
            </div>
            <a href="#" style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 15, color: 'var(--liora-uva)', display: 'inline-flex', alignItems: 'center', gap: 6, borderBottom: '1.5px solid var(--liora-uva)', paddingBottom: 2 }}>
              Ver todas <ArrowRight size={14} weight="bold" />
            </a>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 48 }}>
            {REVIEWS.map((r) => (
              <article key={r.name} style={{ background: r.bg, borderRadius: 28, padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', gap: 2, color: 'var(--liora-uva)', fontSize: 16 }}>
                  {Array.from({ length: r.stars }).map((_, i) => <Star key={i} size={16} weight="fill" />)}
                  {Array.from({ length: 5 - r.stars }).map((_, i) => <Star key={`e${i}`} size={16} weight="regular" style={{ opacity: 0.4 }} />)}
                </div>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, lineHeight: 1.2, color: 'var(--liora-uva)', margin: 0 }}>"{r.text}"</p>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--liora-uva)', opacity: 0.75, marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 999, background: 'rgba(61,26,58,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13 }}>{r.name.charAt(0)}</div>
                  <span><strong style={{ fontWeight: 700 }}>{r.name}</strong> · {r.city}</span>
                </div>
              </article>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 12, color: 'var(--liora-uva)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>#LIORA en TikTok</div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 36, lineHeight: 1, letterSpacing: '-0.02em', color: 'var(--liora-uva)', margin: 0, fontVariationSettings: "'opsz' 144,'SOFT' 60,'WONK' 0" }}>El público en vivo</h3>
            </div>
            <a href="#" style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, color: 'var(--liora-uva)', display: 'inline-flex', alignItems: 'center', gap: 6, borderBottom: '1.5px solid var(--liora-uva)', paddingBottom: 2 }}>
              Síguenos <ArrowRight size={14} weight="bold" />
            </a>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {TIKTOK_CLIPS.map((c, i) => (
              <article key={i} style={{ position: 'relative', aspectRatio: '9/16', background: c.bg, borderRadius: 24, overflow: 'hidden', cursor: 'pointer' }}>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
                  <div style={{ width: 64, height: 64, borderRadius: 999, background: 'rgba(251,241,226,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--liora-uva)', boxShadow: 'var(--shadow-2)' }}>
                    <Play size={28} weight="fill" style={{ marginLeft: 4 }} />
                  </div>
                  <div style={{ background: 'rgba(251,241,226,0.92)', padding: '8px 14px', borderRadius: 12, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--liora-uva)', textAlign: 'center', lineHeight: 1.05, fontSize: 15, whiteSpace: 'pre-line' }}>{c.label}</div>
                </div>
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 120, background: 'linear-gradient(to top, rgba(61,26,58,0.65), transparent)' }} />
                <div style={{ position: 'absolute', bottom: 16, left: 16, right: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13, color: 'var(--liora-crema)' }}>#{c.tag.replace(/\s+/g, '')}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--liora-crema)', opacity: 0.85 }}>
                    <span>{c.handle}</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Heart size={12} weight="fill" /> {c.views}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial band */}
      <section style={{ background: 'var(--liora-lima)', padding: '96px 48px', textAlign: 'center' }}>
        <div style={{ maxWidth: 880, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 20, color: 'var(--liora-uva)', fontSize: 22 }}>
            {[1, 2, 3, 4, 5].map((i) => <Star key={i} size={22} weight="fill" />)}
          </div>
          <blockquote style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 48, lineHeight: 1.12, letterSpacing: '-0.015em', color: 'var(--liora-uva)', margin: 0, fontVariationSettings: "'opsz' 144,'SOFT' 60,'WONK' 0" }}>
            "Pedí mi kit personalizado después del quiz. Llegó en 2 días, todo hecho para mi rutina. Lloré de emoción."
          </blockquote>
          <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 15, color: 'var(--liora-uva)', marginTop: 28 }}>
            — Camila R., Lima
          </div>
        </div>
      </section>
    </div>
  )
}
