import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getStoreSettings } from '@/lib/settings'
import { AyudaClient } from '@/components/ayuda/AyudaClient'

export const metadata: Metadata = {
  title: 'Centro de ayuda | LIORA',
  description: 'Centro de ayuda LIORA. Encuentra respuestas sobre envíos, pagos, seguimiento, devoluciones, kits personalizados y cuestionario de autocuidado.',
}

export default async function AyudaPage() {
  const supabase = await createClient()
  const [settings, { data: { user } }] = await Promise.all([
    getStoreSettings(),
    supabase.auth.getUser(),
  ])
  return (
    <AyudaClient
      whatsappNumber={settings.whatsapp_number}
      deliveryTime={settings.delivery_message}
      shippingCostCents={settings.shipping_cost_cents}
      freeShippingThresholdCents={settings.free_shipping_threshold_cents}
      isLoggedIn={!!user}
    />
  )
}
