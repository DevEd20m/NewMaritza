import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth/guards'

const schema = z.object({
  status: z.enum(['pending_payment', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']),
  note: z.string().optional(),
  trackingNumber: z.string().optional(),
  trackingUrl: z.string().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const { id } = await params
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const { status, note, trackingNumber, trackingUrl } = parsed.data
    const admin = createAdminClient()

    await (admin as any).from('orders').update({ status }).eq('id', id)

    await (admin as any).from('order_status_history').insert({
      order_id: id,
      status,
      note: note ?? null,
      created_by: guard.userId,
    })

    if (status === 'shipped' && trackingNumber) {
      const { data: existing } = await (admin as any)
        .from('shipments')
        .select('id')
        .eq('order_id', id)
        .single()

      if (existing) {
        await (admin as any).from('shipments').update({
          tracking_number: trackingNumber,
          tracking_url: trackingUrl ?? null,
          shipped_at: new Date().toISOString(),
        }).eq('order_id', id)
      } else {
        await (admin as any).from('shipments').insert({
          order_id: id,
          tracking_number: trackingNumber,
          tracking_url: trackingUrl ?? null,
          shipped_at: new Date().toISOString(),
        })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[admin/orders/status]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// Note: order_status_history.created_by references guard.userId (admin who made the change)

