import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getStoreSettings } from '@/lib/settings'
import { CartPageClient } from '@/components/cart/CartPageClient'

export const metadata: Metadata = { title: 'Tu carrito', robots: { index: false, follow: false } }

export default async function CartPage() {
  const settings = await getStoreSettings()
  return (
    <Suspense>
      <CartPageClient
        shippingCostCents={settings.shipping_cost_cents}
        freeShippingThresholdCents={settings.free_shipping_threshold_cents}
      />
    </Suspense>
  )
}
