'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { usePathname } from 'next/navigation'

const STORAGE_KEY = 'liora_exit_shown'
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000
const DESKTOP_MIN_MS = 30_000

interface FeaturedCoupon {
  code: string
  discountText: string
  description: string | null
  newCustomersOnly: boolean
  isLoggedIn: boolean
  promoTitle: string | null
  promoSubtitle: string | null
  promoCta: string | null
}

function wasDismissedRecently(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return false
    const ts = parseInt(raw, 10)
    return Date.now() - ts < SEVEN_DAYS
  } catch {
    return false
  }
}

function markDismissed() {
  try { localStorage.setItem(STORAGE_KEY, String(Date.now())) } catch {}
}

export function ExitIntentModal({ isLoggedIn }: { isLoggedIn: boolean }) {
  const pathname = usePathname()
  const [visible, setVisible]     = useState(false)
  const [animIn, setAnimIn]       = useState(false)
  const [email, setEmail]         = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [coupon, setCoupon]       = useState<FeaturedCoupon | null>(null)
  const readyRef = useRef(false)

  const HIDE_ON = ['/cuestionario', '/cuenta', '/pagar', '/login']

  useEffect(() => {
    fetch('/api/coupons/featured?placement=exit_modal')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setCoupon(data) })
      .catch(() => {})
  }, [])

  const openModal = useCallback(() => {
    if (HIDE_ON.some(r => pathname?.startsWith(r))) return
    if (wasDismissedRecently()) return
    markDismissed()
    setVisible(true)
    requestAnimationFrame(() => requestAnimationFrame(() => setAnimIn(true)))
  }, [pathname])

  const closeModal = useCallback(() => {
    setAnimIn(false)
    setTimeout(() => setVisible(false), 350)
  }, [])

  // Desktop: exit intent fires only after 30s minimum on page
  // Mobile: fires after 40s of inactivity
  useEffect(() => {
    const isMobile = window.innerWidth < 768

    if (isMobile) {
      const t = setTimeout(openModal, 40_000)
      return () => clearTimeout(t)
    }

    const readyTimer = setTimeout(() => { readyRef.current = true }, DESKTOP_MIN_MS)

    const onMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 10 && readyRef.current) openModal()
    }
    const onPopState = () => { if (readyRef.current) openModal() }

    document.addEventListener('mouseleave', onMouseLeave)
    window.addEventListener('popstate', onPopState)

    return () => {
      clearTimeout(readyTimer)
      document.removeEventListener('mouseleave', onMouseLeave)
      window.removeEventListener('popstate', onPopState)
    }
  }, [openModal])

  useEffect(() => {
    if (!visible) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeModal() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [visible, closeModal])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), source: 'exit_intent' }),
      })
    } catch {}
    setSubmitted(true)
  }

  if (!visible || !coupon) return null
  if (HIDE_ON.some(r => pathname?.startsWith(r))) return null

  const title = coupon.promoTitle ?? (
    isLoggedIn
      ? 'Tenemos algo para ti'
      : 'Espera — tu primer kit\npuede tener 10% OFF'
  )

  const subtitle = coupon.promoSubtitle ?? (
    isLoggedIn
      ? `Usa este código y obtén <strong>${coupon.discountText}</strong> en tu próxima compra.`
      : 'Completa el cuestionario LIORA y guarda tu descuento de bienvenida para tu primera compra.'
  )

  const ctaText = coupon.promoCta ?? `Ir al carrito con ${coupon.discountText}`

  const fine = coupon.newCustomersOnly
    ? 'Código válido para cuentas nuevas · Una vez por persona'
    : `Una vez por cliente · ${coupon.discountText}`

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
          {/* Header */}
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
              whiteSpace: 'pre-line',
              fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1",
            }}>
              {title}
            </h2>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 15, color: 'var(--liora-uva)',
                opacity: 0.8, marginTop: 10, marginBottom: 0, lineHeight: 1.45,
              }}
              dangerouslySetInnerHTML={{ __html: subtitle }}
            />
          </div>

          {/* Body */}
          <div style={{ padding: '28px 32px 32px' }}>
            {!submitted ? (
              <>
                {isLoggedIn ? (
                  /* Logged-in: CTA to cart + visible code */
                  <>
                    <a
                      href="/carrito"
                      onClick={closeModal}
                      style={{
                        display: 'block', width: '100%', textAlign: 'center',
                        background: 'var(--liora-uva)', color: 'var(--liora-crema)',
                        border: 'none', borderRadius: 16,
                        padding: '15px 24px', marginBottom: 14,
                        fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 16,
                        textDecoration: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      {ctaText}
                    </a>
                    <div style={{
                      textAlign: 'center',
                      fontFamily: 'var(--font-display)',
                      fontWeight: 700, fontSize: 20,
                      letterSpacing: '0.06em',
                      color: 'var(--liora-uva)',
                      border: '1.5px dashed var(--liora-arena)',
                      borderRadius: 12, padding: '10px 0',
                      marginBottom: 8,
                    }}>
                      {coupon.code}
                    </div>
                  </>
                ) : (
                  /* Not logged-in: email as primary action, code hidden until submit */
                  <form onSubmit={handleSubmit}>
                    <input
                      className="liora-exit-input"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="tu@email.com"
                      required
                      style={{
                        width: '100%', boxSizing: 'border-box',
                        padding: '13px 16px', marginBottom: 10,
                        border: '1.5px solid var(--liora-arena)', borderRadius: 12,
                        fontFamily: 'var(--font-body)', fontSize: 14,
                        color: 'var(--liora-uva)', background: 'var(--liora-blanco)',
                      }}
                    />
                    <button
                      type="submit"
                      style={{
                        display: 'block', width: '100%', textAlign: 'center',
                        background: 'var(--liora-uva)', color: 'var(--liora-crema)',
                        border: 'none', borderRadius: 16,
                        padding: '15px 24px', marginBottom: 10,
                        fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 16,
                        cursor: 'pointer',
                      }}
                    >
                      Guardar mi descuento
                    </button>
                    <div style={{
                      fontFamily: 'var(--font-body)', fontSize: 11,
                      color: 'var(--liora-uva)', opacity: 0.5,
                      textAlign: 'center', marginBottom: 4,
                    }}>
                      {fine}
                    </div>
                  </form>
                )}
              </>
            ) : (
              /* Post-submit: show code + quiz CTA */
              <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🌿</div>
                <p style={{
                  fontFamily: 'var(--font-display)', fontWeight: 700,
                  fontSize: 20, color: 'var(--liora-uva)', margin: '0 0 6px',
                }}>
                  ¡Listo! Tu descuento está guardado.
                </p>
                <p style={{
                  fontFamily: 'var(--font-body)', fontSize: 14,
                  color: 'var(--liora-uva)', opacity: 0.7,
                  margin: '0 0 20px', lineHeight: 1.5,
                }}>
                  Usa <strong>{coupon.code}</strong> al finalizar tu compra.<br />
                  Te enviamos más beneficios a tu email.
                </p>
                <a
                  href="/cuestionario"
                  onClick={closeModal}
                  style={{
                    display: 'inline-block',
                    background: 'var(--liora-uva)', color: 'var(--liora-crema)',
                    textDecoration: 'none', borderRadius: 14,
                    padding: '12px 24px',
                    fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15,
                  }}
                >
                  Empezar cuestionario →
                </a>
              </div>
            )}

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
              Ahora no
            </button>
          </div>

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
