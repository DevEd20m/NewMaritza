'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckCircle, Copy, Check, ArrowRight, WhatsappLogo } from '@phosphor-icons/react'
import { useCartStore } from '@/lib/store/cart'
import { trackPurchase } from '@/lib/analytics/events'
import { detectKitFromItems, type KitGuide } from '@/lib/guides'

interface Order {
  id: string
  order_number: string
  total_cents: number
  currency: string
  status: string
  order_items: { product_name_snapshot: string; variant_name_snapshot: string; quantity: number; unit_price_cents: number }[]
}

const WHATSAPP_NUMBER = '51999999999'

export function SuccessClient({ order }: { order: Order }) {
  const { clearCart } = useCartStore()
  const [copied, setCopied] = useState(false)
  const [guide, setGuide] = useState<KitGuide | null>(null)

  useEffect(() => {
    clearCart()
    trackPurchase({
      orderNumber: order.order_number,
      totalCents: order.total_cents,
      currency: order.currency,
      items: order.order_items.map((i) => ({
        variantId: '',
        name: i.product_name_snapshot,
        priceCents: i.unit_price_cents,
        quantity: i.quantity,
      })),
    })
    const detectedGuide = detectKitFromItems(order.order_items.map(i => i.product_name_snapshot))
    if (detectedGuide) setGuide(detectedGuide)
  }, []) // eslint-disable-line

  const copyCode = async () => {
    await navigator.clipboard.writeText(order.order_number)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const fmt = (cents: number) => `S/${(cents / 100).toFixed(0)}`

  const waText = guide
    ? `Hola, acabo de comprar el ${guide.kitName} (pedido #${order.order_number}) y tengo una pregunta`
    : `Hola, acabo de comprar (pedido #${order.order_number}) y tengo una pregunta`
  const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(waText)}`

  return (
    <div style={{ background: 'var(--liora-crema)', padding: '64px 48px 96px', maxWidth: 760, margin: '0 auto' }}>

      {/* ── Confirmación ──────────────────────────────────────────────── */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{ width: 80, height: 80, borderRadius: 999, background: 'var(--color-success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px' }}>
          <CheckCircle size={48} weight="fill" style={{ color: 'var(--color-success)' }} />
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 52, lineHeight: 1, color: 'var(--liora-uva)', margin: '0 0 16px', fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1" }}>
          ¡Pedido confirmado!
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 17, lineHeight: 1.5, color: 'var(--liora-uva)', opacity: 0.8, marginBottom: 0, maxWidth: 500, marginLeft: 'auto', marginRight: 'auto' }}>
          Gracias por tu compra. Recibirás tu pedido en <strong>36–48h en Lima</strong>.
        </p>
      </div>

      {/* ── Número de pedido ──────────────────────────────────────────── */}
      <div style={{ background: 'var(--liora-uva)', borderRadius: 24, padding: '24px 28px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--liora-lima)', marginBottom: 5 }}>
            Número de pedido
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, color: 'var(--liora-crema)', letterSpacing: '-0.01em' }}>
            {order.order_number}
          </div>
        </div>
        <button
          onClick={copyCode}
          style={{ background: 'var(--liora-lima)', color: 'var(--liora-uva)', border: 'none', borderRadius: 999, padding: '11px 18px', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}
        >
          {copied ? <><Check size={16} weight="bold" /> Copiado</> : <><Copy size={16} weight="bold" /> Copiar</>}
        </button>
      </div>

      {/* ── Resumen del pedido ────────────────────────────────────────── */}
      <div style={{ background: 'var(--liora-blanco)', borderRadius: 20, border: '1.5px solid var(--liora-arena)', padding: '20px 24px', marginBottom: 40 }}>
        <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 12, opacity: 0.6, marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Resumen del pedido
        </div>
        {order.order_items.map((item, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-body)', fontSize: 14, padding: '8px 0', borderBottom: i < order.order_items.length - 1 ? '1px solid var(--liora-arena)' : 'none' }}>
            <span style={{ color: 'var(--liora-uva)' }}>{item.quantity}× {item.product_name_snapshot}</span>
            <span style={{ fontWeight: 600, color: 'var(--liora-uva)' }}>{fmt(item.unit_price_cents * item.quantity)}</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, marginTop: 14, paddingTop: 12, borderTop: '1.5px solid var(--liora-arena)' }}>
          <span>Total</span>
          <span>{fmt(order.total_cents)}</span>
        </div>
      </div>

      {/* ── Guía de uso (si se detectó el kit) ────────────────────────── */}
      {guide && (
        <div style={{ marginBottom: 40 }}>
          {/* Header guía */}
          <div style={{ background: guide.color, borderRadius: '24px 24px 0 0', padding: '28px 32px 24px' }}>
            <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.13em', color: 'var(--liora-uva)', opacity: 0.65, marginBottom: 8 }}>
              Tu guía de uso
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, color: 'var(--liora-uva)', lineHeight: 1.05, fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1" }}>
              {guide.kitName}
            </div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--liora-uva)', opacity: 0.75, margin: '8px 0 0', fontStyle: 'italic' }}>
              "{guide.tagline}"
            </p>
          </div>

          {/* Rutina del día */}
          <div style={{ background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-arena)', borderTop: 'none', padding: '24px 28px' }}>
            <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--liora-uva)', opacity: 0.55, marginBottom: 18 }}>
              Empieza así — tu rutina del día
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {guide.schedule.map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 14, background: guide.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20, flexShrink: 0,
                  }}>
                    {s.emoji}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--liora-uva)', opacity: 0.5, marginBottom: 3 }}>
                      {s.time}
                    </div>
                    <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13, color: 'var(--liora-uva)', marginBottom: 3 }}>
                      {s.products.join(' + ')}
                    </div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--liora-uva)', opacity: 0.65, lineHeight: 1.45 }}>
                      💡 {s.tip}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Primer tip */}
          {guide.tips[0] && (
            <div style={{
              background: '#fffde7', border: '1.5px solid var(--liora-arena)', borderTop: 'none',
              padding: '16px 28px', display: 'flex', gap: 12, alignItems: 'flex-start',
            }}>
              <span style={{ fontSize: 20 }}>{guide.tips[0].emoji}</span>
              <div>
                <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13, color: 'var(--liora-uva)', marginBottom: 2 }}>
                  {guide.tips[0].title}
                </div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--liora-uva)', opacity: 0.75, lineHeight: 1.45 }}>
                  {guide.tips[0].body}
                </div>
              </div>
            </div>
          )}

          {/* CTA guía completa */}
          <div style={{
            background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-arena)',
            borderTop: 'none', borderRadius: '0 0 24px 24px',
            padding: '20px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16,
          }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--liora-uva)', opacity: 0.65, margin: 0 }}>
              Consejos avanzados, recetas y FAQs en la guía completa.
            </p>
            <Link href={`/guia/${guide.slug}`} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'var(--liora-uva)', color: 'var(--liora-crema)',
              borderRadius: 999, padding: '10px 18px',
              fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13,
              textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0,
            }}>
              Ver guía completa <ArrowRight size={13} weight="bold" />
            </Link>
          </div>
        </div>
      )}

      {/* ── WhatsApp ──────────────────────────────────────────────────── */}
      <div style={{
        background: '#25d366', borderRadius: 20, padding: '20px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        marginBottom: 32,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <WhatsappLogo size={28} weight="fill" color="#ffffff" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, color: '#ffffff' }}>
              ¿Tienes dudas sobre tu kit?
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>
              Te respondemos en minutos por WhatsApp.
            </div>
          </div>
        </div>
        <a href={waUrl} target="_blank" rel="noopener" style={{
          background: '#ffffff', color: '#25d366',
          borderRadius: 999, padding: '10px 18px',
          fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13,
          textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0,
        }}>
          Escribir →
        </a>
      </div>

      {/* ── Acciones ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link href={`/tracking?order=${order.order_number}`} style={{
          background: 'var(--liora-uva)', color: 'var(--liora-crema)',
          borderRadius: 999, padding: '14px 28px',
          fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 15,
          textDecoration: 'none',
        }}>
          Rastrear pedido
        </Link>
        <Link href="/tienda" style={{
          background: 'transparent', color: 'var(--liora-uva)',
          border: '1.5px solid var(--liora-uva)',
          borderRadius: 999, padding: '14px 24px',
          fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 15,
          textDecoration: 'none',
        }}>
          Seguir comprando
        </Link>
      </div>

    </div>
  )
}
