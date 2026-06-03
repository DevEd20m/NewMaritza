import { AnnouncementBar } from '@/components/layout/AnnouncementBar'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { CartDrawer } from '@/components/layout/CartDrawer'
import { LiveActivityToast } from '@/components/urgency/LiveActivityToast'
import { ExitIntentModal } from '@/components/urgency/ExitIntentModal'
import { WhatsAppButton } from '@/components/layout/WhatsAppButton'
import { createClient } from '@/lib/supabase/server'
import { getStoreSettings } from '@/lib/settings'

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const [authResult, settings] = await Promise.all([
    supabase.auth.getUser().catch(() => ({ data: { user: null } })),
    getStoreSettings(),
  ])
  const user = authResult.data.user

  let profile = null
  if (user) {
    const { data } = await supabase.from('profiles').select('first_name').eq('id', user.id).single()
    const profileData = data as { first_name: string | null } | null
    if (profileData?.first_name) {
      profile = { name: profileData.first_name, initial: profileData.first_name[0].toUpperCase() }
    }
  }

  return (
    <>
      <AnnouncementBar
        thresholdCents={settings.free_shipping_threshold_cents}
        deliveryMessage={settings.delivery_message}
      />
      <Header user={profile} />
      <main style={{ flex: 1 }}>{children}</main>
      <Footer />
      <CartDrawer
        shippingThresholdCents={settings.free_shipping_threshold_cents}
        shippingCostCents={settings.shipping_cost_cents}
      />
      <LiveActivityToast />
      <ExitIntentModal />
      <WhatsAppButton number={settings.whatsapp_number} />
    </>
  )
}
