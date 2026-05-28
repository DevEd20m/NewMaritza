import type { Metadata } from 'next'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { SuccessClient } from '@/components/checkout/SuccessClient'

export const metadata: Metadata = { title: 'Pedido confirmado', robots: { index: false, follow: false } }

interface Props { searchParams: Promise<{ order?: string; session_id?: string }> }

async function getOrder(orderNumber: string) {
  const admin = createAdminClient()
  const { data } = await admin
    .from('orders')
    .select('*, order_items(*), shipments(*)')
    .eq('order_number', orderNumber)
    .single()
  return data
}

export default async function SuccessPage({ searchParams }: Props) {
  const { order: orderNumber } = await searchParams
  const order = orderNumber ? await getOrder(orderNumber) : null

  if (!order) {
    return (
      <div style={{ padding: '96px 48px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 48, color: 'var(--liora-uva)' }}>Pedido no encontrado</h1>
        <Link href="/" style={{ display: 'inline-block', marginTop: 24, background: 'var(--liora-uva)', color: 'var(--liora-crema)', borderRadius: 999, padding: '14px 28px', fontFamily: 'var(--font-body)', fontWeight: 600 }}>Volver al inicio</Link>
      </div>
    )
  }

  return <SuccessClient order={order} />
}
