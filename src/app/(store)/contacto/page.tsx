import type { Metadata } from 'next'
import Link from 'next/link'
import { WhatsappLogo, EnvelopeSimple, Clock, Receipt } from '@phosphor-icons/react/dist/ssr'
import { getStoreSettings } from '@/lib/settings'
import { trackedWhatsAppHref } from '@/lib/analytics/whatsapp'
import { CONTACTO } from '@/lib/legal/vigencia'

export const metadata: Metadata = {
  title: 'Contacto | LIORA',
  description: 'Escríbenos por WhatsApp o correo. Atendemos de lunes a viernes de 9:00 a 19:00.',
}

const UVA = 'var(--liora-uva)'

/** Formatea 51955780628 como +51 955 780 628, igual que hace la página de ayuda. */
function mostrarNumero(numero: string): string {
  const digitos = numero.replace(/\D/g, '')
  const sinPais = digitos.startsWith('51') ? digitos.slice(2) : digitos
  return `+51 ${sinPais.slice(0, 3)} ${sinPais.slice(3, 6)} ${sinPais.slice(6, 9)}`.trim()
}

function Tarjeta({
  href,
  externo,
  fondo,
  Icono,
  titulo,
  valor,
  cta,
  tinta = UVA,
}: {
  href: string
  externo?: boolean
  fondo: string
  Icono: typeof WhatsappLogo
  titulo: string
  valor: string
  cta: string
  tinta?: string
}) {
  // Ancla plana a propósito: <Link> prefetchea /go/whatsapp y eso registraba clics fantasma
  // —y quemaba códigos de referencia— con solo desplazar la página.
  const contenido = (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <Icono size={20} weight="fill" />
        <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{titulo}</span>
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, lineHeight: 1.15, marginBottom: 8, overflowWrap: 'anywhere' }}>{valor}</div>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, opacity: 0.8 }}>{cta}</div>
    </>
  )
  const estilo = {
    background: fondo,
    color: tinta,
    borderRadius: 20,
    padding: '22px 24px',
    textDecoration: 'none',
    display: 'block',
    minWidth: 0,
  } as const

  return externo
    ? <a href={href} style={estilo}>{contenido}</a>
    : <Link href={href} style={estilo}>{contenido}</Link>
}

export default async function ContactoPage() {
  const settings = await getStoreSettings()
  const numero = mostrarNumero(settings.whatsapp_number)
  const waHref = trackedWhatsAppHref('contacto', 'Hola LIORA, quiero hacer una consulta.')

  return (
    <section data-legal-doc className="liora-px" style={{ maxWidth: 760, margin: '0 auto', padding: '56px 24px 96px', color: UVA }}>
      <p style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.55, margin: '0 0 10px' }}>
        Hablemos
      </p>
      <h1 className="liora-page-title" style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 48, lineHeight: 1.05, letterSpacing: '-0.02em', margin: '0 0 14px', overflowWrap: 'anywhere' }}>
        Contacto
      </h1>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, lineHeight: 1.7, opacity: 0.8, margin: '0 0 36px' }}>
        Respondemos de {CONTACTO.horario}. Si escribes fuera de ese horario, te contestamos al día siguiente.
      </p>

      <div className="liora-nosotros-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14, marginBottom: 36 }}>
        <Tarjeta
          href={waHref}
          externo
          fondo="#25D366"
          tinta="#0B3B21"
          Icono={WhatsappLogo}
          titulo="WhatsApp"
          valor={numero}
          cta="Escribir ahora →"
        />
        <Tarjeta
          href={`mailto:${CONTACTO.email}`}
          externo
          fondo="var(--cat-cielo)"
          Icono={EnvelopeSimple}
          titulo="Correo"
          valor={CONTACTO.email}
          cta="Enviar un correo →"
        />
      </div>

      <div style={{ display: 'grid', gap: 14 }}>
        <div style={{ border: '1.5px solid var(--liora-arena)', borderRadius: 18, padding: '18px 22px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <Clock size={20} weight="bold" style={{ flexShrink: 0, marginTop: 2, opacity: 0.6 }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15, marginBottom: 4 }}>¿Es sobre un pedido en curso?</div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.65, opacity: 0.8, margin: 0 }}>
              Ten a mano tu código de pedido: está en el correo de confirmación. Con él podemos responderte en una sola vuelta. También puedes consultar el estado en{' '}
              <Link href="/tracking" style={{ color: UVA }}>seguimiento</Link>.
            </p>
          </div>
        </div>

        <div style={{ border: '1.5px solid var(--liora-arena)', borderRadius: 18, padding: '18px 22px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <Receipt size={20} weight="bold" style={{ flexShrink: 0, marginTop: 2, opacity: 0.6 }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15, marginBottom: 4 }}>¿Un reclamo o una queja?</div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.65, opacity: 0.8, margin: 0 }}>
              Escríbenos por cualquiera de los dos canales de arriba. Recibirás copia en tu correo y respondemos en un máximo de 15 días hábiles, como indica la{' '}
              <Link href="/terminos" style={{ color: UVA }}>sección 10 de los Términos</Link>.
            </p>
          </div>
        </div>
      </div>

      <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.7, opacity: 0.75, marginTop: 36 }}>
        Antes de escribir, quizá encuentres la respuesta en el{' '}
        <Link href="/ayuda" style={{ color: UVA }}>centro de ayuda</Link>.
      </p>
    </section>
  )
}
