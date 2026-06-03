import type { KitGuide } from '@/lib/guides'

interface WeekCheckinEmailProps {
  orderNumber: string
  customerName?: string
  guide: KitGuide
  guideUrl: string
  whatsappUrl: string
}

export function weekCheckinEmail({
  orderNumber, customerName, guide, guideUrl, whatsappUrl,
}: WeekCheckinEmailProps): string {
  const name = customerName ?? 'Amig@'

  const tip = guide.tips[0]

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>¿Cómo van tus primeros 7 días? — LIORA</title>
</head>
<body style="margin:0;padding:0;background:#f5f0ea;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0ea;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="padding:0 0 24px;text-align:center;">
              <div style="font-family:'Helvetica Neue',sans-serif;font-weight:900;font-size:28px;letter-spacing:-0.02em;color:#3d1a3a;">LIORA</div>
            </td>
          </tr>

          <!-- Main card -->
          <tr>
            <td style="background:#ffffff;border-radius:24px;padding:36px 32px;text-align:center;">

              <div style="font-size:40px;margin-bottom:16px;">🌱</div>
              <h1 style="font-size:26px;font-weight:900;color:#3d1a3a;margin:0 0 12px;line-height:1.1;">
                ¿Cómo van tus primeros 7 días, ${name}?
              </h1>
              <p style="font-size:15px;color:#6b5a5a;margin:0 0 28px;line-height:1.55;">
                Llevas una semana con tu <strong>${guide.kitName}</strong>.<br/>
                Aquí va lo que debería estar pasando en tu cuerpo:
              </p>

              <!-- Timeline week 1 -->
              <div style="background:#f9f5f0;border-radius:16px;padding:20px 24px;margin-bottom:24px;text-align:left;">
                <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#8a7b70;margin-bottom:8px;">Semana 1 — ${guide.timeline[0]?.label ?? 'Inicio'}</div>
                <div style="font-size:17px;font-weight:800;color:#3d1a3a;margin-bottom:6px;">${guide.timeline[0]?.title ?? 'Primeros cambios'}</div>
                <div style="font-size:14px;color:#6b5a5a;line-height:1.5;">${guide.timeline[0]?.description ?? ''}</div>
              </div>

              <!-- Tip destacado -->
              ${tip ? `
              <div style="border-left:3px solid #3d1a3a;padding:12px 16px;margin-bottom:24px;text-align:left;">
                <div style="font-size:13px;font-weight:700;color:#3d1a3a;margin-bottom:4px;">${tip.emoji} ${tip.title}</div>
                <div style="font-size:13px;color:#6b5a5a;line-height:1.45;">${tip.body}</div>
              </div>
              ` : ''}

              <!-- Reminder tip -->
              <div style="background:#fdf6ee;border:1px solid #e8d8c0;border-radius:12px;padding:16px 20px;margin-bottom:24px;text-align:left;">
                <div style="font-size:13px;color:#6b5a5a;line-height:1.5;">
                  💡 <strong>Recuerda:</strong> La consistencia importa más que la perfección.
                  Si te salteaste algún día, retoma hoy sin culpa — el efecto acumulativo no se pierde por un día.
                </div>
              </div>

              <!-- CTA -->
              <a href="${guideUrl}" style="display:inline-block;background:#3d1a3a;color:#fdf6ee;border-radius:999px;padding:14px 32px;font-weight:700;font-size:15px;text-decoration:none;margin-bottom:14px;">
                Ver tu guía completa →
              </a>

              <p style="font-size:12px;color:#a09090;margin:12px 0 0;">Pedido #${orderNumber}</p>
            </td>
          </tr>

          <!-- Spacer -->
          <tr><td style="height:16px;"></td></tr>

          <!-- WhatsApp -->
          <tr>
            <td style="background:#25d366;border-radius:16px;padding:18px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;">
                    <div style="font-size:13px;font-weight:700;color:#ffffff;">¿Algo no cuadra? Escríbenos</div>
                    <div style="font-size:12px;color:rgba(255,255,255,0.85);">Te ayudamos a ajustar tu rutina.</div>
                  </td>
                  <td style="text-align:right;padding-left:12px;">
                    <a href="${whatsappUrl}" style="display:inline-block;background:#ffffff;color:#25d366;border-radius:999px;padding:10px 16px;font-weight:700;font-size:13px;text-decoration:none;">
                      WhatsApp →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 0;text-align:center;">
              <p style="font-size:12px;color:#a09090;margin:0;">
                © LIORA · Lima, Perú · <a href="https://liora.pe" style="color:#a09090;">liora.pe</a>
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
