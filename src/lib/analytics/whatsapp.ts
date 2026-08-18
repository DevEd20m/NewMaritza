export const WHATSAPP_PLACEMENTS = ['floating', 'footer', 'help', 'guide_public', 'guide_private', 'order_confirmation'] as const
export type WhatsAppPlacement = typeof WHATSAPP_PLACEMENTS[number]

export function trackedWhatsAppHref(placement: WhatsAppPlacement, message?: string): string {
  const params = new URLSearchParams({ placement })
  if (message) params.set('message', message.slice(0, 240))
  return `/go/whatsapp?${params.toString()}`
}
