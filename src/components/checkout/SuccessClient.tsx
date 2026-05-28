'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckCircle, Copy, Check } from '@phosphor-icons/react'
import { useCartStore } from '@/lib/store/cart'
import { trackPurchase } from '@/lib/analytics/events'

interface Order {
  id: string
  order_number: string
  total_cents: number
  currency: string
  status: string
  order_items: { product_name_snapshot: string; variant_name_snapshot: string; quantity: number; unit_price_cents: number }[]
}

export function SuccessClient({ order }: { order: Order }) {
  const { clearCart } = useCartStore()
  const [copied, setCopied] = useState(false)

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
  }, []) // eslint-disable-line

  const copyCode = async () => {
    await navigator.clipboard.writeText(order.order_number)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const fmt = (cents: number) => `S/${(cents / 100).toFixed(0)}`

  return (
    <div style={{ background: 'var(--liora-crema)', padding: '64px 48px 96px', maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
      {/* Icon */}
      <div style={{ width: 80, height: 80, borderRadius: 999, background: 'var(--color-success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px' }}>
        <CheckCircle size={48} weight="fill" style={{ color: 'var(--color-success)' }} />
      </div>

      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 56, lineHeight: 1, color: 'var(--liora-uva)', margin: '0 0 16px', fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1" }}>
        ¡Pedido confirmado!
      </h1>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 17, lineHeight: 1.5, color: 'var(--liora-uva)', opacity: 0.8, marginBottom: 40 }}>
        Gracias por tu compra. Te enviamos un email de confirmación. Recibirás tu pedido en 36–48h en Lima.
      </p>

      {/* Order number */}
      <div style={{ background: 'var(--liora-uva)', borderRadius: 24, padding: '28px 32px', marginBottom: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--liora-lima)', marginBottom: 6 }}>Número de pedido</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 36, color: 'var(--liora-crema)', letterSpacing: '-0.01em' }}>{order.order_number}</div>
        </div>
        <button
          onClick={copyCode}
          style={{ background: 'var(--liora-lima)', color: 'var(--liora-uva)', border: 'none', borderRadius: 999, padding: '12px 20px', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}
        >
          {copied ? <><Check size={16} weight="bold" /> Copiado</> : <><Copy size={16} weight="bold" /> Copiar</>}
        </button>
      </div>

      {/* Items summary */}
      <div style={{ background: 'var(--liora-blanco)', borderRadius: 24, border: '1.5px solid var(--liora-arena)', padding: 24, marginBottom: 32, textAlign: 'left' }}>
        <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13, marginBottom: 16, opacity: 0.7 }}>Resumen del pedido</div>
        {order.order_items.map((item, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-body)', fontSize: 15, padding: '8px 0', borderBottom: i < order.order_items.length - 1 ? '1px solid var(--liora-arena)' : 'none' }}>
            <span>{item.quantity}× {item.product_name_snapshot}</span>
            <span style={{ fontWeight: 600 }}>{fmt(item.unit_price_cents * item.quantity)}</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, marginTop: 16, paddingTop: 12, borderTop: '1.5px solid var(--liora-arena)' }}>
          <span>Total</span>
          <span>{fmt(order.total_cents)}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
        <Link href={`/tracking?order=${order.order_number}`} style={{ background: 'var(--liora-uva)', color: 'var(--liora-crema)', borderRadius: 999, padding: '16px 32px', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 16 }}>
          Rastrear pedido
        </Link>
        <Link href="/tienda" style={{ background: 'transparent', color: 'var(--liora-uva)', border: '1.5px solid var(--liora-uva)', borderRadius: 999, padding: '16px 28px', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 16 }}>
          Seguir comprando
        </Link>
      </div>
    </div>
  )
}
