import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { getResend, FROM_EMAIL, REPLY_TO } from '@/lib/email/client'
import { adminNotificationRecipient } from '@/lib/email/admin-recipient'
import { adminNewOrderEmail } from '@/lib/email/templates/admin-new-order'

export interface AdminDeliveryResult {
  status: 'sent' | 'captured'
  html: string
}

/**
 * US-004 · AC-004-03 — entrega el aviso de venta al negocio.
 *
 * Va aparte de deliverOrderEmail porque no comparte nada con él salvo el transporte: distinto
 * destinatario, distinto contenido y, sobre todo, distinto fallo. Que el cliente no tenga correo
 * registrado impide avisarle a él, pero no es motivo para dejar al negocio sin enterarse de que
 * hay un pedido que despachar.
 */
export async function deliverAdminNewOrderEmail(orderId: string): Promise<AdminDeliveryResult> {
  if (process.env.EMAIL_DELIVERY_MODE !== 'capture' && !process.env.RESEND_API_KEY) {
    throw new Error('email_not_configured')
  }

  const admin = createAdminClient()
  const { data: order } = await admin
    .from('orders')
    .select('*, order_items(*), addresses!shipping_address_id(address_line1, district, city, phone, first_name, last_name)')
    .eq('id', orderId)
    .single()

  if (!order) throw new Error('order_not_found')

  const datos = order as any
  const direccion = Array.isArray(datos.addresses) ? datos.addresses[0] : datos.addresses

  // El nombre y el teléfono pueden venir del pedido (invitado) o de la dirección de envío.
  // Para avisar al negocio cualquiera de los dos sirve; no hay que resolver la cuenta del
  // usuario como sí hace el correo al cliente, que necesita su email para enviárselo.
  const customerName: string | null =
    datos.guest_name
    ?? [direccion?.first_name, direccion?.last_name].filter(Boolean).join(' ')
    ?? null

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://liora.pe'

  const { subject, html } = adminNewOrderEmail({
    orderNumber: datos.order_number,
    customerName: customerName || null,
    customerEmail: datos.guest_email ?? null,
    customerPhone: datos.guest_phone ?? direccion?.phone ?? null,
    items: datos.order_items ?? [],
    totalCents: datos.total_cents,
    shipping: direccion
      ? {
          addressLine1: direccion.address_line1 ?? null,
          district: direccion.district ?? null,
          city: direccion.city ?? null,
        }
      : null,
    adminUrl: `${siteUrl}/admin/pedidos`,
    placedAt: datos.created_at,
  })

  if (process.env.EMAIL_DELIVERY_MODE === 'capture') return { status: 'captured', html }

  const { error } = await getResend().emails.send(
    {
      from: FROM_EMAIL,
      // Responder al aviso escribe al cliente, que es lo que se quiere hacer desde ahí.
      replyTo: datos.guest_email ?? REPLY_TO,
      to: adminNotificationRecipient(),
      subject,
      html,
    },
    { idempotencyKey: `order:${orderId}:admin_new_order` },
  )

  if (error) throw new Error(`resend_admin_new_order_failed:${error.message}`)
  return { status: 'sent', html }
}
