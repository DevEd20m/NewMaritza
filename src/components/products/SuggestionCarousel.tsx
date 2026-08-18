import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Package } from '@phosphor-icons/react/dist/ssr'
import type { RelatedKit } from '@/lib/recommendation/related'

// Carrusel horizontal de cross-sell (CSS puro: overflow-x + scroll-snap).
// Server-compatible: recibe las cards como children.

interface CarouselProps {
  eyebrow: string
  title: string
  linkHref?: string
  linkLabel?: string
  children: React.ReactNode
}

export function SuggestionCarousel({ eyebrow, title, linkHref, linkLabel, children }: CarouselProps) {
  return (
    <section style={{ maxWidth: 1280, margin: '0 auto', padding: '0 48px 72px' }} className="liora-cart-outer">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20, gap: 16 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8, color: 'var(--liora-uva)', opacity: 0.6 }}>
            {eyebrow}
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 30, color: 'var(--liora-uva)', margin: 0, lineHeight: 1.05, fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1" }}>
            {title}
          </h2>
        </div>
        {linkHref && (
          <Link href={linkHref} style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, color: 'var(--liora-uva)', display: 'inline-flex', alignItems: 'center', gap: 6, borderBottom: '1.5px solid var(--liora-uva)', paddingBottom: 2, textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
            {linkLabel ?? 'Ver más'} <ArrowRight size={13} weight="bold" />
          </Link>
        )}
      </div>
      <div
        style={{
          display: 'flex',
          gap: 16,
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          paddingBottom: 12,
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {children}
      </div>
    </section>
  )
}

// Envoltorio de ancho fijo para cada card dentro del carrusel
export function CarouselItem({ width = 260, children }: { width?: number; children: React.ReactNode }) {
  return (
    <div style={{ flex: `0 0 ${width}px`, width, scrollSnapAlign: 'start', display: 'flex' }}>
      {children}
    </div>
  )
}

// Card compacta de kit para carruseles (mismo lenguaje visual que FeaturedKits)
const KIT_COLORS: Record<string, string> = {
  piel: 'var(--cat-coral)', solar: 'var(--cat-mostaza)', calma: 'var(--cat-lavanda)',
  descanso: 'var(--cat-lavanda)', bienestar: 'var(--cat-lavanda)', sueno: 'var(--cat-lavanda)',
  gym: 'var(--cat-durazno)', dolor: 'var(--cat-durazno)', viaje: 'var(--cat-cielo)',
  playa: 'var(--cat-cielo)', digestivo: 'var(--cat-menta)', acidez: 'var(--cat-menta)',
  hogar: 'var(--cat-rosa)', auxilios: 'var(--cat-rosa)', botiquin: 'var(--cat-rosa)',
  pies: 'var(--cat-mostaza)', cuerpo: 'var(--cat-durazno)', pantallas: 'var(--cat-lavanda)',
}

function kitColor(slug: string) {
  for (const [key, color] of Object.entries(KIT_COLORS)) {
    if (slug.includes(key)) return color
  }
  return 'var(--cat-lavanda)'
}

// Banner "este producto es parte de una rutina": ancho completo, encima del
// carrusel de productos similares en la página de producto.
export function KitBanner({ kit }: { kit: RelatedKit }) {
  const color = kitColor(kit.slug)
  const tint = `color-mix(in srgb, ${color} 30%, white)`
  return (
    <section className="liora-cart-outer" style={{ maxWidth: 1280, margin: '0 auto', padding: '0 48px 28px' }}>
      <Link href={`/tienda/kit/${kit.slug}`} style={{ textDecoration: 'none' }}>
        <article style={{
          background: tint, borderRadius: 24, padding: '18px 24px',
          display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap',
          boxShadow: 'var(--shadow-1)', cursor: 'pointer',
        }}>
          <div style={{ width: 72, height: 72, borderRadius: 16, background: 'rgba(255,255,255,0.6)', overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
            {kit.coverImageUrl ? (
              <Image src={kit.coverImageUrl} alt={kit.name} fill sizes="72px" style={{ objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, opacity: 0.35 }}>🌿</div>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, color: 'var(--liora-uva)', textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.65, marginBottom: 4, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Package size={13} weight="bold" /> Este producto es parte de una rutina
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: 'var(--liora-uva)', lineHeight: 1.1, fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1" }}>
              {kit.name}
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--liora-uva)', opacity: 0.7, marginTop: 2 }}>
              {kit.productCount} productos seleccionados para usarse juntos
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 10, color: 'var(--liora-uva)', opacity: 0.55, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Rutina completa</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, color: 'var(--liora-uva)', lineHeight: 1 }}>S/{Math.round(kit.totalCents / 100)}</div>
            </div>
            <span style={{ background: 'var(--liora-uva)', color: 'var(--liora-crema)', borderRadius: 999, padding: '12px 22px', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
              Ver rutina completa <ArrowRight size={14} weight="bold" />
            </span>
          </div>
        </article>
      </Link>
    </section>
  )
}

export function KitMiniCard({ kit }: { kit: RelatedKit }) {
  const tint = `color-mix(in srgb, ${kitColor(kit.slug)} 30%, white)`
  return (
    <Link href={`/tienda/kit/${kit.slug}`} style={{ textDecoration: 'none', display: 'flex', flex: 1 }}>
      <article style={{
        background: 'var(--liora-blanco)', borderRadius: 24, padding: 10,
        display: 'flex', flexDirection: 'column', flex: 1, height: 330,
        boxShadow: 'var(--shadow-1)', cursor: 'pointer',
      }}>
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: tint, borderRadius: 16 }}>
          {kit.coverImageUrl ? (
            <Image src={kit.coverImageUrl} alt={kit.name} fill sizes="260px" style={{ objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44, opacity: 0.25 }}>🌿</div>
          )}
          <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)', borderRadius: 999, padding: '4px 10px', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 10, color: 'var(--liora-uva)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Package size={12} weight="bold" />
            {kit.productCount} productos
          </div>
        </div>
        <div style={{ padding: '12px 10px 8px' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17, color: 'var(--liora-uva)', margin: '0 0 8px', lineHeight: 1.1, fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1", display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {kit.name}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 19, color: 'var(--liora-uva)' }}>
              S/{Math.round(kit.totalCents / 100)}
            </div>
            <span style={{ background: 'var(--liora-uva)', color: 'var(--liora-crema)', borderRadius: 999, padding: '8px 14px', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
              Ver kit <ArrowRight size={12} weight="bold" />
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}
