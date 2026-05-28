'use client'
import { useEffect, useState, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Sparkle, Minus, Plus, X, Lock,
  ShoppingBag, Package, PaperPlaneRight,
  CaretDown, CaretUp, ShieldCheck, Check,
} from '@phosphor-icons/react'
import { useCartStore } from '@/lib/store/cart'
import { trackBeginCheckout } from '@/lib/analytics/events'

interface KitItem {
  variantId: string
  productId: string
  name: string
  variantName: string
  categoryName: string
  priceCents: number
  currency: string
  imageUrl: string | null
  categoryColor: string
}

interface KitData {
  kit: KitItem[]
  suggestions: KitItem[]
  diagnosis: string
  tags: string[]
}

type BotMsg = { who: 'bot' | 'user'; text: string }

export function CartPageClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const profileId = searchParams.get('profileId')

  const { items, removeItem, updateQuantity, subtotalCents, totalCents, discountCents,
    appliedCouponCode, setAppliedCoupon, clearCart, addItem, setIsOpen } = useCartStore()

  const [kitData, setKitData] = useState<KitData | null>(null)
  const [suggestions, setSuggestions] = useState<KitItem[]>([])
  const [kitLoading, setKitLoading] = useState(false)
  const [kitError, setKitError] = useState<string | null>(null)
  const [couponInput, setCouponInput] = useState(appliedCouponCode ?? '')
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState('')
  const [botOpen, setBotOpen] = useState(true)
  const [botThread, setBotThread] = useState<BotMsg[]>([])
  const [botInput, setBotInput] = useState('')
  const [botLoading, setBotLoading] = useState(false)
  const hasFetched = useRef(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!profileId || hasFetched.current) return
    hasFetched.current = true
    setKitLoading(true)
    fetch(`/api/kit/recommend?profileId=${encodeURIComponent(profileId)}`)
      .then((r) => r.json())
      .then((data: KitData) => {
        setKitData(data)
        setSuggestions(data.suggestions ?? [])
        clearCart()
        for (const item of (data.kit ?? [])) {
          addItem({
            variantId: item.variantId,
            productId: item.productId,
            name: item.name,
            variantName: item.variantName,
            priceCents: item.priceCents,
            currency: item.currency,
            imageUrl: item.imageUrl ?? undefined,
            categoryColor: item.categoryColor,
          })
        }
        setIsOpen(false)
        const preview = (data.kit ?? []).slice(0, 2).map((i) => i.name).join(' + ')
        setBotThread([{
          who: 'bot',
          text: `Hola 👋 Armé tu kit con ${(data.kit ?? []).length} productos.${preview ? ` Incluye ${preview}` : ''} ¿Tienes alguna pregunta?`,
        }])
      })
      .catch(() => setKitError('No se pudo cargar tu kit. Intenta de nuevo.'))
      .finally(() => setKitLoading(false))
  }, [profileId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [botThread])

  const sub = subtotalCents()
  const discount = discountCents
  const shipping = sub >= 15000 ? 0 : 1500
  const total = totalCents() + shipping
  const fmt = (cents: number) => `S/${(cents / 100).toFixed(0)}`

  const applyCoupon = async () => {
    if (!couponInput.trim()) return
    setCouponLoading(true)
    setCouponError('')
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponInput.trim().toUpperCase(), cartTotalCents: sub }),
      })
      const data = await res.json()
      if (data.valid) {
        setAppliedCoupon(data.code, data.discountCents)
      } else {
        setCouponError(data.message ?? 'Cupón inválido')
      }
    } finally {
      setCouponLoading(false)
    }
  }

  const goCheckout = () => {
    trackBeginCheckout(total, items.map((i) => ({ variantId: i.variantId, name: i.name, priceCents: i.priceCents, quantity: i.quantity })))
    router.push('/pagar')
  }

  const addSuggestion = (item: KitItem) => {
    addItem({
      variantId: item.variantId,
      productId: item.productId,
      name: item.name,
      variantName: item.variantName,
      priceCents: item.priceCents,
      currency: item.currency,
      imageUrl: item.imageUrl ?? undefined,
      categoryColor: item.categoryColor,
    })
    setIsOpen(false)
  }

  const sendBot = async () => {
    if (!botInput.trim() || botLoading) return
    const userMsg = botInput.trim()
    setBotInput('')
    const newThread: BotMsg[] = [...botThread, { who: 'user', text: userMsg }]
    setBotThread(newThread)
    setBotLoading(true)
    try {
      const res = await fetch('/api/kit/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, profileId, kitItems: items.map((i) => `${i.name} (${i.variantName})`) }),
      })
      const data = await res.json()
      setBotThread([...newThread, { who: 'bot', text: data.reply ?? 'Entendido. ¿En qué más puedo ayudarte?' }])
    } catch {
      setBotThread([...newThread, { who: 'bot', text: 'Hubo un error. Intenta de nuevo.' }])
    } finally {
      setBotLoading(false)
    }
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (kitLoading) {
    return (
      <div style={{ padding: '96px 48px', textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: 999, background: 'var(--liora-lima)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px' }}>
          <Sparkle size={28} weight="fill" style={{ color: 'var(--liora-uva)', animation: 'spin 1.2s linear infinite' }} />
        </div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 40, color: 'var(--liora-uva)', margin: 0 }}>Armando tu kit…</h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, opacity: 0.7, marginTop: 12 }}>Analizando tus respuestas para darte lo mejor.</p>
        <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (kitError) {
    return (
      <div style={{ padding: '96px 48px', textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, color: 'var(--liora-uva)', opacity: 0.8 }}>{kitError}</p>
        <button
          onClick={() => { hasFetched.current = false; setKitError(null); setKitLoading(true) }}
          style={{ marginTop: 20, background: 'var(--liora-uva)', color: 'var(--liora-crema)', border: 'none', borderRadius: 999, padding: '14px 28px', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600 }}
        >
          Reintentar
        </button>
      </div>
    )
  }

  // ── Empty (no profileId, no items) ───────────────────────────────────────
  if (!profileId && items.length === 0) {
    return (
      <div style={{ padding: '96px 48px', textAlign: 'center' }}>
        <ShoppingBag size={64} style={{ color: 'var(--liora-arena)', margin: '0 auto 24px', display: 'block' }} />
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 48, color: 'var(--liora-uva)', margin: 0 }}>Tu carrito está vacío</h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, opacity: 0.7, marginTop: 16 }}>¿Qué tal si empiezas con el cuestionario?</p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginTop: 32 }}>
          <Link href="/cuestionario" style={{ background: 'var(--liora-uva)', color: 'var(--liora-crema)', borderRadius: 999, padding: '16px 32px', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 16, textDecoration: 'none' }}>
            Hacer mi cuestionario
          </Link>
          <Link href="/tienda" style={{ background: 'transparent', color: 'var(--liora-uva)', border: '1.5px solid var(--liora-uva)', borderRadius: 999, padding: '16px 28px', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 16, textDecoration: 'none' }}>
            Ver tienda
          </Link>
        </div>
      </div>
    )
  }

  // ── KIT MODE (from quiz) ─────────────────────────────────────────────────
  if (profileId) {
    return (
      <section style={{ background: 'var(--liora-crema)', padding: '32px 48px 96px' }}>
        <button
          onClick={() => router.push('/cuestionario')}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--liora-uva)', fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, padding: '8px 0', display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 24 }}
        >
          <ArrowLeft size={16} weight="bold" /> Volver al cuestionario
        </button>

        {/* Header */}
        <div style={{ marginBottom: 4 }}>
          <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 12, color: 'var(--liora-uva)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 14, display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 28, height: 28, borderRadius: 999, background: 'var(--liora-lima)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--liora-uva)' }}>
              <Sparkle size={14} weight="fill" />
            </span>
            Tu kit personalizado
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 56, lineHeight: 1.1, letterSpacing: '-0.025em', color: 'var(--liora-uva)', margin: 0, fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1" }}>
            Hicimos esto <span style={{ fontFamily: 'var(--font-script)' }}>para ti</span>.
          </h1>
        </div>

        {kitData?.diagnosis && (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, lineHeight: 1.6, color: 'var(--liora-uva)', opacity: 0.8, marginTop: 14, marginBottom: 16, maxWidth: 600 }}>
            {kitData.diagnosis}
          </p>
        )}

        {(kitData?.tags ?? []).length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 40 }}>
            {(kitData?.tags ?? []).map((tag) => (
              <span key={tag} style={{ background: 'var(--liora-uva)', color: 'var(--liora-crema)', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, padding: '6px 14px', borderRadius: 999 }}>
                {tag}
              </span>
            ))}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 32, alignItems: 'flex-start' }}>

          {/* Left column ─── items + suggestions + bot */}
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--liora-uva)', marginBottom: 14 }}>
              Tu kit ({items.length} {items.length === 1 ? 'producto' : 'productos'})
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {items.map((item) => (
                <article key={item.variantId} style={{ background: 'var(--liora-blanco)', borderRadius: 24, border: '1.5px solid var(--liora-arena)', padding: 20, display: 'flex', gap: 20, alignItems: 'center' }}>
                  <div style={{ width: 88, height: 88, borderRadius: 18, background: item.categoryColor ?? 'var(--cat-lavanda)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                    {item.imageUrl
                      ? <img src={item.imageUrl} alt={item.name} style={{ width: '90%', height: '90%', objectFit: 'contain' }} />
                      : <Package size={32} style={{ opacity: 0.4, color: 'var(--liora-uva)' }} />
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 19, color: 'var(--liora-uva)', lineHeight: 1.15 }}>{item.name}</div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, opacity: 0.65, marginTop: 4 }}>{item.variantName}</div>
                    <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 17, color: 'var(--liora-uva)', marginTop: 6 }}>{fmt(item.priceCents)}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--liora-crema)', borderRadius: 999, padding: 4, flexShrink: 0 }}>
                    <button onClick={() => updateQuantity(item.variantId, item.quantity - 1)} style={{ width: 30, height: 30, borderRadius: 999, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--liora-uva)' }}><Minus size={14} weight="bold" /></button>
                    <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, minWidth: 22, textAlign: 'center', color: 'var(--liora-uva)' }}>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.variantId, item.quantity + 1)} style={{ width: 30, height: 30, borderRadius: 999, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--liora-uva)' }}><Plus size={14} weight="bold" /></button>
                  </div>
                  <button onClick={() => removeItem(item.variantId)} aria-label="Quitar" style={{ background: 'transparent', border: 'none', cursor: 'pointer', opacity: 0.5, padding: 4, color: 'var(--liora-uva)', flexShrink: 0 }}>
                    <X size={20} />
                  </button>
                </article>
              ))}
            </div>

            {/* Suggestions strip */}
            {suggestions.length > 0 && (
              <div style={{ marginTop: 36 }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, color: 'var(--liora-uva)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>Sumar a tu kit</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: 'var(--liora-uva)' }}>Otros clientes como tú también pidieron</div>
                  </div>
                  <Link href="/tienda" style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, color: 'var(--liora-uva)', borderBottom: '1.5px solid var(--liora-uva)', paddingBottom: 1, whiteSpace: 'nowrap', textDecoration: 'none' }}>
                    Ver más
                  </Link>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                  {suggestions.map((s) => {
                    const inCart = items.some((i) => i.variantId === s.variantId)
                    return (
                      <article key={s.variantId} style={{ background: s.categoryColor, borderRadius: 20, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ aspectRatio: '1 / 1', borderRadius: 16, background: 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--liora-uva)' }}>
                          {s.imageUrl
                            ? <img src={s.imageUrl} alt={s.name} style={{ width: '85%', height: '85%', objectFit: 'contain' }} />
                            : <Package size={36} style={{ opacity: 0.6 }} />
                          }
                        </div>
                        <div>
                          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--liora-uva)', lineHeight: 1.15 }}>{s.name}</div>
                          <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--liora-uva)', opacity: 0.65, marginTop: 3 }}>{s.variantName}</div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                          <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15, color: 'var(--liora-uva)' }}>{fmt(s.priceCents)}</span>
                          <button
                            onClick={() => !inCart && addSuggestion(s)}
                            disabled={inCart}
                            style={{ background: inCart ? 'var(--liora-uva)' : 'var(--liora-crema)', color: inCart ? 'var(--liora-crema)' : 'var(--liora-uva)', border: 'none', borderRadius: 999, padding: '6px 12px', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12, cursor: inCart ? 'default' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            {inCart ? <><Check size={12} weight="bold" /> Añadido</> : <><Plus size={12} weight="bold" /> Sumar</>}
                          </button>
                        </div>
                      </article>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Lía bot */}
            <div style={{ marginTop: 36, background: 'var(--liora-uva)', borderRadius: 28, overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1.5px solid rgba(251,241,226,0.12)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 999, background: 'var(--liora-lima)', color: 'var(--liora-uva)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Sparkle size={22} weight="fill" />
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--liora-crema)', lineHeight: 1 }}>Lía · Tu asistente</div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--liora-crema)', opacity: 0.65, marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--liora-lima)', display: 'inline-block' }} />
                      Conoce tu kit · responde en segundos
                    </div>
                  </div>
                </div>
                <button onClick={() => setBotOpen(!botOpen)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--liora-crema)', display: 'flex', alignItems: 'center' }}>
                  {botOpen ? <CaretDown size={22} weight="bold" /> : <CaretUp size={22} weight="bold" />}
                </button>
              </div>
              {botOpen && (
                <div>
                  <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 320, overflowY: 'auto' }}>
                    {botThread.map((m, i) => (
                      <div key={i} style={{ alignSelf: m.who === 'bot' ? 'flex-start' : 'flex-end', maxWidth: '78%' }}>
                        <div style={{ background: m.who === 'bot' ? 'rgba(251,241,226,0.08)' : 'var(--liora-lima)', color: m.who === 'bot' ? 'var(--liora-crema)' : 'var(--liora-uva)', padding: '12px 18px', borderRadius: 18, fontFamily: 'var(--font-body)', fontSize: 15, lineHeight: 1.4, border: m.who === 'bot' ? '1.5px solid rgba(251,241,226,0.15)' : 'none' }}>
                          {m.text}
                        </div>
                      </div>
                    ))}
                    {botLoading && (
                      <div style={{ alignSelf: 'flex-start', background: 'rgba(251,241,226,0.08)', border: '1.5px solid rgba(251,241,226,0.15)', padding: '12px 18px', borderRadius: 18, fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--liora-crema)', opacity: 0.6 }}>
                        …
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                  <div style={{ padding: '16px 20px', borderTop: '1.5px solid rgba(251,241,226,0.12)', display: 'flex', gap: 10, alignItems: 'center' }}>
                    <input
                      value={botInput}
                      onChange={(e) => setBotInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendBot()}
                      placeholder="Pregúntame sobre tu kit…"
                      style={{ flex: 1, background: 'rgba(251,241,226,0.08)', color: 'var(--liora-crema)', border: '1.5px solid rgba(251,241,226,0.18)', borderRadius: 999, padding: '12px 20px', fontFamily: 'var(--font-body)', fontSize: 14, outline: 'none' }}
                    />
                    <button
                      onClick={sendBot}
                      disabled={botLoading}
                      style={{ background: 'var(--liora-lima)', color: 'var(--liora-uva)', border: 'none', borderRadius: 999, width: 42, height: 42, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                    >
                      <PaperPlaneRight size={20} weight="bold" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <aside style={{ background: 'var(--liora-uva)', color: 'var(--liora-crema)', borderRadius: 28, padding: 28, position: 'sticky', top: 100 }}>
            <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 12, color: 'var(--liora-lima)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>Resumen del kit</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 48, lineHeight: 1, color: 'var(--liora-crema)' }}>{fmt(total)}</div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, opacity: 0.7, marginTop: 6 }}>
              {items.length} {items.length === 1 ? 'producto' : 'productos'} · {shipping === 0 ? 'envío gratis' : `envío ${fmt(shipping)}`}
            </div>

            <div style={{ marginTop: 24 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  placeholder="Cupón"
                  style={{ flex: 1, background: 'rgba(251,241,226,0.08)', color: 'var(--liora-crema)', border: '1.5px solid rgba(251,241,226,0.2)', borderRadius: 12, padding: '10px 14px', fontFamily: 'var(--font-body)', fontSize: 13, outline: 'none' }}
                />
                <button onClick={applyCoupon} disabled={couponLoading} style={{ background: 'var(--liora-lima)', color: 'var(--liora-uva)', border: 'none', borderRadius: 12, padding: '0 16px', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13 }}>
                  {couponLoading ? '…' : 'Aplicar'}
                </button>
              </div>
              {couponError && <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#FFB5A8', marginTop: 8, margin: '8px 0 0' }}>{couponError}</p>}
              {appliedCouponCode && !couponError
                ? <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--liora-lima)', marginTop: 8, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, margin: '8px 0 0' }}><Check size={12} weight="bold" /> {appliedCouponCode} — −{fmt(discount)}</p>
                : <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, opacity: 0.65, marginTop: 8, margin: '8px 0 0' }}>Prueba <strong>BIENVENIDA15</strong></p>
              }
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 20, marginTop: 20, borderTop: '1.5px solid rgba(251,241,226,0.15)', fontFamily: 'var(--font-body)', fontSize: 13 }}>
              <SumRow label="Subtotal" value={fmt(sub)} />
              {discount > 0 && <SumRow label="Descuento" value={`−${fmt(discount)}`} accent />}
              <SumRow label="Envío" value={shipping === 0 ? 'Gratis' : fmt(shipping)} />
            </div>

            <button onClick={goCheckout} style={{ width: '100%', background: 'var(--liora-lima)', color: 'var(--liora-uva)', border: 'none', borderRadius: 999, padding: '16px 24px', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 16, cursor: 'pointer', marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              Ir a pagar <Lock size={18} weight="bold" />
            </button>

            <div style={{ display: 'flex', gap: 10, marginTop: 16, alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-body)', fontSize: 11, opacity: 0.6 }}>
              <ShieldCheck size={14} /> Compra segura · Visa · Yape
            </div>
          </aside>
        </div>
      </section>
    )
  }

  // ── REGULAR CART (no profileId, has items) ───────────────────────────────
  return (
    <div style={{ background: 'var(--liora-crema)', padding: '40px 48px 96px', maxWidth: 1200, margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 56, lineHeight: 1, color: 'var(--liora-uva)', margin: '0 0 40px', fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1" }}>
        Tu carrito · <span style={{ fontFamily: 'var(--font-script)' }}>{items.reduce((s, i) => s + i.quantity, 0)} productos</span>
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 32, alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {items.map((item) => (
            <article key={item.variantId} style={{ background: 'var(--liora-blanco)', borderRadius: 24, border: '1.5px solid var(--liora-arena)', padding: 20, display: 'flex', gap: 20, alignItems: 'center' }}>
              <div style={{ width: 88, height: 88, borderRadius: 18, background: item.categoryColor ?? 'var(--cat-lavanda)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                {item.imageUrl ? <img src={item.imageUrl} alt={item.name} style={{ width: '90%', height: '90%', objectFit: 'contain' }} /> : <ShoppingBag size={32} style={{ opacity: 0.4, color: 'var(--liora-uva)' }} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 19, color: 'var(--liora-uva)', lineHeight: 1.15 }}>{item.name}</div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, opacity: 0.65, marginTop: 4 }}>{item.variantName}</div>
                <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 17, color: 'var(--liora-uva)', marginTop: 6 }}>{fmt(item.priceCents)}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--liora-crema)', borderRadius: 999, padding: 4 }}>
                <button onClick={() => updateQuantity(item.variantId, item.quantity - 1)} style={{ width: 30, height: 30, borderRadius: 999, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={14} weight="bold" /></button>
                <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, minWidth: 22, textAlign: 'center' }}>{item.quantity}</span>
                <button onClick={() => updateQuantity(item.variantId, item.quantity + 1)} style={{ width: 30, height: 30, borderRadius: 999, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={14} weight="bold" /></button>
              </div>
              <button onClick={() => removeItem(item.variantId)} aria-label="Quitar" style={{ background: 'transparent', border: 'none', cursor: 'pointer', opacity: 0.5, padding: 4 }}><X size={20} /></button>
            </article>
          ))}
        </div>

        <aside style={{ background: 'var(--liora-uva)', color: 'var(--liora-crema)', borderRadius: 28, padding: 28, position: 'sticky', top: 100 }}>
          <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, color: 'var(--liora-lima)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>Resumen</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 44, lineHeight: 1, color: 'var(--liora-crema)' }}>{fmt(total)}</div>
          <div style={{ marginTop: 24 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={couponInput} onChange={(e) => setCouponInput(e.target.value.toUpperCase())} placeholder="Cupón" style={{ flex: 1, background: 'rgba(251,241,226,0.08)', color: 'var(--liora-crema)', border: '1.5px solid rgba(251,241,226,0.2)', borderRadius: 12, padding: '10px 14px', fontFamily: 'var(--font-body)', fontSize: 13, outline: 'none' }} />
              <button onClick={applyCoupon} disabled={couponLoading} style={{ background: 'var(--liora-lima)', color: 'var(--liora-uva)', border: 'none', borderRadius: 12, padding: '0 16px', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13 }}>{couponLoading ? '…' : 'Aplicar'}</button>
            </div>
            {couponError && <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#FFB5A8', marginTop: 8 }}>{couponError}</p>}
            {appliedCouponCode && !couponError && (
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--liora-lima)', marginTop: 8, fontWeight: 600 }}>✓ {appliedCouponCode} — −{fmt(discount)}</p>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 20, marginTop: 20, borderTop: '1.5px solid rgba(251,241,226,0.15)', fontFamily: 'var(--font-body)', fontSize: 13 }}>
            <SumRow label="Subtotal" value={fmt(sub)} />
            {discount > 0 && <SumRow label="Descuento" value={`−${fmt(discount)}`} accent />}
            <SumRow label="Envío" value={shipping === 0 ? 'Gratis' : fmt(shipping)} />
          </div>
          <button onClick={goCheckout} style={{ width: '100%', background: 'var(--liora-lima)', color: 'var(--liora-uva)', border: 'none', borderRadius: 999, padding: '16px 24px', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 16, cursor: 'pointer', marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <Lock size={18} weight="bold" /> Ir a pagar
          </button>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, opacity: 0.6, textAlign: 'center', marginTop: 14 }}>Prueba <strong>BIENVENIDA15</strong> para −15%</p>
        </aside>
      </div>
    </div>
  )
}

function SumRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ opacity: 0.8 }}>{label}</span>
      <span style={{ fontWeight: 700, color: accent ? 'var(--liora-lima)' : 'var(--liora-crema)' }}>{value}</span>
    </div>
  )
}
