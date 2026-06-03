import type { KitGuide } from '@/lib/guides'

interface OrderGuideEmailProps {
  orderNumber: string
  customerName?: string
  guide: KitGuide
  guideUrl: string
  whatsappUrl: string
}

export function orderGuideEmail({
  orderNumber, customerName, guide, guideUrl, whatsappUrl,
}: OrderGuideEmailProps): string {
  const name = customerName ?? 'Amig@'
  const scheduleRows = guide.schedule.map(s => `
    <tr>
      <td style="padding:14px 0;border-bottom:1px solid #f0ece8;vertical-align:top;width:36px;">
        <span style="font-size:24px;">${s.emoji}</span>
      </td>
      <td style="padding:14px 0 14px 14px;border-bottom:1px solid #f0ece8;vertical-align:top;">
        <div style="font-family:'Helvetica Neue',sans-serif;font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;color:#8a7b70;margin-bottom:4px;">${s.time}</div>
        <div style="font-family:'Helvetica Neue',sans-serif;font-size:15px;color:#3d1a3a;font-weight:600;margin-bottom:4px;">${s.products.join(' + ')}</div>
        <div style="font-family:'Helvetica Neue',sans-serif;font-size:13px;color:#6b5a5a;line-height:1.45;">${s.tip}</div>
      </td>
    </tr>
  `).join('')

  const timelineCards = guide.timeline.map(t => `
    <td style="padding:0 8px;vertical-align:top;width:33%;">
      <div style="background:#f9f5f0;border-radius:12px;padding:16px;text-align:center;">
        <div style="font-family:'Helvetica Neue',sans-serif;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#8a7b70;margin-bottom:6px;">${t.label}</div>
        <div style="font-family:'Helvetica Neue',sans-serif;font-size:14px;font-weight:700;color:#3d1a3a;margin-bottom:4px;">${t.title}</div>
        <div style="font-family:'Helvetica Neue',sans-serif;font-size:12px;color:#6b5a5a;line-height:1.4;">${t.description}</div>
      </div>
    </td>
  `).join('')

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Tu guía de uso — ${guide.kitName}</title>
</head>
<body style="margin:0;padding:0;background:#f5f0ea;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0ea;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          <!-- Header LIORA -->
          <tr>
            <td style="padding:0 0 24px;text-align:center;">
              <div style="font-family:'Helvetica Neue',sans-serif;font-weight:900;font-size:28px;letter-spacing:-0.02em;color:#3d1a3a;">LIORA</div>
              <div style="font-size:12px;color:#8a7b70;margin-top:4px;">Wellness desde adentro</div>
            </td>
          </tr>

          <!-- Hero card -->
          <tr>
            <td style="background:#3d1a3a;border-radius:24px 24px 0 0;padding:36px 32px 32px;text-align:center;">
              <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.14em;color:#c4f135;margin-bottom:12px;">Tu guía de uso</div>
              <h1 style="font-size:28px;font-weight:900;color:#fdf6ee;margin:0 0 10px;line-height:1.1;">${guide.kitName}</h1>
              <p style="font-size:15px;color:#e8d8c8;opacity:0.85;margin:0;line-height:1.5;">"${guide.tagline}"</p>
            </td>
          </tr>

          <!-- Order confirmation -->
          <tr>
            <td style="background:#ffffff;padding:20px 32px;border-bottom:1px solid #f0ece8;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:13px;color:#8a7b70;">
                    Hola <strong style="color:#3d1a3a;">${name}</strong> — tu pedido <strong style="color:#3d1a3a;">#${orderNumber}</strong> fue confirmado.<br/>
                    Recibirás tu kit en <strong style="color:#3d1a3a;">36–48h en Lima</strong>. Mientras tanto, aquí está todo lo que necesitas saber.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Tu rutina del día -->
          <tr>
            <td style="background:#ffffff;padding:28px 32px 20px;">
              <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#8a7b70;margin-bottom:16px;">Tu rutina del día</div>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${scheduleRows}
              </table>
            </td>
          </tr>

          <!-- Qué esperar -->
          <tr>
            <td style="background:#ffffff;padding:24px 32px 28px;">
              <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#8a7b70;margin-bottom:16px;">Qué esperar</div>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>${timelineCards}</tr>
              </table>
            </td>
          </tr>

          <!-- CTA guía completa -->
          <tr>
            <td style="background:#ffffff;padding:20px 32px 32px;border-radius:0 0 24px 24px;text-align:center;">
              <div style="border-top:1px solid #f0ece8;padding-top:24px;">
                <p style="font-size:14px;color:#6b5a5a;margin:0 0 16px;">Consejos avanzados, recetas y preguntas frecuentes en tu guía completa:</p>
                <a href="${guideUrl}" style="display:inline-block;background:#3d1a3a;color:#fdf6ee;border-radius:999px;padding:14px 32px;font-weight:700;font-size:15px;text-decoration:none;">
                  Ver guía completa →
                </a>
              </div>
            </td>
          </tr>

          <!-- Spacer -->
          <tr><td style="height:20px;"></td></tr>

          <!-- WhatsApp card -->
          <tr>
            <td style="background:#25d366;border-radius:16px;padding:20px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;">
                    <div style="font-size:13px;font-weight:700;color:#ffffff;margin-bottom:3px;">¿Tienes preguntas sobre tu kit?</div>
                    <div style="font-size:12px;color:rgba(255,255,255,0.85);">Escríbenos por WhatsApp — te respondemos en minutos.</div>
                  </td>
                  <td style="text-align:right;vertical-align:middle;padding-left:16px;">
                    <a href="${whatsappUrl}" style="display:inline-block;background:#ffffff;color:#25d366;border-radius:999px;padding:10px 18px;font-weight:700;font-size:13px;text-decoration:none;white-space:nowrap;">
                      Escribir →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 0;text-align:center;">
              <p style="font-size:12px;color:#a09090;margin:0;line-height:1.6;">
                © LIORA · Lima, Perú<br/>
                <a href="https://liora.pe" style="color:#a09090;">liora.pe</a>
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
