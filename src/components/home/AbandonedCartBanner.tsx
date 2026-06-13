'use client'
import { useEffect, useState } from 'react'
import { Gift, DeviceMobile, X } from '@phosphor-icons/react'
import Link from 'next/link'

const STORAGE_KEY  = 'liora-abandoned-kit'
const DISMISS_KEY  = 'liora_cart_banner_dismissed'
const MAX_AGE_DAYS = 7

interface CartData {
  profileId: string
  productCount: number
  totalCents: number
  savedAt: number
}

function timeAgo(savedAt: number): string {
  const diffMs  = Date.now() - savedAt
  const diffMin = Math.floor(diffMs / 60_000)
  const diffH   = Math.floor(diffMin / 60)
  const diffD   = Math.floor(diffH / 24)
  if (diffD > 0) return `hace ${diffD} día${diffD > 1 ? 's' : ''}`
  if (diffH > 0) return `hace ${diffH} hora${diffH > 1 ? 's' : ''}`
  if (diffMin > 0) return `hace ${diffMin} minuto${diffMin > 1 ? 's' : ''}`
  return 'hace un momento'
}

function fmt(cents: number) { return `S/${(cents / 100).toFixed(0)}` }

export function AbandonedCartBanner() {
  const [data, setData] = useState<CartData | null>(null)

  useEffect(() => {
    try {
      if (sessionStorage.getItem(DISMISS_KEY)) return
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const parsed: CartData = JSON.parse(raw)
      const ageMs = Date.now() - parsed.savedAt
      if (ageMs > MAX_AGE_DAYS * 86_400_000) { localStorage.removeItem(STORAGE_KEY); return }
      setData(parsed)
    } catch {}
  }, [])

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, '1')
    setData(null)
  }

  if (!data) return null

  return (
    <div style={{
      background: 'var(--liora-uva)', padding: '0 48px',
      display: 'flex', alignItems: 'center', gap: 16,
      minHeight: 64, position: 'relative',
    }}>
      {/* Gift icon + dots */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--liora-lima)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Gift size={20} weight="bold" color="var(--liora-uva)" />
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          {['var(--cat-coral)', 'var(--cat-menta)', 'var(--cat-cielo)', 'var(--cat-mostaza)'].map((c, i) => (
            <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
          ))}
        </div>
      </div>

      {/* Text */}
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, color: 'var(--liora-lima)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>
          Tu kit te espera
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: 'var(--liora-crema)', lineHeight: 1.1 }}>
          Hicimos tu kit {timeAgo(data.savedAt)}.
        </div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--liora-crema)', opacity: 0.65, marginTop: 2 }}>
          {data.productCount} producto{data.productCount !== 1 ? 's' : ''} · {fmt(data.totalCents)} · sin terminar
        </div>
      </div>

      {/* Saved in browser */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--liora-crema)', opacity: 0.55, flexShrink: 0 }}>
        <DeviceMobile size={14} />
        Guardado en este navegador
      </div>

      {/* CTA */}
      <Link
        href={`/carrito?profileId=${data.profileId}`}
        style={{
          background: 'var(--liora-lima)', color: 'var(--liora-uva)',
          borderRadius: 999, padding: '10px 22px',
          fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14,
          textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0,
        }}
      >
        Retomar →
      </Link>

      {/* Dismiss */}
      <button onClick={dismiss} aria-label="Cerrar"
        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--liora-crema)', opacity: 0.45, padding: 6, borderRadius: 8, display: 'flex', flexShrink: 0 }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')} onMouseLeave={e => (e.currentTarget.style.opacity = '0.45')}>
        <X size={18} weight="bold" />
      </button>
    </div>
  )
}
