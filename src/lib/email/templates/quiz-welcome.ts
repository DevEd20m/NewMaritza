interface QuizWelcomeEmailProps {
  resultUrl: string
  siteUrl: string
}

export function quizWelcomeEmail({ resultUrl, siteUrl }: QuizWelcomeEmailProps): string {
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Tu kit personalizado LIORA está listo</title>
</head>
<body style="margin:0;padding:0;background:#f8efe1;font-family:Arial,Helvetica,sans-serif;color:#45133f;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8efe1;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;">
        <tr><td style="padding:0 0 20px;text-align:center;font-size:34px;font-weight:900;letter-spacing:-1px;">LIORA</td></tr>
        <tr><td style="background:#45133f;border-radius:24px 24px 0 0;padding:40px 32px;text-align:center;color:#fff8ed;">
          <div style="width:58px;height:58px;line-height:58px;margin:0 auto 18px;border-radius:50%;background:#c8f238;font-size:28px;">✨</div>
          <h1 style="margin:0;font-size:30px;line-height:1.12;">Tu kit personalizado está listo</h1>
          <p style="margin:14px 0 0;font-size:16px;line-height:1.55;color:#ead8e6;">Analizamos tus respuestas y armamos una rutina con productos disponibles en LIORA, en el orden recomendado de uso.</p>
        </td></tr>
        <tr><td style="background:#ffffff;padding:32px;border-radius:0 0 24px 24px;text-align:center;">
          <p style="margin:0 0 24px;font-size:15px;line-height:1.6;">Abre tu resultado para revisar el diagnóstico, ajustar cantidades y conversar con Lía si quieres comparar o reemplazar algún producto.</p>
          <a href="${resultUrl}" style="display:inline-block;background:#c8f238;color:#45133f;text-decoration:none;border-radius:999px;padding:16px 30px;font-size:16px;font-weight:800;">Ver mi kit personalizado →</a>
          <div style="margin-top:18px;"><a href="${siteUrl}/login?mode=signup&amp;next=%2Fcuenta" style="font-size:13px;color:#45133f;">Crear una cuenta para guardar mi historial</a></div>
          <p style="margin:22px 0 0;font-size:12px;line-height:1.5;color:#8d7b89;">Este enlace privado estará disponible durante 30 días. No lo compartas.</p>
        </td></tr>
        <tr><td style="padding:22px 12px 0;text-align:center;font-size:12px;line-height:1.6;color:#8d7b89;">
          Recibes este mensaje porque solicitaste tu diagnóstico en LIORA.<br />
          Este correo no te suscribe a comunicaciones de marketing.<br />
          <a href="${siteUrl}" style="color:#45133f;">liora.pe</a> · Responde este correo si necesitas ayuda.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}
