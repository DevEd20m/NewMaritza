import type { KitGuide } from '@/lib/guides'

interface OrderItem {
  product_name_snapshot: string
  variant_name_snapshot: string
  quantity: number
  unit_price_cents: number
}

interface OrderConfirmationProps {
  orderNumber: string
  customerName?: string
  items: OrderItem[]
  subtotalCents: number
  discountCents: number
  shippingCents: number
  totalCents: number
  guide?: KitGuide
  guideUrl?: string
  activationUrl?: string
  whatsappUrl: string
  siteUrl: string
}

const fmt = (cents: number) => `S/ ${(cents / 100).toFixed(0)}`

export function orderConfirmationEmail({
  orderNumber,
  customerName,
  items,
  subtotalCents,
  discountCents,
  shippingCents,
  totalCents,
  guide,
  guideUrl,
  activationUrl,
  whatsappUrl,
  siteUrl,
}: OrderConfirmationProps): string {
  const name = customerName?.split(' ')[0] ?? 'amig@'

  const itemRows = items.map(item => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #f0ece4;vertical-align:top;">
        <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;color:#3d1a3a;line-height:1.3;">
          ${item.quantity > 1 ? `${item.quantity}× ` : ''}${item.product_name_snapshot}
        </div>
        <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:12px;color:#8a7a7a;margin-top:2px;">${item.variant_name_snapshot}</div>
      </td>
      <td style="padding:12px 0;border-bottom:1px solid #f0ece4;vertical-align:top;text-align:right;white-space:nowrap;">
        <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14px;font-weight:700;color:#3d1a3a;">${fmt(item.unit_price_cents * item.quantity)}</div>
      </td>
    </tr>
  `).join('')

  const scheduleRows = guide?.schedule.map(s => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #f0ece4;vertical-align:top;width:32px;">
        <span style="font-size:20px;">${s.emoji}</span>
      </td>
      <td style="padding:12px 0 12px 12px;border-bottom:1px solid #f0ece4;vertical-align:top;">
        <div style="font-family:'Helvetica Neue',sans-serif;font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#8a7b70;margin-bottom:3px;">${s.time}</div>
        <div style="font-family:'Helvetica Neue',sans-serif;font-size:14px;color:#3d1a3a;font-weight:600;margin-bottom:3px;">${s.products.join(' + ')}</div>
        <div style="font-family:'Helvetica Neue',sans-serif;font-size:12px;color:#6b5a5a;line-height:1.4;">${s.tip}</div>
      </td>
    </tr>
  `).join('') ?? ''

  const activationSection = activationUrl ? `
    <!-- Spacer -->
    <tr><td style="height:16px;"></td></tr>

    <!-- Account activation -->
    <tr>
      <td style="background:#3d1a3a;border-radius:20px;padding:28px 32px;text-align:center;">
        <div style="font-family:'Helvetica Neue',sans-serif;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.14em;color:#c9f048;margin-bottom:10px;">✨ Sin contraseña</div>
        <div style="font-family:'Helvetica Neue',sans-serif;font-size:20px;font-weight:900;color:#fdf6ee;margin-bottom:8px;line-height:1.2;">Activa tu cuenta LIORA</div>
        <p style="font-family:'Helvetica Neue',sans-serif;font-size:14px;color:rgba(253,246,238,0.75);margin:0 0 20px;line-height:1.5;">
          Rastrea tu pedido, recompra en segundos y accede a tus guías personalizadas.
        </p>
        <a href="${activationUrl}" style="display:inline-block;background:#c9f048;color:#3d1a3a;border-radius:999px;padding:14px 32px;font-family:'Helvetica Neue',sans-serif;font-weight:800;font-size:15px;text-decoration:none;">
          Activar mi cuenta →
        </a>
        <p style="font-family:'Helvetica Neue',sans-serif;font-size:11px;color:rgba(253,246,238,0.45);margin:14px 0 0;">
          Enlace válido por 24h · Si no lo solicitaste, ignora este mensaje
        </p>
      </td>
    </tr>
  ` : ''

  const guideSection = guide && guideUrl ? `
    <!-- Spacer -->
    <tr><td style="height:16px;"></td></tr>

    <!-- Kit guide card -->
    <tr>
      <td style="background:#ffffff;border-radius:20px;overflow:hidden;">

        <!-- Guide header -->
        <div style="background:#3d1a3a;padding:24px 28px;">
          <div style="font-family:'Helvetica Neue',sans-serif;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.14em;color:#c9f048;margin-bottom:8px;">Tu guía de uso · ${guide.kitName}</div>
          <div style="font-family:'Helvetica Neue',sans-serif;font-size:15px;color:#fdf6ee;line-height:1.5;opacity:0.88;">"${guide.tagline}"</div>
        </div>

        <!-- Routine -->
        <div style="padding:24px 28px;">
          <div style="font-family:'Helvetica Neue',sans-serif;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#8a7b70;margin-bottom:14px;">Tu rutina diaria</div>
          <table width="100%" cellpadding="0" cellspacing="0">
            ${scheduleRows}
          </table>
        </div>

        <!-- CTA -->
        <div style="padding:0 28px 28px;text-align:center;">
          <a href="${guideUrl}" style="display:inline-block;background:#3d1a3a;color:#fdf6ee;border-radius:999px;padding:13px 28px;font-family:'Helvetica Neue',sans-serif;font-weight:700;font-size:14px;text-decoration:none;">
            Ver guía completa →
          </a>
        </div>
      </td>
    </tr>
  ` : ''

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Pedido confirmado #${orderNumber} — LIORA</title>
</head>
<body style="margin:0;padding:0;background:#f5f0ea;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0ea;padding:32px 16px;">
  <tr>
    <td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <!-- Logo -->
        <tr>
          <td style="padding:0 0 20px;text-align:center;">
            <a href="${siteUrl}" style="text-decoration:none;">
              <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-weight:900;font-size:30px;letter-spacing:-0.03em;color:#3d1a3a;">LIORA</div>
              <div style="font-size:11px;color:#a09090;margin-top:2px;letter-spacing:0.08em;text-transform:uppercase;">Wellness personalizado · Perú</div>
            </a>
          </td>
        </tr>

        <!-- Hero -->
        <tr>
          <td style="background:#3d1a3a;border-radius:20px 20px 0 0;padding:36px 32px;text-align:center;">
            <div style="width:56px;height:56px;background:#c9f048;border-radius:50%;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;">
              <span style="font-size:26px;line-height:56px;display:block;">✓</span>
            </div>
            <h1 style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:26px;font-weight:900;color:#fdf6ee;margin:0 0 10px;line-height:1.1;">
              ¡Gracias, ${name}!
            </h1>
            <p style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;color:#e8d0c0;margin:0;opacity:0.85;line-height:1.5;">
              Tu pedido <strong style="color:#c9f048;">#${orderNumber}</strong> fue confirmado.<br/>
              Llegarás a recibirlo en <strong style="color:#ffffff;">36–48h en Lima</strong>.
            </p>
          </td>
        </tr>

        <!-- Order summary -->
        <tr>
          <td style="background:#ffffff;padding:24px 32px;">

            <div style="font-family:'Helvetica Neue',sans-serif;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#8a7b70;margin-bottom:14px;">Resumen de tu pedido</div>

            <table width="100%" cellpadding="0" cellspacing="0">
              ${itemRows}
            </table>

            <!-- Totals -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
              <tr>
                <td style="font-family:'Helvetica Neue',sans-serif;font-size:13px;color:#8a7a7a;padding:5px 0;">Subtotal</td>
                <td style="font-family:'Helvetica Neue',sans-serif;font-size:13px;color:#3d1a3a;text-align:right;padding:5px 0;">${fmt(subtotalCents)}</td>
              </tr>
              ${discountCents > 0 ? `
              <tr>
                <td style="font-family:'Helvetica Neue',sans-serif;font-size:13px;color:#8a7a7a;padding:5px 0;">Descuento</td>
                <td style="font-family:'Helvetica Neue',sans-serif;font-size:13px;color:#22a06b;text-align:right;padding:5px 0;">−${fmt(discountCents)}</td>
              </tr>` : ''}
              <tr>
                <td style="font-family:'Helvetica Neue',sans-serif;font-size:13px;color:#8a7a7a;padding:5px 0;">Envío</td>
                <td style="font-family:'Helvetica Neue',sans-serif;font-size:13px;color:#3d1a3a;text-align:right;padding:5px 0;">${shippingCents === 0 ? 'Gratis' : fmt(shippingCents)}</td>
              </tr>
              <tr>
                <td colspan="2" style="border-top:1.5px solid #f0ece4;padding-top:12px;"></td>
              </tr>
              <tr>
                <td style="font-family:'Helvetica Neue',sans-serif;font-size:16px;font-weight:800;color:#3d1a3a;padding:4px 0;">Total pagado</td>
                <td style="font-family:'Helvetica Neue',sans-serif;font-size:20px;font-weight:900;color:#3d1a3a;text-align:right;padding:4px 0;">${fmt(totalCents)}</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Shipping banner -->
        <tr>
          <td style="background:#c9f048;padding:16px 32px;border-radius:0 0 20px 20px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size:20px;width:32px;vertical-align:middle;">📦</td>
                <td style="padding-left:12px;vertical-align:middle;">
                  <div style="font-family:'Helvetica Neue',sans-serif;font-weight:700;font-size:14px;color:#3d1a3a;">Preparando tu pedido</div>
                  <div style="font-family:'Helvetica Neue',sans-serif;font-size:12px;color:#3d1a3a;opacity:0.75;margin-top:2px;">Lima: 36–48h · Provincias: 3–5 días hábiles</div>
                </td>
                <td style="text-align:right;vertical-align:middle;">
                  <a href="${siteUrl}/tracking" style="font-family:'Helvetica Neue',sans-serif;font-size:12px;font-weight:700;color:#3d1a3a;text-decoration:underline;">Seguir pedido →</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        ${activationSection}

        ${guideSection}

        <!-- Spacer -->
        <tr><td style="height:16px;"></td></tr>

        <!-- WhatsApp CTA -->
        <tr>
          <td style="background:#25d366;border-radius:16px;padding:18px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="vertical-align:middle;">
                  <div style="font-family:'Helvetica Neue',sans-serif;font-size:14px;font-weight:700;color:#ffffff;margin-bottom:3px;">¿Tienes alguna duda?</div>
                  <div style="font-family:'Helvetica Neue',sans-serif;font-size:12px;color:rgba(255,255,255,0.85);">Te respondemos por WhatsApp en minutos.</div>
                </td>
                <td style="text-align:right;padding-left:16px;vertical-align:middle;">
                  <a href="${whatsappUrl}" style="display:inline-block;background:#ffffff;color:#25d366;border-radius:999px;padding:10px 18px;font-family:'Helvetica Neue',sans-serif;font-weight:700;font-size:13px;text-decoration:none;white-space:nowrap;">
                    Escribir →
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:28px 0 8px;text-align:center;">
            <p style="font-family:'Helvetica Neue',sans-serif;font-size:12px;color:#a09090;margin:0;line-height:1.7;">
              © LIORA · Lima, Perú<br/>
              <a href="${siteUrl}" style="color:#a09090;text-decoration:none;">liora.pe</a>
              &nbsp;·&nbsp;
              <a href="${siteUrl}/ayuda" style="color:#a09090;text-decoration:none;">Ayuda</a>
              &nbsp;·&nbsp;
              <a href="${siteUrl}/tracking" style="color:#a09090;text-decoration:none;">Rastrear pedido</a>
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`
}
