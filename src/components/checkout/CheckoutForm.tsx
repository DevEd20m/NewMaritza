'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Lock, User, UserSwitch } from '@phosphor-icons/react'
import { checkoutSchema, type CheckoutFormData } from '@/lib/validation/checkout'
import { useCartStore } from '@/lib/store/cart'
import { trackBeginCheckout } from '@/lib/analytics/events'

export interface PrefillData {
  isLoggedIn: boolean
  email: string
  firstName: string
  lastName: string
  phone: string
  addressLine1: string
  city: string
  district: string
  postalCode: string
}


export function CheckoutForm({ prefill }: { prefill: PrefillData | null }) {
  const router = useRouter()
  const { items, subtotalCents, totalCents, discountCents, appliedCouponCode, sessionToken, clearCart } = useCartStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [forSelf, setForSelf] = useState(true)
  const [saveToProfile, setSaveToProfile] = useState(true)
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null)

  const sub = subtotalCents()
  const discount = discountCents
  const shipping = sub >= 15000 ? 0 : 1500
  const total = totalCents() + shipping
  const fmt = (cents: number) => `S/${(cents / 100).toFixed(0)}`

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { address: { country: 'PE' }, paymentMethod: 'card' },
  })

  // Pre-fill when "para mí" is active and we have profile data
  useEffect(() => {
    if (forSelf && prefill?.isLoggedIn) {
      reset({
        address: {
          email: prefill.email,
          firstName: prefill.firstName,
          lastName: prefill.lastName,
          phone: prefill.phone,
          addressLine1: prefill.addressLine1,
          city: prefill.city,
          district: prefill.district,
          postalCode: prefill.postalCode,
          country: 'PE',
        },
        paymentMethod: 'card',
      })
    } else if (!forSelf) {
      reset({
        address: { country: 'PE', email: prefill?.email ?? '' },
        paymentMethod: 'card',
      })
    }
  }, [forSelf]) // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = async (data: CheckoutFormData) => {
    if (!items.length) {
      setError('Tu carrito está vacío.')
      return
    }
    setLoading(true)
    setError('')
    try {
      let orderId = pendingOrderId

      if (!orderId) {
        const orderRes = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cartSessionToken: sessionToken,
            address: data.address,
            couponCode: appliedCouponCode ?? data.couponCode,
            notes: data.notes,
            saveToProfile: forSelf && saveToProfile && !!prefill?.isLoggedIn,
            items: items.map((i) => ({
              variantId: i.variantId,
              name: i.name,
              variantName: i.variantName,
              priceCents: i.priceCents,
              currency: i.currency,
              quantity: i.quantity,
            })),
          }),
        })
        const orderData = await orderRes.json()
        if (!orderRes.ok) throw new Error(orderData.error ?? 'Error al crear el pedido')
        orderId = orderData.orderId
        setPendingOrderId(orderId)
      }

      const payRes = await fetch('/api/payment/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      })
      const payData = await payRes.json()
      if (!payRes.ok) throw new Error(payData.error ?? 'Error al iniciar el pago')

      trackBeginCheckout(total, items.map((i) => ({ variantId: i.variantId, name: i.name, priceCents: i.priceCents, quantity: i.quantity })))
      clearCart()
      setPendingOrderId(null)
      try { localStorage.removeItem('liora-abandoned-kit') } catch {}
      window.location.href = payData.redirectUrl
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', background: 'var(--liora-crema)', border: '1.5px solid var(--liora-arena)',
    borderRadius: 12, padding: '14px 16px', fontFamily: 'var(--font-body)', fontSize: 15,
    color: 'var(--liora-uva)', outline: 'none', boxSizing: 'border-box' as const,
  }
  const labelStyle = {
    fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 11,
    color: 'var(--liora-uva)', textTransform: 'uppercase' as const, letterSpacing: '0.08em',
    display: 'flex', flexDirection: 'column' as const, gap: 6,
  }
  const errorStyle = { color: 'var(--color-error)', fontSize: 12, marginTop: 4, fontFamily: 'var(--font-body)' }

  return (
    <div className="liora-checkout-outer" style={{ background: 'var(--liora-crema)', padding: '40px 48px 96px', maxWidth: 1200, margin: '0 auto' }}>
      <h1 className="liora-checkout-title" style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 56, lineHeight: 1, color: 'var(--liora-uva)', margin: '0 0 8px', fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1" }}>
        Pago seguro
      </h1>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--liora-uva)', opacity: 0.65, marginBottom: 40 }}>
        Tus datos están protegidos con cifrado SSL de 256 bits.
      </p>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="liora-checkout-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 32, alignItems: 'flex-start' }}>

          {/* Form panel */}
          <div style={{ background: 'var(--liora-blanco)', borderRadius: 28, border: '1.5px solid var(--liora-arena)', padding: 32, display: 'flex', flexDirection: 'column', gap: 28 }}>

            {/* Para mí / Para otra persona toggle — only for logged-in users */}
            {prefill?.isLoggedIn && (
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setForSelf(true)}
                  style={{ flex: 1, background: forSelf ? 'var(--liora-uva)' : 'var(--liora-crema)', color: forSelf ? 'var(--liora-crema)' : 'var(--liora-uva)', border: forSelf ? '2px solid var(--liora-uva)' : '1.5px solid var(--liora-arena)', borderRadius: 12, padding: '12px 16px', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  <User size={16} weight="bold" /> Para mí
                </button>
                <button
                  type="button"
                  onClick={() => setForSelf(false)}
                  style={{ flex: 1, background: !forSelf ? 'var(--liora-uva)' : 'var(--liora-crema)', color: !forSelf ? 'var(--liora-crema)' : 'var(--liora-uva)', border: !forSelf ? '2px solid var(--liora-uva)' : '1.5px solid var(--liora-arena)', borderRadius: 12, padding: '12px 16px', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  <UserSwitch size={16} weight="bold" /> Para otra persona
                </button>
              </div>
            )}

            {/* Contact */}
            <section>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: 'var(--liora-uva)', marginBottom: 16 }}>Contacto</h2>
              <label style={labelStyle}>
                Email
                <input {...register('address.email')} type="email" placeholder="tu@email.com" style={inputStyle} />
                {errors.address?.email && <span style={errorStyle}>{errors.address.email.message}</span>}
              </label>
            </section>

            {/* Shipping */}
            <section>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: 'var(--liora-uva)', marginBottom: 16 }}>
                {forSelf ? 'Tu dirección de envío' : 'Dirección de envío'}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <label style={labelStyle}>
                    Nombre
                    <input {...register('address.firstName')} placeholder="Nombre" style={inputStyle} />
                    {errors.address?.firstName && <span style={errorStyle}>{errors.address.firstName.message}</span>}
                  </label>
                  <label style={labelStyle}>
                    Apellido
                    <input {...register('address.lastName')} placeholder="Apellido" style={inputStyle} />
                    {errors.address?.lastName && <span style={errorStyle}>{errors.address.lastName.message}</span>}
                  </label>
                </div>
                <label style={labelStyle}>
                  Dirección
                  <input {...register('address.addressLine1')} placeholder="Av. Larco 1234, dpto 502" style={inputStyle} />
                  {errors.address?.addressLine1 && <span style={errorStyle}>{errors.address.addressLine1.message}</span>}
                </label>
                <div className="liora-checkout-3col" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 12 }}>
                  <label style={labelStyle}>
                    Ciudad
                    <input {...register('address.city')} placeholder="Lima" style={inputStyle} />
                  </label>
                  <label style={labelStyle}>
                    Distrito
                    <input {...register('address.district')} placeholder="Miraflores" style={inputStyle} />
                  </label>
                  <label style={labelStyle}>
                    CP
                    <input {...register('address.postalCode')} placeholder="15074" style={inputStyle} />
                  </label>
                </div>
                <label style={labelStyle}>
                  Teléfono (opcional)
                  <input {...register('address.phone')} placeholder="+51 999 000 000" style={inputStyle} />
                </label>
              </div>
            </section>

            {/* Save to profile — only when "para mí" and logged in */}
            {forSelf && prefill?.isLoggedIn && (
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', padding: '16px 20px', background: 'var(--liora-crema)', borderRadius: 14, border: `1.5px solid ${saveToProfile ? 'var(--liora-uva)' : 'var(--liora-arena)'}` }}>
                <input
                  type="checkbox"
                  checked={saveToProfile}
                  onChange={(e) => setSaveToProfile(e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: 'var(--liora-uva)', cursor: 'pointer', flexShrink: 0, marginTop: 2 }}
                />
                <div>
                  <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, color: 'var(--liora-uva)' }}>
                    Guardar / actualizar mis datos en Mi Cuenta
                  </div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--liora-uva)', opacity: 0.65, marginTop: 3 }}>
                    Tu nombre, teléfono y dirección quedarán guardados para la próxima compra.
                  </div>
                </div>
              </label>
            )}

            {/* Payment method */}
            <section>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: 'var(--liora-uva)', marginBottom: 16 }}>Método de pago</h2>
              <div style={{ background: 'var(--liora-crema)', border: '2px solid var(--liora-uva)', borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ fontSize: 24 }}>💳</span>
                <div>
                  <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15, color: 'var(--liora-uva)' }}>Tarjeta de crédito / débito</div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--liora-uva)', opacity: 0.6, marginTop: 2 }}>Visa · Mastercard · American Express</div>
                </div>
              </div>
              <input {...register('paymentMethod')} type="hidden" value="card" />
            </section>

            {error && <p style={{ color: 'var(--color-error)', fontSize: 14, fontFamily: 'var(--font-body)' }}>{error}</p>}
          </div>

          {/* Order summary sidebar */}
          <aside style={{ background: 'var(--liora-uva)', color: 'var(--liora-crema)', borderRadius: 28, padding: 28, position: 'sticky', top: 100 }}>
            <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, color: 'var(--liora-lima)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>
              Tu pedido · {items.reduce((s, i) => s + i.quantity, 0)} productos
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {items.map((item) => (
                <div key={item.variantId} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontFamily: 'var(--font-body)', fontSize: 14 }}>
                  <span style={{ opacity: 0.85, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.quantity}× {item.name}</span>
                  <span style={{ fontWeight: 600, flexShrink: 0 }}>{fmt(item.priceCents * item.quantity)}</span>
                </div>
              ))}
              {items.length === 0 && (
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, opacity: 0.65, margin: 0 }}>Carrito vacío</p>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 16, borderTop: '1.5px solid rgba(251,241,226,0.15)', fontFamily: 'var(--font-body)', fontSize: 13 }}>
              <SumRow label="Subtotal" value={fmt(sub)} />
              {discount > 0 && <SumRow label={`Cupón ${appliedCouponCode}`} value={`−${fmt(discount)}`} accent />}
              <SumRow label="Envío" value={shipping === 0 ? 'Gratis' : fmt(shipping)} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: 18, marginTop: 18, borderTop: '1.5px solid rgba(251,241,226,0.15)' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18 }}>Total</span>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 36 }}>{fmt(total)}</span>
            </div>

            <button
              type="submit"
              disabled={loading || items.length === 0}
              style={{ width: '100%', background: items.length === 0 ? 'rgba(195,214,0,0.4)' : 'var(--liora-lima)', color: 'var(--liora-uva)', border: 'none', borderRadius: 999, padding: '18px 24px', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 16, cursor: (loading || items.length === 0) ? 'not-allowed' : 'pointer', marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, opacity: loading ? 0.7 : 1 }}
            >
              <Lock size={18} weight="bold" />
              {loading ? 'Procesando…' : `Pagar ${fmt(total)}`}
            </button>

            <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, opacity: 0.6, textAlign: 'center', marginTop: 16 }}>
              Pago seguro con cifrado SSL · Visa · Mastercard
            </p>
          </aside>
        </div>
      </form>
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
