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
import { trackAssistantEvent, trackBeginCheckout } from '@/lib/analytics/events'
import { createClient } from '@/lib/supabase/client'

interface KitItem {
  variantId: string
  productId: string
  name: string
  brand?: string | null
  variantName: string
  categoryName: string
  priceCents: number
  currency: string
  imageUrl: string | null
  categoryColor: string
  stepLabel?: string | null
  stepWhen?: string | null
  stepInstruction?: string | null
  stockQuantity?: number | null
  usageInstructions?: string | null
}

interface KitData {
  kit: KitItem[]
  suggestions: KitItem[]
  diagnosis: string
  tags: string[]
  routineName?: string | null
  routineSlug?: string | null
}

interface BotReplacement {
  variantId: string
  productId: string
  name: string
  brand: string | null
  variantName: string
  categoryName: string
  priceCents: number
  currency: string
  imageUrl: string | null
  categoryColor: string
  stockQuantity: number | null
  usageInstructions: string | null
}

interface BotSuggestion {
  id: string
  sourceVariantId: string
  quantity: number
  reason: string
  savingsCents: number
  replacement: BotReplacement
}

type BotMsg = {
  who: 'bot' | 'user'
  text: string
  messageId?: string | null
  suggestions?: BotSuggestion[]
}

interface CartPageClientProps {
  shippingCostCents?: number
  freeShippingThresholdCents?: number
}

export function CartPageClient({ shippingCostCents = 1500, freeShippingThresholdCents = 15000 }: CartPageClientProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const profileId = searchParams.get('profileId')

  const { items, removeItem, updateQuantity, subtotalCents, totalCents, discountCents,
    appliedCouponCode, setAppliedCoupon, clearCart, addItem, replaceItem, setIsOpen } = useCartStore()

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
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [swapLoadingId, setSwapLoadingId] = useState<string | null>(null)
  const [isGuest, setIsGuest] = useState(false)
  const [featuredCoupon, setFeaturedCoupon] = useState<{ code: string; discountText: string } | null>(null)
  const hasFetched = useRef(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      setIsGuest(!data.session)
    })
    fetch('/api/coupons/featured')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setFeaturedCoupon(data) })
      .catch(() => {})
  }, [])

  // Sin quiz: sugerencias determinísticas según el contenido del carrito
  const relatedKey = useRef('')
  const variantsKey = items.map((i) => i.variantId).sort().join(',')
  useEffect(() => {
    if (profileId || !variantsKey || relatedKey.current === variantsKey) return
    relatedKey.current = variantsKey
    fetch(`/api/related?variants=${encodeURIComponent(variantsKey)}&limit=4`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data?.suggestions) setSuggestions(data.suggestions) })
      .catch(() => {})
  }, [profileId, variantsKey])

  useEffect(() => {
    if (!profileId || hasFetched.current) return
    hasFetched.current = true
    setKitLoading(true)
    fetch(`/api/kit/recommend?profileId=${encodeURIComponent(profileId)}`)
      .then(async (r) => {
        const data = await r.json()
        if (!r.ok) throw new Error(data.error ?? `Error ${r.status}`)
        return data as KitData
      })
      .then((data) => {
        // Si el motor no pudo resolver ningún producto, no vaciar el carrito ni
        // mostrar un kit vacío: tratar como error con opción de reintentar.
        if (!data.kit || data.kit.length === 0) {
          throw new Error('empty-kit')
        }
        setKitData(data)
        setSuggestions(data.suggestions ?? [])
        // Save to localStorage so home page can offer "resume" banner
        try {
          const totalCents = (data.kit ?? []).reduce((s, i) => s + i.priceCents, 0)
          localStorage.setItem('liora-abandoned-kit', JSON.stringify({
            profileId,
            productCount: (data.kit ?? []).length,
            totalCents,
            savedAt: Date.now(),
          }))
        } catch {}
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
            brand: item.brand,
            categoryName: item.categoryName,
            stockQuantity: item.stockQuantity,
            stepLabel: item.stepLabel,
            stepWhen: item.stepWhen,
            stepInstruction: item.stepInstruction,
          })
        }
        setIsOpen(false)
        const preview = (data.kit ?? []).slice(0, 2).map((i) => i.name).join(' + ')
        setBotThread([{
          who: 'bot',
          text: data.routineName
            ? `Hola 👋 Armé tu ${data.routineName} con ${(data.kit ?? []).length} pasos, en el orden exacto de uso. ¿Tienes alguna pregunta?`
            : `Hola 👋 Armé tu kit con ${(data.kit ?? []).length} productos.${preview ? ` Incluye ${preview}` : ''} ¿Tienes alguna pregunta?`,
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
  const shipping = sub >= freeShippingThresholdCents ? 0 : shippingCostCents
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
    router.push(profileId ? `/pagar?profileId=${encodeURIComponent(profileId)}` : '/pagar')
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
        body: JSON.stringify({
          message: userMsg,
          profileId,
          conversationId: conversationId ?? undefined,
          cart: items.map((item) => ({ variantId: item.variantId, quantity: item.quantity })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'chat_error')
      if (data.conversationId) setConversationId(data.conversationId)
      const suggestions = Array.isArray(data.suggestions) ? data.suggestions as BotSuggestion[] : []
      setBotThread([...newThread, {
        who: 'bot',
        text: data.reply ?? 'Entendido. ¿En qué más puedo ayudarte?',
        messageId: data.messageId,
        suggestions,
      }])
      trackAssistantEvent('assistant_message', { suggestions: suggestions.length })
      if (suggestions.length) trackAssistantEvent('assistant_swap_suggested', { count: suggestions.length })
    } catch {
      setBotThread([...newThread, { who: 'bot', text: 'Hubo un error. Intenta de nuevo.' }])
    } finally {
      setBotLoading(false)
    }
  }

  const acceptSwap = async (message: BotMsg, suggestion: BotSuggestion) => {
    if (!profileId || !conversationId || !message.messageId || swapLoadingId) return
    setSwapLoadingId(suggestion.id)
    try {
      const res = await fetch('/api/kit/chat/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId,
          conversationId,
          messageId: message.messageId,
          suggestionId: suggestion.id,
          quantity: suggestion.quantity,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'swap_error')
      const replacement = data.replacement as BotReplacement
      replaceItem(data.sourceVariantId, {
        variantId: replacement.variantId,
        productId: replacement.productId,
        name: replacement.name,
        brand: replacement.brand,
        variantName: replacement.variantName,
        categoryName: replacement.categoryName,
        priceCents: replacement.priceCents,
        currency: replacement.currency,
        imageUrl: replacement.imageUrl ?? undefined,
        categoryColor: replacement.categoryColor,
        stockQuantity: replacement.stockQuantity,
        stepInstruction: replacement.usageInstructions,
      })
      setBotThread((thread) => [...thread, {
        who: 'bot',
        text: `Listo, reemplacé el producto por ${replacement.name}. Revisa el nuevo total antes de pagar; si tenías un cupón, vuelve a aplicarlo.`,
      }])
      trackAssistantEvent('assistant_swap_accepted', {
        source_variant: data.sourceVariantId,
        replacement_variant: replacement.variantId,
      })
    } catch (error) {
      const messageText = error instanceof Error ? error.message : 'No pudimos hacer el cambio.'
      setBotThread((thread) => [...thread, { who: 'bot', text: messageText }])
    } finally {
      setSwapLoadingId(null)
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
      <section className="liora-cart-outer" style={{ background: 'var(--liora-crema)', padding: '32px 48px 96px' }}>
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
          <h1 className="liora-kit-title" style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 56, lineHeight: 1.1, letterSpacing: '-0.025em', color: 'var(--liora-uva)', margin: 0, fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1" }}>
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

        <div className="liora-cart-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 32, alignItems: 'flex-start' }}>

          {/* Left column ─── items + suggestions + bot */}
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--liora-uva)', marginBottom: 4 }}>
              {kitData?.routineName ?? `Tu kit (${items.length} ${items.length === 1 ? 'producto' : 'productos'})`}
            </div>
            {kitData?.routineName && (
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--liora-uva)', opacity: 0.65, marginBottom: 14 }}>
                Tu ritual paso a paso · en el orden exacto de uso
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: kitData?.routineName ? 0 : 10 }}>
              {items.map((item, idx) => {
                const hasStep = Boolean(item.stepInstruction || item.stepLabel)
                return (
                <article className="liora-cart-item" key={item.variantId} style={{ background: 'var(--liora-blanco)', borderRadius: 24, border: '1.5px solid var(--liora-arena)', padding: 20, display: 'flex', gap: 20, alignItems: 'center' }}>
                  <div className="liora-cart-item-image" style={{ position: 'relative', flexShrink: 0 }}>
                    {hasStep && (
                      <span style={{ position: 'absolute', top: -8, left: -8, zIndex: 1, width: 26, height: 26, borderRadius: 999, background: 'var(--liora-uva)', color: 'var(--liora-crema)', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {idx + 1}
                      </span>
                    )}
                    <div style={{ width: 88, height: 88, borderRadius: 18, background: item.categoryColor ?? 'var(--cat-lavanda)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {item.imageUrl
                        ? <img src={item.imageUrl} alt={item.name} style={{ width: '90%', height: '90%', objectFit: 'contain' }} />
                        : <Package size={32} style={{ opacity: 0.4, color: 'var(--liora-uva)' }} />
                      }
                    </div>
                  </div>
                  <div className="liora-cart-item-content" style={{ flex: 1, minWidth: 0 }}>
                    {hasStep && (
                      <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, color: 'var(--liora-uva)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
                        Paso {idx + 1}{item.stepWhen ? ` · ${item.stepWhen}` : ''}
                      </div>
                    )}
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 19, color: 'var(--liora-uva)', lineHeight: 1.15 }}>
                      {item.name}
                      {item.brand && <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, opacity: 0.6 }}> · {item.brand}</span>}
                    </div>
                    {hasStep && item.stepLabel && (
                      <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, color: 'var(--liora-uva)', opacity: 0.85, marginTop: 4 }}>{item.stepLabel}</div>
                    )}
                    {hasStep && item.stepInstruction && (
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, lineHeight: 1.45, color: 'var(--liora-uva)', opacity: 0.7, marginTop: 4 }}>{item.stepInstruction}</div>
                    )}
                    {!hasStep && (
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, opacity: 0.65, marginTop: 4 }}>{item.variantName}</div>
                    )}
                    <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 17, color: 'var(--liora-uva)', marginTop: 6 }}>{fmt(item.priceCents)}</div>
                  </div>
                  <div className="liora-cart-item-quantity" style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--liora-crema)', borderRadius: 999, padding: 4, flexShrink: 0 }}>
                    <button onClick={() => updateQuantity(item.variantId, item.quantity - 1)} style={{ width: 30, height: 30, borderRadius: 999, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--liora-uva)' }}><Minus size={14} weight="bold" /></button>
                    <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, minWidth: 22, textAlign: 'center', color: 'var(--liora-uva)' }}>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.variantId, item.quantity + 1)} style={{ width: 30, height: 30, borderRadius: 999, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--liora-uva)' }}><Plus size={14} weight="bold" /></button>
                  </div>
                  <button className="liora-cart-item-remove" onClick={() => removeItem(item.variantId)} aria-label={`Quitar ${item.name}`} style={{ background: 'transparent', border: 'none', cursor: 'pointer', opacity: 0.5, padding: 4, color: 'var(--liora-uva)', flexShrink: 0 }}>
                    <X size={20} />
                  </button>
                </article>
                )
              })}
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
                <div className="liora-kit-suggestions" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                  {suggestions.map((s) => {
                    const inCart = items.some((i) => i.variantId === s.variantId)
                    return (
                      <article className="liora-kit-suggestion-card" key={s.variantId} style={{ background: s.categoryColor, borderRadius: 20, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ aspectRatio: '1 / 1', borderRadius: 16, background: 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--liora-uva)' }}>
                          {s.imageUrl
                            ? <img src={s.imageUrl} alt={s.name} style={{ width: '85%', height: '85%', objectFit: 'contain' }} />
                            : <Package size={36} style={{ opacity: 0.6 }} />
                          }
                        </div>
                        <div>
                          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--liora-uva)', lineHeight: 1.15 }}>{s.name}</div>
                          <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--liora-uva)', opacity: 0.65, marginTop: 3 }}>{s.brand ? `${s.brand} · ` : ''}{s.variantName}</div>
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
            <div className="liora-cart-assistant" style={{ marginTop: 36, background: 'var(--liora-uva)', borderRadius: 28, overflow: 'hidden' }}>
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
                      <div key={i} className="liora-bot-message" style={{ alignSelf: m.who === 'bot' ? 'flex-start' : 'flex-end', maxWidth: m.suggestions?.length ? '96%' : '78%' }}>
                        <div style={{ background: m.who === 'bot' ? 'rgba(251,241,226,0.08)' : 'var(--liora-lima)', color: m.who === 'bot' ? 'var(--liora-crema)' : 'var(--liora-uva)', padding: '12px 18px', borderRadius: 18, fontFamily: 'var(--font-body)', fontSize: 15, lineHeight: 1.4, border: m.who === 'bot' ? '1.5px solid rgba(251,241,226,0.15)' : 'none' }}>
                          {m.text}
                        </div>
                        {m.suggestions && m.suggestions.length > 0 && (
                          <div className="liora-bot-suggestions" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10, marginTop: 12 }}>
                            {m.suggestions.map((suggestion) => {
                              const sourceStillInCart = items.some((item) => item.variantId === suggestion.sourceVariantId)
                              return (
                                <article key={suggestion.id} style={{ minWidth: 0, background: 'var(--liora-crema)', color: 'var(--liora-uva)', borderRadius: 18, padding: 12, display: 'flex', flexDirection: 'column', gap: 9 }}>
                                  <div style={{ height: 92, borderRadius: 13, background: suggestion.replacement.categoryColor, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                    {suggestion.replacement.imageUrl
                                      ? <img src={suggestion.replacement.imageUrl} alt={suggestion.replacement.name} style={{ width: '82%', height: '82%', objectFit: 'contain' }} />
                                      : <Package size={30} style={{ opacity: 0.5 }} />}
                                  </div>
                                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, lineHeight: 1.15, overflowWrap: 'anywhere' }}>{suggestion.replacement.name}</div>
                                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, opacity: 0.72, lineHeight: 1.35 }}>{suggestion.reason}</div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', marginTop: 'auto' }}>
                                    <strong style={{ fontFamily: 'var(--font-body)', fontSize: 15 }}>{fmt(suggestion.replacement.priceCents)}</strong>
                                    {suggestion.savingsCents > 0 && <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700 }}>−{fmt(suggestion.savingsCents)}</span>}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => acceptSwap(m, suggestion)}
                                    disabled={!sourceStillInCart || Boolean(swapLoadingId)}
                                    style={{ border: 'none', borderRadius: 999, minHeight: 40, padding: '9px 12px', background: sourceStillInCart ? 'var(--liora-uva)' : 'var(--liora-arena)', color: sourceStillInCart ? 'var(--liora-crema)' : 'var(--liora-uva)', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 12, cursor: sourceStillInCart ? 'pointer' : 'default' }}
                                  >
                                    {swapLoadingId === suggestion.id ? 'Cambiando…' : sourceStillInCart ? 'Reemplazar' : 'Reemplazado'}
                                  </button>
                                </article>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                    {botLoading && (
                      <div style={{ alignSelf: 'flex-start', background: 'rgba(251,241,226,0.08)', border: '1.5px solid rgba(251,241,226,0.15)', padding: '12px 18px', borderRadius: 18, fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--liora-crema)', opacity: 0.6 }}>
                        …
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                  <div className="liora-bot-input-row" style={{ padding: '16px 20px', borderTop: '1.5px solid rgba(251,241,226,0.12)', display: 'flex', gap: 10, alignItems: 'center' }}>
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
          <aside className="liora-cart-summary" style={{ background: 'var(--liora-uva)', color: 'var(--liora-crema)', borderRadius: 28, padding: 28, position: 'sticky', top: 100 }}>
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
                : <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, opacity: 0.65, marginTop: 8, margin: '8px 0 0' }}>Prueba <strong>{featuredCoupon?.code ?? 'BIENVENIDA10'}</strong></p>
              }
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 20, marginTop: 20, borderTop: '1.5px solid rgba(251,241,226,0.15)', fontFamily: 'var(--font-body)', fontSize: 13 }}>
              <SumRow label="Subtotal" value={fmt(sub)} />
              {discount > 0 && <SumRow label="Descuento" value={`−${fmt(discount)}`} accent />}
              <SumRow label="Envío" value={shipping === 0 ? 'Gratis' : fmt(shipping)} />
            </div>

            {/* Banner conversión guest → cuenta */}
            {isGuest && featuredCoupon && !appliedCouponCode && (
              <div style={{ marginTop: 20, background: 'rgba(201,240,72,0.12)', border: '1.5px solid var(--liora-lima)', borderRadius: 16, padding: '14px 16px' }}>
                <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 12, color: 'var(--liora-lima)', marginBottom: 4 }}>
                  🎁 {featuredCoupon.discountText} para ti
                </div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--liora-crema)', opacity: 0.8, lineHeight: 1.4, marginBottom: 10 }}>
                  Crea tu cuenta gratis y aplica el descuento en esta compra.
                </div>
                <Link
                  href={`/login?next=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/carrito')}`}
                  style={{ display: 'block', textAlign: 'center', background: 'var(--liora-lima)', color: 'var(--liora-uva)', borderRadius: 999, padding: '9px 16px', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}
                >
                  Registrarme y ahorrar {featuredCoupon.discountText} →
                </Link>
              </div>
            )}

            <button onClick={goCheckout} style={{ width: '100%', background: 'var(--liora-lima)', color: 'var(--liora-uva)', border: 'none', borderRadius: 999, padding: '16px 24px', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 16, cursor: 'pointer', marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
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
    <div className="liora-cart-outer" style={{ background: 'var(--liora-crema)', padding: '40px 48px 96px', maxWidth: 1200, margin: '0 auto' }}>
      <h1 className="liora-page-title" style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 56, lineHeight: 1, color: 'var(--liora-uva)', margin: '0 0 40px', fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1" }}>
        Tu carrito · <span style={{ fontFamily: 'var(--font-script)' }}>{items.reduce((s, i) => s + i.quantity, 0)} productos</span>
      </h1>

      <div className="liora-cart-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 32, alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {items.map((item) => (
            <article className="liora-cart-item" key={item.variantId} style={{ background: 'var(--liora-blanco)', borderRadius: 24, border: '1.5px solid var(--liora-arena)', padding: 20, display: 'flex', gap: 20, alignItems: 'center' }}>
              <div className="liora-cart-item-image" style={{ width: 88, height: 88, borderRadius: 18, background: item.categoryColor ?? 'var(--cat-lavanda)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                {item.imageUrl ? <img src={item.imageUrl} alt={item.name} style={{ width: '90%', height: '90%', objectFit: 'contain' }} /> : <ShoppingBag size={32} style={{ opacity: 0.4, color: 'var(--liora-uva)' }} />}
              </div>
              <div className="liora-cart-item-content" style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 19, color: 'var(--liora-uva)', lineHeight: 1.15 }}>{item.name}</div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, opacity: 0.65, marginTop: 4 }}>{item.variantName}</div>
                <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 17, color: 'var(--liora-uva)', marginTop: 6 }}>{fmt(item.priceCents)}</div>
              </div>
              <div className="liora-cart-item-quantity" style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--liora-crema)', borderRadius: 999, padding: 4 }}>
                <button onClick={() => updateQuantity(item.variantId, item.quantity - 1)} style={{ width: 30, height: 30, borderRadius: 999, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={14} weight="bold" /></button>
                <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, minWidth: 22, textAlign: 'center' }}>{item.quantity}</span>
                <button onClick={() => updateQuantity(item.variantId, item.quantity + 1)} style={{ width: 30, height: 30, borderRadius: 999, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={14} weight="bold" /></button>
              </div>
              <button className="liora-cart-item-remove" onClick={() => removeItem(item.variantId)} aria-label={`Quitar ${item.name}`} style={{ background: 'transparent', border: 'none', cursor: 'pointer', opacity: 0.5, padding: 4 }}><X size={20} /></button>
            </article>
          ))}

          {/* Sugerencias determinísticas en carrusel horizontal */}
          {suggestions.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 14 }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, color: 'var(--liora-uva)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>Antes de pagar</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: 'var(--liora-uva)' }}>Completa tu pedido</div>
                </div>
                <Link href="/tienda" style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, color: 'var(--liora-uva)', borderBottom: '1.5px solid var(--liora-uva)', paddingBottom: 1, whiteSpace: 'nowrap', textDecoration: 'none' }}>
                  Ver más
                </Link>
              </div>
              <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8, scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}>
                {suggestions.map((s) => {
                  const inCart = items.some((i) => i.variantId === s.variantId)
                  return (
                    <article key={s.variantId} style={{ flex: '0 0 200px', width: 200, scrollSnapAlign: 'start', background: s.categoryColor, borderRadius: 20, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ aspectRatio: '1 / 1', borderRadius: 14, background: 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--liora-uva)', overflow: 'hidden' }}>
                        {s.imageUrl
                          ? <img src={s.imageUrl} alt={s.name} style={{ width: '85%', height: '85%', objectFit: 'contain' }} />
                          : <Package size={32} style={{ opacity: 0.6 }} />
                        }
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--liora-uva)', lineHeight: 1.15, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{s.name}</div>
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--liora-uva)', opacity: 0.65, marginTop: 3 }}>{s.variantName}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15, color: 'var(--liora-uva)' }}>{fmt(s.priceCents)}</span>
                        <button
                          onClick={() => !inCart && addSuggestion(s)}
                          disabled={inCart}
                          style={{ background: inCart ? 'rgba(61,26,58,0.25)' : 'var(--liora-uva)', color: 'var(--liora-crema)', border: 'none', borderRadius: 999, padding: '8px 14px', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 12, cursor: inCart ? 'default' : 'pointer', whiteSpace: 'nowrap' }}
                        >
                          {inCart ? 'Agregado ✓' : 'Agregar'}
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <aside className="liora-cart-summary" style={{ background: 'var(--liora-uva)', color: 'var(--liora-crema)', borderRadius: 28, padding: 28, position: 'sticky', top: 100 }}>
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
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, opacity: 0.6, textAlign: 'center', marginTop: 14 }}>Prueba <strong>{featuredCoupon?.code ?? 'BIENVENIDA10'}</strong> para −15%</p>
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
