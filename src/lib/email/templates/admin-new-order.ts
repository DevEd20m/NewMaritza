import { formatPEN } from '@/lib/format/money'

/**
 * US-004 · AC-004-03 — el aviso interno de que entró un pedido.
 *
 * No se parece a los correos al cliente y no debe parecerse: aquí no hay que vender nada, hay que
 * poder despachar de un vistazo desde el celular. Por eso el asunto lleva el número de pedido y el
 * cuerpo empieza por lo que hace falta para preparar el paquete.
 */

interface AdminOrderItem {
  product_name_snapshot: string
  variant_name_snapshot: string
  quantity: number
  unit_price_cents: number
}

export interface AdminNewOrderProps {
  orderNumber: string
  customerName: string | null
  customerEmail: string | null
  customerPhone: string | null
  items: AdminOrderItem[]
  totalCents: number
  shipping: { addressLine1: string | null; district: string | null; city: string | null } | null
  adminUrl: string
  placedAt: string
}

/** Todo lo que llega del cliente pasa por aquí: un nombre es texto libre que él escribió. */
const esc = (valor: unknown): string =>
  String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const fmt = (cents: number) => formatPEN(cents, { space: true })

const UVA = '#3D1A3A'
const CREMA = '#FBF1E2'
const ARENA = '#E8D9C3'

export function adminNewOrderEmail({
  orderNumber,
  customerName,
  customerEmail,
  customerPhone,
  items,
  totalCents,
  shipping,
  adminUrl,
  placedAt,
}: AdminNewOrderProps): { subject: string; html: string } {
  const subject = `Nuevo pedido ${orderNumber} · ${fmt(totalCents)}`

  const cuando = new Date(placedAt).toLocaleString('es-PE', {
    timeZone: 'America/Lima',
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  const contacto = [
    customerEmail ? `<a href="mailto:${esc(customerEmail)}" style="color:${UVA}">${esc(customerEmail)}</a>` : null,
    // El tel: se limpia de espacios para que el enlace funcione al tocarlo en el celular.
    customerPhone ? `<a href="tel:${esc(customerPhone.replace(/[^\d+]/g, ''))}" style="color:${UVA}">${esc(customerPhone)}</a>` : null,
  ].filter(Boolean).join(' · ')

  const entrega = shipping
    ? [shipping.addressLine1, shipping.district, shipping.city].filter(Boolean).map(esc).join(', ')
    : 'Sin dirección registrada'

  const filas = items.map((item) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid ${ARENA};font-size:14px;color:${UVA}">
          <strong>${esc(item.quantity)} ×</strong> ${esc(item.product_name_snapshot)}
          <span style="opacity:.6">· ${esc(item.variant_name_snapshot)}</span>
        </td>
        <td style="padding:8px 0;border-bottom:1px solid ${ARENA};font-size:14px;color:${UVA};text-align:right;white-space:nowrap">
          ${esc(fmt(item.unit_price_cents * item.quantity))}
        </td>
      </tr>`).join('')

  const html = `<!doctype html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${CREMA};font-family:system-ui,-apple-system,'Segoe UI',sans-serif">
  <div style="max-width:560px;margin:0 auto;padding:24px 16px">

    <p style="margin:0 0 4px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:${UVA};opacity:.6">
      Pedido nuevo · ${esc(cuando)}
    </p>
    <h1 style="margin:0 0 20px;font-size:26px;color:${UVA}">${esc(orderNumber)}</h1>

    <div style="background:#fff;border:1px solid ${ARENA};border-radius:14px;padding:16px;margin-bottom:14px">
      <p style="margin:0 0 6px;font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:${UVA};opacity:.55">Cliente</p>
      <p style="margin:0 0 2px;font-size:16px;font-weight:700;color:${UVA}">${esc(customerName || 'Sin nombre')}</p>
      <p style="margin:0;font-size:14px;color:${UVA}">${contacto || 'Sin datos de contacto'}</p>
    </div>

    <div style="background:#fff;border:1px solid ${ARENA};border-radius:14px;padding:16px;margin-bottom:14px">
      <p style="margin:0 0 6px;font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:${UVA};opacity:.55">Entrega</p>
      <p style="margin:0;font-size:14px;color:${UVA}">${entrega}</p>
    </div>

    <div style="background:#fff;border:1px solid ${ARENA};border-radius:14px;padding:16px;margin-bottom:20px">
      <p style="margin:0 0 6px;font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:${UVA};opacity:.55">Qué preparar</p>
      <table style="width:100%;border-collapse:collapse">${filas}</table>
      <table style="width:100%;border-collapse:collapse;margin-top:10px">
        <tr>
          <td style="font-size:16px;font-weight:700;color:${UVA}">Total</td>
          <td style="font-size:16px;font-weight:700;color:${UVA};text-align:right">${esc(fmt(totalCents))}</td>
        </tr>
      </table>
    </div>

    <a href="${esc(adminUrl)}" style="display:block;background:${UVA};color:${CREMA};text-decoration:none;text-align:center;padding:14px;border-radius:999px;font-size:15px;font-weight:700">
      Abrir el pedido en el panel
    </a>

  </div>
</body>
</html>`

  return { subject, html }
}
