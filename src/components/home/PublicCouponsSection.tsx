'use client'
import { useState } from 'react'
import { Tag, Check, Copy } from '@phosphor-icons/react'

export interface PublicCoupon {
  id: string
  code: string
  type: string
  value: number
  description: string | null
  expires_at: string | null
  color: string
}

function fmtValue(type: string, value: number) {
  if (type === 'percentage') return `${value}% OFF`
  if (type === 'fixed_amount') return `S/${value} OFF`
  return 'Envío gratis'
}

function fmtExpiry(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })
}

function CouponCard({ c }: { c: PublicCoupon }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(c.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback: select text
    }
  }

  const expiry = fmtExpiry(c.expires_at)

  return (
    <article style={{
      background: 'var(--liora-blanco)',
      border: '1.5px solid var(--liora-arena)',
      borderRadius: 20, overflow: 'hidden',
      display: 'flex',
    }}>
      {/* Color stub */}
      <div style={{ background: c.color, width: 72, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px 8px', gap: 2 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: c.type === 'free_shipping' ? 13 : 22, color: 'var(--liora-uva)', lineHeight: 1, textAlign: 'center', fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1" }}>
          {c.type === 'percentage' ? c.value : c.type === 'fixed_amount' ? c.value : 'Envío'}
        </div>
        <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, color: 'var(--liora-uva)', opacity: 0.75, textAlign: 'center' }}>
          {c.type === 'percentage' ? '%' : c.type === 'fixed_amount' ? 'S/' : 'gratis'}
        </div>
      </div>

      {/* Dashed divider */}
      <div style={{ width: 0, borderLeft: '2px dashed var(--liora-arena)', margin: '10px 0', flexShrink: 0 }} />

      {/* Content */}
      <div style={{ flex: 1, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, color: 'var(--liora-uva)', fontVariationSettings: "'opsz' 144,'SOFT' 60,'WONK' 0" }}>{fmtValue(c.type, c.value)}</span>
          {expiry && (
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--liora-uva)', opacity: 0.55, flexShrink: 0 }}>hasta {expiry}</span>
          )}
        </div>

        {c.description && (
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--liora-uva)', opacity: 0.6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {c.description}
          </div>
        )}

        <button
          onClick={handleCopy}
          style={{
            marginTop: 6,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'space-between',
            background: copied ? 'var(--cat-menta)' : 'var(--liora-crema)',
            border: '1.5px solid ' + (copied ? 'transparent' : 'var(--liora-arena)'),
            borderRadius: 10, padding: '7px 12px',
            fontFamily: 'monospace', fontWeight: 700, fontSize: 13,
            letterSpacing: '0.1em', color: 'var(--liora-uva)',
            cursor: 'pointer', transition: 'background 150ms, border-color 150ms',
            width: '100%',
          }}
        >
          <span>{c.code}</span>
          {copied
            ? <Check size={13} weight="bold" style={{ color: 'var(--liora-uva)', flexShrink: 0 }} />
            : <Copy size={13} weight="bold" style={{ opacity: 0.45, flexShrink: 0 }} />}
        </button>
      </div>
    </article>
  )
}

export function PublicCouponsSection({ coupons }: { coupons: PublicCoupon[] }) {
  if (coupons.length === 0) return null

  return (
    <section style={{ background: 'var(--liora-crema)', padding: '48px 48px 64px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10, display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--liora-uva)' }}>
              <Tag size={13} weight="bold" />
              Descuentos activos
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 48, color: 'var(--liora-uva)', margin: 0, lineHeight: 1, fontVariationSettings: "'opsz' 144,'SOFT' 60,'WONK' 0" }}>
              ¿Hay promos hoy?
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--liora-uva)', opacity: 0.65, marginTop: 8, marginBottom: 0 }}>
              Copia el código y aplícalo al pagar.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {coupons.map(c => <CouponCard key={c.id} c={c} />)}
        </div>
      </div>
    </section>
  )
}
