import { AdminShell } from '@/components/admin/AdminShell'
import { verifyAdminPage } from '@/lib/auth/guards'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const principal = await verifyAdminPage()
  const adminName = principal.firstName ?? principal.email?.split('@')[0] ?? 'Admin'

  return <AdminShell adminName={adminName}>{children}</AdminShell>
}
