import { Resend } from 'resend'

// Lazy initialization — only creates client when called, not at build time
let _resend: Resend | null = null
export function getResend(): Resend {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY ?? 'placeholder')
  return _resend
}

export const FROM_EMAIL = 'LIORA <hola@liora.pe>'
export const REPLY_TO  = 'hola@liora.pe'
