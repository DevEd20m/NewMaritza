/**
 * US-005 · AC-005-03 — la fecha de la versión vigente de los documentos legales.
 *
 * Vive aquí y no en cada página porque las condiciones prometen que «la versión vigente siempre
 * estará en liora.pe/terminos con su fecha de actualización»: si la fecha se escribe en dos
 * sitios, uno de los dos miente en cuanto alguien actualice solo un documento.
 *
 * Se actualiza a mano, y solo cuando el texto legal cambia de verdad.
 */
export const LEGAL_VIGENCIA = '2026-10-04'

export const LEGAL_VIGENCIA_TEXTO = new Date(`${LEGAL_VIGENCIA}T12:00:00-05:00`).toLocaleDateString('es-PE', {
  timeZone: 'America/Lima',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

/** Identificación del proveedor. La ley exige que sea identificable; el negocio la quiere discreta. */
export const PROVEEDOR = {
  nombreComercial: 'LIORA',
  titular: 'José Edmundo Prado Astucuri',
  condicion: 'persona natural con negocio',
  ruc: '10708951922',
  domicilioFiscal: 'Anexo Chichucancha S/N, distrito de Cangallo, provincia de Cangallo, departamento de Ayacucho, Perú',
} as const

export const CONTACTO = {
  email: 'hola@liora.pe',
  horario: 'lunes a viernes de 9:00 a 19:00',
} as const
