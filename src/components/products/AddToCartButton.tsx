'use client'
import { useState } from 'react'
import { Check } from '@phosphor-icons/react'
import { useCartStore } from '@/lib/store/cart'
import { trackAddToCart } from '@/lib/analytics/events'

interface Props {
  variantId: string
  productId: string
  name: string
  variantName: string
  priceCents: number
  currency: string
  imageUrl?: string
  categoryColor?: string
}

export function AddToCartButton({ variantId, productId, name, variantName, priceCents, currency, imageUrl, categoryColor }: Props) {
  const [added, setAdded] = useState(false)
  const { addItem } = useCartStore()

  const handleAdd = () => {
    addItem({ variantId, productId, name, variantName, priceCents, currency, imageUrl, categoryColor })
    trackAddToCart({ variantId, name, priceCents, quantity: 1, currency })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <button
      onClick={handleAdd}
      style={{
        background: added ? 'var(--color-success)' : 'var(--liora-uva)',
        color: 'var(--liora-crema)',
        border: 'none', borderRadius: 999, padding: '18px 36px',
        fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 17,
        cursor: 'pointer', width: '100%', marginTop: 28,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        transition: 'background 220ms ease',
      }}
    >
      {added ? <><Check size={20} weight="bold" /> Agregado al carrito</> : 'Agregar al carrito'}
    </button>
  )
}
