import type { Metadata } from 'next'
import { Suspense } from 'react'
import { CartPageClient } from '@/components/cart/CartPageClient'

export const metadata: Metadata = { title: 'Tu carrito', robots: { index: false, follow: false } }

export default function CartPage() {
  return (
    <Suspense>
      <CartPageClient />
    </Suspense>
  )
}
