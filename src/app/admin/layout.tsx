import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminShell } from '@/components/admin/AdminShell'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role, first_name').eq('id', user.id).single()
  const profileData = profile as { role: string | null; first_name: string | null } | null
  if (profileData?.role !== 'admin') redirect('/')

  const adminName = profileData?.first_name ?? user.email?.split('@')[0] ?? 'Admin'

  return <AdminShell adminName={adminName}>{children}</AdminShell>
}
