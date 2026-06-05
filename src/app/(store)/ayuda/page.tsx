import type { Metadata } from 'next'
import { getStoreSettings } from '@/lib/settings'
import { AyudaClient } from '@/components/ayuda/AyudaClient'

export const metadata: Metadata = { title: 'Centro de ayuda | LIORA' }

export default async function AyudaPage() {
  const settings = await getStoreSettings()
  return (
    <AyudaClient
      whatsappNumber={settings.whatsapp_number}
      deliveryTime={settings.delivery_message}
      shippingCostCents={settings.shipping_cost_cents}
    />
  )
}
