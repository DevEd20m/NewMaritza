import { createAdminClient } from '@/lib/supabase/admin'
import type { Metadata } from 'next'
import { PedidosClient, type AdminOrderData } from '@/components/admin/PedidosClient'

export const metadata: Metadata = { title: 'Pedidos — Admin LIORA' }

export default async function AdminOrdersPage() {
  const admin = createAdminClient()

  const { data: ordersRaw } = await (admin as any)
    .from('orders')
    .select(`
      id, order_number, guest_email, guest_name, guest_phone, user_id,
      status, total_cents, subtotal_cents, discount_cents, created_at,
      order_items(id, product_name_snapshot, variant_name_snapshot, quantity, unit_price_cents),
      addresses!shipping_address_id(first_name, last_name, phone, address_line1, address_line2, district, city)
    `)
    .order('created_at', { ascending: false })
    .limit(200)

  const ordersRaw2 = (ordersRaw ?? []) as Array<{
    id: string; order_number: string; guest_email: string | null; guest_name: string | null
    guest_phone: string | null; user_id: string | null; status: string
    total_cents: number; subtotal_cents: number; discount_cents: number; created_at: string
    order_items: Array<{ id: string; product_name_snapshot: string; variant_name_snapshot: string; quantity: number; unit_price_cents: number }>
    addresses: { first_name: string; last_name: string; phone: string | null; address_line1: string; address_line2: string | null; district: string | null; city: string } | null
  }>

  const orders: AdminOrderData[] = ordersRaw2.map(o => ({
    id: o.id,
    order_number: o.order_number,
    guest_name: o.guest_name,
    guest_email: o.guest_email,
    guest_phone: o.guest_phone,
    user_id: o.user_id,
    profile_first_name: null,
    profile_last_name: null,
    status: o.status,
    total_cents: o.total_cents,
    subtotal_cents: o.subtotal_cents,
    discount_cents: o.discount_cents,
    created_at: o.created_at,
    items: o.order_items ?? [],
    address: o.addresses ?? null,
  }))

  const totalRevenue = orders
    .filter(o => o.status !== 'cancelled' && o.status !== 'refunded')
    .reduce((s, o) => s + o.total_cents, 0)

  return <PedidosClient orders={orders} totalRevenue={totalRevenue} />
}
