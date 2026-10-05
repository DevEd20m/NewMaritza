/**
 * A quién avisa el negocio cuando entra un pedido.
 *
 * AC-004-04 · va en el entorno y no en el código, para que cambiar la dirección no exija un
 * despliegue. El remitente (`FROM_EMAIL` en client.ts) sí está escrito a mano, y ese es
 * precisamente el error que aquí no se repite.
 */
export const ADMIN_RECIPIENT_POR_DEFECTO = 'hola@liora.pe'

export function adminNotificationRecipient(): string {
  const configurado = process.env.ADMIN_NOTIFICATION_EMAIL?.trim()
  // Una variable declarada pero vacía es un despiste de configuración, no la intención de
  // dejar de avisar: mejor seguir avisando a la dirección de siempre que no avisar a nadie.
  return configurado ? configurado : ADMIN_RECIPIENT_POR_DEFECTO
}
