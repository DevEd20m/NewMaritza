import { AnnouncementBar } from '@/components/layout/AnnouncementBar'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { CartDrawer } from '@/components/layout/CartDrawer'
import { createClient } from '@/lib/supabase/server'

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

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
      <AnnouncementBar />
      <Header user={profile} />
      <main style={{ flex: 1 }}>{children}</main>
      <Footer />
      <CartDrawer />
    </>
  )
}
