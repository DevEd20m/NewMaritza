'use client'
import { useState } from 'react'
import { Warning, CheckCircle, CaretDown } from '@phosphor-icons/react'

interface SafetyFlag {
  flag: string
  warning: string
}

interface ProductSnapshot {
  name: string
  variant: string
  usage_instructions: string | null
  indications: string | null
  contraindications: string | null
}

interface OrderGuideSnapshot {
  id: string
  order_id: string
  guide_snapshot_json: Record<string, unknown>
  products_snapshot_json: ProductSnapshot[]
  safety_flags_snapshot_json: SafetyFlag[]
  quiz_answers_snapshot_json: Record<string, unknown>
  guide_version: string
  created_at: string
  viewed_at: string | null
  orders: {
    order_number: string
    status: string
    created_at: string
  }
}

function ScheduleSection({ schedule }: { schedule: Array<{ time: string; emoji: string; products: string[]; tip: string }> }) {
  if (!schedule?.length) return null
  return (
    <div style={{ marginBottom: 40 }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, color: 'var(--liora-uva)', marginBottom: 20 }}>
        Tu rutina del día
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {schedule.map((item, i) => (
          <div key={i} style={{ background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-arena)', borderRadius: 20, padding: '18px 24px', display: 'flex', gap: 18, alignItems: 'flex-start' }}>
            <div style={{ fontSize: 28, flexShrink: 0, marginTop: 2 }}>{item.emoji}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 12, color: 'var(--liora-uva)', opacity: 0.55, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
                {item.time}
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--liora-uva)', lineHeight: 1.2 }}>
                {item.products.join(' + ')}
              </div>
              {item.tip && (
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--liora-uva)', opacity: 0.65, marginTop: 6, lineHeight: 1.5 }}>
                  {item.tip}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ProductsSection({ products }: { products: ProductSnapshot[] }) {
  const [open, setOpen] = useState<number | null>(null)
  const withInstructions = products.filter(p => p.usage_instructions || p.indications || p.contraindications)
  if (!withInstructions.length) return null

  return (
    <div style={{ marginBottom: 40 }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, color: 'var(--liora-uva)', marginBottom: 20 }}>
        Cómo usar cada producto
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {withInstructions.map((p, i) => (
          <div key={i} style={{ background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-arena)', borderRadius: 20, overflow: 'hidden' }}>
            <button
              onClick={() => setOpen(open === i ? null : i)}
              style={{ width: '100%', padding: '18px 24px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}
            >
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--liora-uva)' }}>{p.name}</div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--liora-uva)', opacity: 0.6, marginTop: 2 }}>{p.variant}</div>
              </div>
              <CaretDown size={20} style={{ color: 'var(--liora-uva)', transform: open === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
            </button>
            {open === i && (
              <div style={{ padding: '0 24px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {p.usage_instructions && (
                  <div>
                    <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, color: 'var(--liora-uva)', opacity: 0.55, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Cómo usarlo</div>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--liora-uva)', lineHeight: 1.6, margin: 0 }}>{p.usage_instructions}</p>
                  </div>
                )}
                {p.indications && (
                  <div>
                    <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, color: 'var(--liora-uva)', opacity: 0.55, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Para qué sirve</div>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--liora-uva)', lineHeight: 1.6, margin: 0 }}>{p.indications}</p>
                  </div>
                )}
                {p.contraindications && (
                  <div style={{ background: 'var(--cat-coral)', borderRadius: 12, padding: '12px 16px' }}>
                    <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, color: 'var(--liora-uva)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Precauciones</div>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--liora-uva)', lineHeight: 1.6, margin: 0 }}>{p.contraindications}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function SafetySection({ flags }: { flags: SafetyFlag[] }) {
  if (!flags?.length) return null
  return (
    <div style={{ marginBottom: 40 }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, color: 'var(--liora-uva)', marginBottom: 20 }}>
        Consideraciones para ti
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {flags.map((f, i) => (
          <div key={i} style={{ background: 'var(--cat-mostaza)', borderRadius: 16, padding: '16px 20px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <Warning size={22} weight="fill" style={{ color: 'var(--liora-uva)', flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--liora-uva)', lineHeight: 1.55, margin: 0 }}>{f.warning}</p>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 14, background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-arena)', borderRadius: 14, padding: '14px 18px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <CheckCircle size={18} weight="fill" style={{ color: 'var(--cat-menta-ink, #2d7a5e)', flexShrink: 0, marginTop: 2 }} />
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--liora-uva)', opacity: 0.75, margin: 0, lineHeight: 1.5 }}>
          En caso de duda, consulta con un médico o profesional de salud antes de comenzar cualquier suplemento.
        </p>
      </div>
    </div>
  )
}

export function GuiaPrivadaClient({ snapshot }: { snapshot: OrderGuideSnapshot }) {
  const guide = snapshot.guide_snapshot_json
  const products = snapshot.products_snapshot_json ?? []
  const safetyFlags = snapshot.safety_flags_snapshot_json ?? []
  const hasGuideContent = guide && Object.keys(guide).length > 0

  const schedule = hasGuideContent ? (guide.schedule as Array<{ time: string; emoji: string; products: string[]; tip: string }>) : []
  const warnings = hasGuideContent ? (guide.warnings as string[]) : []

  return (
    <main style={{ background: 'var(--liora-crema)', minHeight: '100vh', padding: '48px 48px 96px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, color: 'var(--liora-uva)', opacity: 0.55, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>
            Pedido #{snapshot.orders.order_number}
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 52, lineHeight: 1.0, letterSpacing: '-0.02em', color: 'var(--liora-uva)', margin: '0 0 12px', fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1" }}>
            {hasGuideContent ? (guide.kitName as string) : 'Tu guía de uso'}
          </h1>
          {hasGuideContent && (guide.tagline as string) && (
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 17, color: 'var(--liora-uva)', opacity: 0.75, margin: 0, lineHeight: 1.5 }}>
              {guide.tagline as string}
            </p>
          )}
        </div>

        {/* Advertencias de seguridad personalizadas (primero, son lo más importante) */}
        <SafetySection flags={safetyFlags} />

        {/* Advertencias generales del kit */}
        {warnings && warnings.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, color: 'var(--liora-uva)', marginBottom: 20 }}>
              Advertencias generales
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {warnings.map((w, i) => (
                <div key={i} style={{ background: 'var(--cat-coral)', borderRadius: 14, padding: '14px 18px', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--liora-uva)', lineHeight: 1.5 }}>
                  {w}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rutina */}
        <ScheduleSection schedule={schedule} />

        {/* Instrucciones por producto */}
        <ProductsSection products={products} />

        {/* CTA footer */}
        <div style={{ background: 'var(--liora-uva)', borderRadius: 28, padding: 32, display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-start' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: 'var(--liora-crema)', lineHeight: 1.2 }}>
            ¿Tienes dudas sobre tu kit?
          </div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--liora-crema)', opacity: 0.75, margin: 0, lineHeight: 1.5 }}>
            Nuestro equipo puede orientarte. Sin costo, sin compromiso.
          </p>
          <a
            href={`https://wa.me/${process.env.NEXT_PUBLIC_WA_URL ?? ''}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ background: 'var(--liora-lima)', color: 'var(--liora-uva)', borderRadius: 999, padding: '14px 24px', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15, textDecoration: 'none' }}
          >
            Escribir por WhatsApp →
          </a>
        </div>
      </div>
    </main>
  )
}
