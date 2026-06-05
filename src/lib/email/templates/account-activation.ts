interface AccountActivationProps {
  activationUrl: string
  siteUrl: string
  firstName?: string
}

export function accountActivationEmail({ activationUrl, siteUrl, firstName }: AccountActivationProps): string {
  const name = firstName ?? 'amig@'

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Activa tu cuenta LIORA</title>
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

        <!-- Hero card -->
        <tr>
          <td style="background:#3d1a3a;border-radius:20px 20px 0 0;padding:40px 32px;text-align:center;">
            <div style="width:60px;height:60px;background:#c9f048;border-radius:50%;margin:0 auto 20px;display:table-cell;vertical-align:middle;text-align:center;">
              <span style="font-size:28px;">✨</span>
            </div>
            <h1 style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:28px;font-weight:900;color:#fdf6ee;margin:0 0 12px;line-height:1.1;">
              Un solo click para activar tu cuenta
            </h1>
            <p style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;color:#e8d0c0;margin:0;opacity:0.85;line-height:1.5;">
              Hola, ${name}. Activa tu cuenta LIORA<br/>y accede a tu historial de pedidos cuando quieras.
            </p>
          </td>
        </tr>

        <!-- Benefits -->
        <tr>
          <td style="background:#ffffff;padding:28px 32px;">
            <div style="font-family:'Helvetica Neue',sans-serif;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#8a7b70;margin-bottom:16px;">Con tu cuenta LIORA puedes:</div>
            <table width="100%" cellpadding="0" cellspacing="0">
              ${[
                ['📦', 'Ver el estado de tus pedidos en tiempo real'],
                ['⚡', 'Recomprar tu kit en segundos — sin volver a llenar datos'],
                ['🌿', 'Acceder a tus guías de bienestar personalizadas'],
                ['🎁', 'Recibir descuentos exclusivos para miembros'],
              ].map(([emoji, text]) => `
              <tr>
                <td style="padding:8px 0;vertical-align:top;width:32px;font-size:18px;">${emoji}</td>
                <td style="padding:8px 0 8px 10px;vertical-align:top;font-family:'Helvetica Neue',sans-serif;font-size:14px;color:#3d1a3a;line-height:1.4;">${text}</td>
              </tr>`).join('')}
            </table>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="background:#ffffff;padding:0 32px 36px;border-radius:0 0 20px 20px;text-align:center;">
            <a href="${activationUrl}" style="display:inline-block;background:#c9f048;color:#3d1a3a;border-radius:999px;padding:16px 40px;font-family:'Helvetica Neue',sans-serif;font-weight:800;font-size:16px;text-decoration:none;letter-spacing:-0.01em;">
              Activar mi cuenta →
            </a>
            <p style="font-family:'Helvetica Neue',sans-serif;font-size:12px;color:#a09090;margin:16px 0 0;line-height:1.5;">
              Este enlace es válido por 24 horas. Si no solicitaste esto, ignora este mensaje.<br/>
              También puedes crear tu cuenta en <a href="${siteUrl}/login" style="color:#3d1a3a;">liora.pe/login</a>
            </p>
          </td>
        </tr>

        <!-- Spacer -->
        <tr><td style="height:24px;"></td></tr>

        <!-- Footer -->
        <tr>
          <td style="padding:0 0 8px;text-align:center;">
            <p style="font-family:'Helvetica Neue',sans-serif;font-size:12px;color:#a09090;margin:0;line-height:1.7;">
              © LIORA · Lima, Perú<br/>
              <a href="${siteUrl}" style="color:#a09090;text-decoration:none;">liora.pe</a>
              &nbsp;·&nbsp;
              <a href="${siteUrl}/ayuda" style="color:#a09090;text-decoration:none;">Ayuda</a>
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
