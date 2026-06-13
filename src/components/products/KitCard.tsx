'use client'
import Link from 'next/link'
import { useState } from 'react'
import { Package, ShieldCheck } from '@phosphor-icons/react'
import type { KitWithProducts } from '@/types/database'
import { getBenefitIcon, type KitBenefit } from '@/lib/kit-benefits'

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
  default:   'var(--cat-lavanda)',
}

const DEEP_ACCENTS: Record<string, string> = {
  'var(--cat-coral)': 'var(--cat-coral-deep)',
  'var(--cat-durazno)': 'var(--cat-durazno-deep)',
  'var(--cat-mostaza)': 'var(--cat-mostaza-deep)',
  'var(--cat-menta)': 'var(--cat-menta-deep)',
  'var(--cat-cielo)': 'var(--cat-cielo-deep)',
  'var(--cat-lavanda)': 'var(--cat-lavanda-deep)',
  'var(--cat-rosa)': 'var(--cat-rosa-deep)',
}

function getKitColor(slug: string) {
  for (const [key, color] of Object.entries(KIT_COLORS)) {
    if (slug.includes(key)) return color
  }
  return KIT_COLORS.default
}

interface KitCardProps {
  kit: KitWithProducts
}

export function KitCard({ kit }: KitCardProps) {
  const [hovered, setHovered] = useState(false)
  const color = getKitColor(kit.slug)
  const accent = DEEP_ACCENTS[color] ?? 'var(--cat-lavanda-deep)'
  const tint = `color-mix(in srgb, ${color} 30%, white)`

  const totalCents = kit.kit_products.reduce((s, kp) => {
    const price = kp.variant?.prices?.[0]
    return s + (price?.amount_cents ?? 0) * kp.quantity
  }, 0)

  const benefits = (((kit as unknown as { benefits?: KitBenefit[] }).benefits) ?? []).slice(0, 3)

  const coverUrl = kit.cover_image_url
    ?? kit.kit_products.map(kp => kp.variant?.product?.cover_image_url).find(Boolean)
    ?? null

  // Título dos tonos: última palabra en acento, en su propia línea
  const words = kit.name.trim().split(/\s+/)
  const lead = words.slice(0, -1).join(' ')
  const last = words[words.length - 1]

  return (
    <Link href={`/tienda/kit/${kit.slug}`} style={{ textDecoration: 'none' }}>
      <article
        className="liora-kit-card"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: 'var(--liora-blanco)',
          borderRadius: 32,
          cursor: 'pointer',
          padding: 28,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          boxShadow: hovered ? 'var(--shadow-2)' : 'var(--shadow-1)',
          transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
          transition: 'transform 220ms var(--ease), box-shadow 220ms var(--ease)',
        }}
      >
        {/* Badge */}
        <div style={{ marginBottom: 20 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: tint, borderRadius: 999, padding: '8px 16px',
            fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 12,
            color: 'var(--liora-uva)', textTransform: 'uppercase', letterSpacing: '0.1em',
          }}>
            <Package size={16} weight="bold" style={{ color: accent }} />
            {kit.kit_products.length} productos
          </span>
        </div>

        {/* Imagen | contenido */}
        <div className="liora-kit-card-grid" style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', gap: 28, alignItems: 'start', flex: 1 }}>
          <div style={{
            background: tint, borderRadius: 24, position: 'relative',
            minHeight: 260, height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
          }}>
            {coverUrl ? (
              <img src={coverUrl} alt={kit.name} style={{ width: '82%', height: '82%', objectFit: 'contain' }} />
            ) : (
              <span style={{ fontSize: 48, opacity: 0.3 }}>🌿</span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
            <div>
              <h3 className="liora-kit-card-title" style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, color: 'var(--liora-uva)', margin: 0, lineHeight: 1.05, fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1" }}>
                {lead && <span style={{ display: 'block' }}>{lead}</span>}
                <span style={{ color: accent }}>{last}</span>
              </h3>
              <div style={{ width: 32, height: 3, borderRadius: 2, background: accent, marginTop: 12 }} />
            </div>

            {kit.description && (
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.5, color: 'var(--liora-uva)', opacity: 0.75, margin: 0 }}>
                {kit.description}
              </p>
            )}

            {benefits.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {benefits.map((b, i) => {
                  const BenefitIcon = getBenefitIcon(b.icon)
                  return (
                    <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 999, background: tint, flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <BenefitIcon size={20} weight="bold" style={{ color: 'var(--liora-uva)' }} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15, color: 'var(--liora-uva)', lineHeight: 1.2 }}>
                          {b.title}
                        </div>
                        {b.desc && (
                          <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--liora-uva)', opacity: 0.65, lineHeight: 1.4, marginTop: 2 }}>
                            {b.desc}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer: precio + CTA */}
        <div className="liora-kit-card-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, borderTop: '1px solid rgba(61,26,58,0.1)', marginTop: 24, paddingTop: 20 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, color: 'var(--liora-uva)', opacity: 0.55, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
              Precio del kit
            </div>
            <div className="liora-kit-card-price" style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, color: 'var(--liora-uva)', lineHeight: 1 }}>
              <span style={{ fontSize: 18, fontWeight: 700, marginRight: 2 }}>S/</span>{(totalCents / 100).toFixed(0)}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <span style={{
              background: 'var(--liora-uva)', color: 'var(--liora-crema)',
              borderRadius: 999, padding: '13px 32px',
              fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15,
              transition: 'opacity 150ms',
              opacity: hovered ? 1 : 0.92,
              display: 'inline-flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
            }}>
              Ver kit →
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--liora-uva)', opacity: 0.6 }}>
              <ShieldCheck size={14} weight="bold" /> Pago 100% seguro
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}
