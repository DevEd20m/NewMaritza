'use client'
import Link from 'next/link'
import { X, Minus, Plus, ShoppingBag } from '@phosphor-icons/react'
import { useCartStore } from '@/lib/store/cart'

export function CartDrawer() {
  const { isOpen, setIsOpen, items, removeItem, updateQuantity, subtotalCents, totalCents, discountCents, appliedCouponCode } = useCartStore()

  const sub = subtotalCents()
  const total = totalCents()
  const shipping = sub >= 15000 ? 0 : 1500

  if (!isOpen) return null

  const formatPrice = (cents: number) => `S/${(cents / 100).toFixed(0)}`

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => setIsOpen(false)}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(61,26,58,0.4)',
          zIndex: 100, backdropFilter: 'blur(2px)',
        }}
      />

      {/* Drawer */}
      <aside
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, width: 420,
          background: 'var(--liora-crema)', zIndex: 101,
          display: 'flex', flexDirection: 'column',
          boxShadow: 'var(--shadow-3)',
        }}
      >
        {/* Header */}
        <div style={{ padding: '24px 28px', borderBottom: '1.5px solid var(--liora-arena)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, color: 'var(--liora-uva)' }}>Tu carrito</div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--liora-uva)', opacity: 0.65 }}>{items.length} productos</div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--liora-uva)', padding: 8 }}
            aria-label="Cerrar carrito"
          >
            <X size={24} weight="bold" />
          </button>
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <ShoppingBag size={48} style={{ color: 'var(--liora-arena)', margin: '0 auto 16px' }} />
              <p style={{ fontFamily: 'var(--font-body)', color: 'var(--liora-uva)', opacity: 0.6 }}>Tu carrito está vacío</p>
              <Link
                href="/tienda"
                onClick={() => setIsOpen(false)}
                style={{
                  display: 'inline-block', marginTop: 16,
                  background: 'var(--liora-uva)', color: 'var(--liora-crema)',
                  borderRadius: 999, padding: '12px 24px',
                  fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14,
                }}
              >
                Ir a la tienda
              </Link>
            </div>
          ) : (
            items.map((item) => (
              <article
                key={item.variantId}
                style={{
                  background: 'var(--liora-blanco)',
                  borderRadius: 18, border: '1.5px solid var(--liora-arena)',
                  padding: 16, display: 'flex', gap: 14, alignItems: 'center',
                }}
              >
                {/* Image / color swatch */}
                <div style={{ width: 72, height: 72, borderRadius: 14, background: item.categoryColor ?? 'var(--cat-lavanda)', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {item.imageUrl
                    ? <img src={item.imageUrl} alt={item.name} style={{ width: '90%', height: '90%', objectFit: 'contain' }} />
                    : <ShoppingBag size={28} style={{ color: 'var(--liora-uva)', opacity: 0.4 }} />
                  }
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--liora-uva)', lineHeight: 1.2 }}>{item.name}</div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, opacity: 0.65, marginTop: 2 }}>{item.variantName}</div>
                  <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15, marginTop: 6, color: 'var(--liora-uva)' }}>{formatPrice(item.priceCents)}</div>
                </div>

                {/* Qty controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: 'var(--liora-crema)', borderRadius: 999, padding: 4 }}>
                  <button onClick={() => updateQuantity(item.variantId, item.quantity - 1)} style={{ width: 28, height: 28, borderRadius: 999, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Minus size={14} weight="bold" />
                  </button>
                  <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13, minWidth: 20, textAlign: 'center' }}>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.variantId, item.quantity + 1)} style={{ width: 28, height: 28, borderRadius: 999, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Plus size={14} weight="bold" />
                  </button>
                </div>

                <button onClick={() => removeItem(item.variantId)} aria-label="Quitar" style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5, padding: 4 }}>
                  <X size={18} />
                </button>
              </article>
            ))
          )}
        </div>

        {/* Summary */}
        {items.length > 0 && (
          <div style={{ padding: '20px 28px', borderTop: '1.5px solid var(--liora-arena)', background: 'var(--liora-blanco)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16, fontFamily: 'var(--font-body)', fontSize: 14 }}>
              <SumRow label="Subtotal" value={formatPrice(sub)} />
              {discountCents > 0 && <SumRow label={`Cupón ${appliedCouponCode}`} value={`−${formatPrice(discountCents)}`} accent />}
              <SumRow label="Envío" value={shipping === 0 ? 'Gratis' : formatPrice(shipping)} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: 12, borderTop: '1.5px solid var(--liora-arena)', marginBottom: 16 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--liora-uva)' }}>Total</span>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, color: 'var(--liora-uva)' }}>{formatPrice(total + shipping)}</span>
            </div>

            <Link
              href="/carrito"
              onClick={() => setIsOpen(false)}
              style={{
                display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8,
                background: 'var(--liora-uva)', color: 'var(--liora-crema)',
                borderRadius: 999, padding: '16px 24px', width: '100%',
                fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 16,
              }}
            >
              Ver carrito y pagar
            </Link>
          </div>
        )}
      </aside>
    </>
  )
}

function SumRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ opacity: 0.75 }}>{label}</span>
      <span style={{ fontWeight: 700, color: accent ? 'var(--liora-lima-deep)' : 'var(--liora-uva)' }}>{value}</span>
    </div>
  )
}
