import { AdminShell } from '@/components/admin/AdminShell'
import { verifyAdminPage } from '@/lib/auth/guards'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

/**
 * US-004 · AC-004-05 — «sin atender» son los pedidos pagados que todavía no se han enviado.
 * `shipped` y `delivered` ya salieron; `pending_payment` todavía no es una venta.
 */
const SIN_ATENDER = ['paid', 'processing'] as const

async function pedidosSinAtender(): Promise<number> {
  try {
    const { count } = await createAdminClient()
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .in('status', SIN_ATENDER)
    return count ?? 0
  } catch {
    // El recuento es informativo: si falla, el panel sigue siendo utilizable.
    return 0
  }
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const principal = await verifyAdminPage()
  const adminName = principal.firstName ?? principal.email?.split('@')[0] ?? 'Admin'
  const sinAtender = await pedidosSinAtender()

  return <AdminShell adminName={adminName} sinAtender={sinAtender}>{children}</AdminShell>
}
