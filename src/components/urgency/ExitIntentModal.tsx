'use client'
import { useEffect, useState, useCallback } from 'react'

const STORAGE_KEY = 'liora_exit_shown'

interface FeaturedCoupon { code: string; discountText: string; description: string | null }

export function ExitIntentModal() {
  const [visible, setVisible]   = useState(false)
  const [animIn, setAnimIn]     = useState(false)
  const [copied, setCopied]     = useState(false)
  const [email, setEmail]       = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [coupon, setCoupon]     = useState<FeaturedCoupon | null>(null)

  useEffect(() => {
    fetch('/api/coupons/featured')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setCoupon(data) })
      .catch(() => {})
  }, [])

  const openModal = useCallback(() => {
    if (sessionStorage.getItem(STORAGE_KEY)) return
    sessionStorage.setItem(STORAGE_KEY, '1')
    setVisible(true)
    requestAnimationFrame(() => requestAnimationFrame(() => setAnimIn(true)))
  }, [])

  const closeModal = useCallback(() => {
    setAnimIn(false)
    setTimeout(() => setVisible(false), 350)
  }, [])

  useEffect(() => {
    // Desktop: exit intent por mouse saliendo del viewport por arriba
    const onMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 10) openModal()
    }

    // Mobile: intent after 40 seconds of inactivity
    let mobileTimer: ReturnType<typeof setTimeout>
    const isMobile = window.innerWidth < 768

    if (isMobile) {
      mobileTimer = setTimeout(openModal, 40_000)
    } else {
      document.addEventListener('mouseleave', onMouseLeave)
    }

    // También al dar click en "back" del navegador (popstate)
    const onPopState = () => openModal()
    window.addEventListener('popstate', onPopState)

    return () => {
      document.removeEventListener('mouseleave', onMouseLeave)
      clearTimeout(mobileTimer)
      window.removeEventListener('popstate', onPopState)
    }
  }, [openModal])

  // Cerrar con Escape
  useEffect(() => {
    if (!visible) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeModal() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [visible, closeModal])

  const handleCopy = async () => {
    if (!coupon) return
    try {
      await navigator.clipboard.writeText(coupon.code)
    } catch {}
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    // Registrar el lead (mismo endpoint del quiz)
    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), source: 'exit_intent' }),
      })
    } catch {
      // Silently fail — the UX is what matters
    }
    setSubmitted(true)
  }

  if (!visible || !coupon) return null

  return (
    <>
      <style>{`
        @keyframes liora-modal-bg-in  { from{opacity:0} to{opacity:1} }
        @keyframes liora-modal-in  { from{opacity:0;transform:translateY(24px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes liora-modal-out { from{opacity:1;transform:translateY(0) scale(1)} to{opacity:0;transform:translateY(24px) scale(0.97)} }
        .liora-modal-wrap-in  { animation: liora-modal-bg-in  0.3s ease forwards }
        .liora-modal-card-in  { animation: liora-modal-in  0.4s cubic-bezier(0.22,1,0.36,1) forwards }
        .liora-modal-card-out { animation: liora-modal-out 0.3s ease forwards }
        .liora-exit-input:focus { outline: 2px solid var(--liora-uva); outline-offset: 2px }
      `}</style>

      {/* Overlay */}
      <div
        className="liora-modal-wrap-in"
        onClick={closeModal}
        style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          background: 'rgba(30,12,30,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20,
        }}
      >
        {/* Card */}
        <div
          className={animIn ? 'liora-modal-card-in' : 'liora-modal-card-out'}
          onClick={e => e.stopPropagation()}
          style={{
            background: 'var(--liora-crema)',
            borderRadius: 32,
            maxWidth: 460,
            width: '100%',
            overflow: 'hidden',
            boxShadow: '0 24px 80px rgba(61,26,58,0.25)',
            position: 'relative',
          }}
        >
          {/* Header coloreado */}
          <div style={{
            background: 'var(--cat-coral)',
            padding: '32px 32px 28px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🎁</div>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800, fontSize: 30,
              color: 'var(--liora-uva)', margin: 0,
              lineHeight: 1.1,
              fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1",
            }}>
              Espera — tienes<br />un regalo esperándote
            </h2>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: 15, color: 'var(--liora-uva)',
              opacity: 0.8, marginTop: 10, marginBottom: 0, lineHeight: 1.45,
            }}>
              Crea tu cuenta gratis y obtén <strong>{coupon.discountText}</strong> en tu primera compra
            </p>
          </div>

          {/* Body */}
          <div style={{ padding: '28px 32px 32px' }}>
            {!submitted ? (
              <>
                {/* CTA principal — crear cuenta */}
                <a
                  href={`/login?next=${encodeURIComponent('/carrito')}`}
                  onClick={closeModal}
                  style={{
                    display: 'block', width: '100%', textAlign: 'center',
                    background: 'var(--liora-uva)', color: 'var(--liora-crema)',
                    border: 'none', borderRadius: 16,
                    padding: '15px 24px', marginBottom: 10,
                    fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 16,
                    textDecoration: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Crear cuenta y obtener {coupon.discountText} →
                </a>

                {/* Código copiable (secundario) */}
                <button
                  onClick={handleCopy}
                  style={{
                    width: '100%',
                    background: copied ? 'var(--cat-menta)' : 'transparent',
                    color: 'var(--liora-uva)',
                    border: '1.5px dashed var(--liora-arena)',
                    borderRadius: 12,
                    padding: '10px 20px',
                    fontFamily: 'var(--font-display)',
                    fontWeight: 700, fontSize: 18,
                    letterSpacing: '0.06em',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  {copied ? '✓ ¡Copiado!' : coupon.code}
                  {!copied && (
                    <span style={{ fontSize: 12, opacity: 0.5, fontFamily: 'var(--font-body)', fontWeight: 400 }}>
                      copiar código
                    </span>
                  )}
                </button>

                <div style={{
                  fontFamily: 'var(--font-body)', fontSize: 11,
                  color: 'var(--liora-uva)', opacity: 0.5,
                  textAlign: 'center', marginTop: 8, marginBottom: 20,
                }}>
                  Solo válido para cuentas nuevas · Una vez por cuenta
                </div>

                {/* Email para ofertas */}
                <div style={{ borderTop: '1.5px solid var(--liora-arena)', paddingTop: 18 }}>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--liora-uva)', opacity: 0.65, margin: '0 0 10px', textAlign: 'center' }}>
                    O déjanos tu email para recibir ofertas exclusivas
                  </p>
                  <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8 }}>
                    <input
                      className="liora-exit-input"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="tu@email.com"
                      required
                      style={{ flex: 1, padding: '10px 14px', border: '1.5px solid var(--liora-arena)', borderRadius: 10, fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--liora-uva)', background: 'var(--liora-blanco)' }}
                    />
                    <button
                      type="submit"
                      style={{ background: 'var(--liora-uva)', color: 'var(--liora-crema)', border: 'none', borderRadius: 10, padding: '10px 16px', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      Enviar
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🌿</div>
                <p style={{
                  fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20,
                  color: 'var(--liora-uva)', margin: '0 0 8px',
                }}>
                  ¡Listo! Ya tienes tu código
                </p>
                <p style={{
                  fontFamily: 'var(--font-body)', fontSize: 14,
                  color: 'var(--liora-uva)', opacity: 0.7, margin: 0,
                }}>
                  Usa <strong>{coupon.code}</strong> al finalizar tu compra.<br />
                  Te enviamos más beneficios a tu email.
                </p>
              </div>
            )}

            {/* Cerrar */}
            <button
              onClick={closeModal}
              style={{
                display: 'block', width: '100%', marginTop: 20,
                background: 'transparent', border: 'none',
                fontFamily: 'var(--font-body)', fontSize: 13,
                color: 'var(--liora-uva)', opacity: 0.45,
                cursor: 'pointer', padding: '4px 0',
              }}
            >
              No gracias, prefiero pagar precio completo
            </button>
          </div>

          {/* X button */}
          <button
            onClick={closeModal}
            aria-label="Cerrar"
            style={{
              position: 'absolute', top: 14, right: 14,
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(61,26,58,0.12)', border: 'none',
              cursor: 'pointer', fontSize: 16, color: 'var(--liora-uva)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>
      </div>
    </>
  )
}
