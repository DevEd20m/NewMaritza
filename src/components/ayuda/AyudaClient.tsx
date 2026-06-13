'use client'
import { useState } from 'react'
import Link from 'next/link'
import type { Icon, IconWeight } from '@phosphor-icons/react'
import { ArrowLeft, Truck, ArrowUUpLeft, MapPin, CreditCard, Sparkle, ChatCircle, MagnifyingGlass, Plus, Minus, WhatsappLogo, EnvelopeSimple, Phone } from '@phosphor-icons/react'

const HELP_CATEGORIES = [
  { id: 'envios',       label: 'Envíos',             icon: Truck,        color: 'var(--cat-mostaza)' },
  { id: 'devoluciones', label: 'Devoluciones',        icon: ArrowUUpLeft, color: 'var(--cat-coral)' },
  { id: 'seguimiento',  label: 'Seguimiento',         icon: MapPin,       color: 'var(--cat-menta)' },
  { id: 'pagos',        label: 'Pagos',               icon: CreditCard,   color: 'var(--cat-cielo)' },
  { id: 'kits',         label: 'Kits y cuestionario', icon: Sparkle,      color: 'var(--cat-lavanda)' },
  { id: 'contacto',     label: 'Contacto',            icon: ChatCircle,   color: 'var(--cat-rosa)' },
]

function buildFaqs(waDisplay: string, deliveryTime: string, shippingCost: number, freeShippingThreshold: number) {
  const shippingSoles = `S/${(shippingCost / 100).toFixed(0)}`
  const freeThresholdSoles = `S/${Math.round(freeShippingThreshold / 100)}`
  return {
    envios: [
      { q: '¿Cuánto demora el envío en Lima?',              a: `${deliveryTime}. El código de seguimiento llega a tu correo y WhatsApp.` },
      { q: '¿El envío es gratis?',                          a: `Sí, en pedidos sobre ${freeThresholdSoles}. Para pedidos menores, el envío es ${shippingSoles} a Lima.` },
      { q: '¿A qué zonas llega LIORA?',                     a: 'Llegamos a todo el Perú a través de los envíos de Shalom.' },
      { q: '¿Puedo cambiar mi dirección después de pagar?', a: 'Escríbenos por WhatsApp antes de que salga tu pedido del taller y lo coordinamos.' },
      { q: '¿Qué pasa si no estoy cuando llega mi pedido?', a: 'El repartidor intentará de nuevo. Si pasan 2 intentos sin éxito, el pedido regresa al taller y coordinamos una nueva fecha de entrega contigo.' },
    ],
    devoluciones: [
      { q: '¿Tienen garantía los productos?',            a: '30 días desde la entrega. Si no te funciona o llegó dañado, te devolvemos el 100% o te lo cambiamos. Sin preguntas raras.' },
      { q: '¿Qué hago si un producto llegó dañado?',    a: 'Escríbenos en menos de 48h con una foto del producto. Te enviamos un reemplazo sin costo o te devolvemos el valor. Sin preguntas complicadas.' },
      { q: '¿Qué hago si mi pedido llegó incompleto?',  a: 'Revisa tu email de confirmación — a veces enviamos productos por separado. Si falta algo, escríbenos con tu número de pedido y lo resolvemos de inmediato.' },
      { q: '¿Cómo devuelvo un producto?',               a: 'Escríbenos al WhatsApp con tu número de pedido y coordinamos la recogida. Sin costo.' },
      { q: '¿Puedo devolver solo un producto del kit?', a: 'Sí. Te abonamos el valor unitario de ese producto (no el del kit completo, porque los kits tienen descuento por bundle).' },
      { q: '¿Qué productos no aplican para devolución?', a: 'Por higiene, productos abiertos o usados sin defecto no aplican para devolución. Productos sellados con defecto de fabricación sí aplican siempre.' },
    ],
    seguimiento: [
      { q: '¿Dónde veo mi código de seguimiento?',          a: 'Te lo enviamos por email y WhatsApp apenas tu pedido sale del taller. También está en Mi Cuenta → Pedidos.' },
      { q: '¿Mi pedido aparece como pendiente, qué significa?', a: 'El estado "pendiente" es normal mientras procesamos tu pago y preparamos tu kit. Si pasó más de 24 horas sin cambio, escríbenos.' },
      { q: '¿Qué hago si dice "Entregado" pero no llegó?',  a: 'Escríbenos en menos de 24h. Verificamos con el repartidor y, si fue extraviado, te enviamos un nuevo kit sin costo.' },
      { q: '¿Puedo coordinar la entrega?',                  a: 'Sí, cuando el pedido esté en estado "En reparto" recibes un SMS para coordinar ventana de entrega con el repartidor.' },
    ],
    pagos: [
      { q: '¿Qué métodos de pago aceptan?',                                       a: 'Visa, Mastercard y AmEx. Todo procesado con encriptación SSL — no guardamos los datos de tu tarjeta.' },
      { q: '¿Es seguro pagar en LIORA?',                                          a: 'Sí. Usamos Stripe, un procesador de pagos con encriptación SSL de nivel bancario. No almacenamos datos de tu tarjeta.' },
      { q: 'Mi pago fue exitoso pero mi pedido aparece pendiente, ¿qué hago?',   a: 'Puede haber un pequeño retraso entre el banco y nuestro sistema. Espera 10–15 minutos y recarga la página. Si sigue pendiente, escríbenos con el número de tu operación.' },
      { q: '¿Puedo pagar en cuotas?',                                            a: 'Sí, hasta 6 cuotas sin intereses con tarjetas Visa y Mastercard de bancos peruanos.' },
      { q: '¿Cómo aplico un cupón?',                                             a: 'En el resumen del carrito, ingresa el código y haz "Aplicar". Verás el descuento reflejado al instante.' },
    ],
    kits: [
      { q: '¿Qué es un kit personalizado?',          a: 'Es una combinación de 3 a 6 productos elegida a partir de tu cuestionario. Siempre más barato que comprar los productos por separado.' },
      { q: '¿Cómo funciona el cuestionario?',        a: 'Respondes entre 8 y 12 preguntas sobre tu rutina, objetivos, preferencias y alertas de salud. Con eso armamos tu kit y te explicamos qué incluye cada producto y cómo usarlo.' },
      { q: '¿Puedo comprar sin hacer el cuestionario?', a: 'Sí, puedes ver y comprar productos individuales en la tienda. Pero el cuestionario te ayuda a elegir mejor y evitar productos que no necesitas.' },
      { q: '¿Puedo cambiar productos de mi kit?',    a: 'Claro. En la pantalla del kit puedes quitar productos, sumar otros o pedirle a Lía (nuestra asistente) sustituciones equivalentes.' },
      { q: '¿LIORA reemplaza una consulta médica?',  a: 'No. LIORA ofrece recomendaciones de autocuidado general según tus respuestas. No diagnosticamos ni tratamos condiciones médicas. Si estás embarazada, tomas medicamentos o tienes una condición médica, consulta con un profesional antes de usar nuevos productos.' },
      { q: '¿Cada cuánto debo rehacer el cuestionario?', a: 'Recomendamos cada 2 meses o cuando se te acabe el kit. También si cambiás de rutina (nueva temporada, embarazo, lesión, etc).' },
    ],
    contacto: [
      { q: '¿Cómo escribo al equipo?',                    a: `Por WhatsApp al ${waDisplay}, por email a hola@liora.pe, o desde el chat aquí abajo. Respondemos en menos de 2 horas en horario laboral.` },
      { q: '¿En qué horario responden?',                  a: 'Lunes a viernes de 9:00 a. m. a 7:00 p. m. Los mensajes de fin de semana se responden el lunes.' },
      { q: '¿Tienen tienda física?',                      a: 'Nuestro taller está en Surquillo y se puede visitar con cita previa. Escríbenos si quieres conocernos.' },
      { q: '¿Trabajan con marcas, creadores o afiliados?', a: 'Sí — escríbenos a colab@liora.pe con tu perfil y nos contactamos en 48h.' },
    ],
  }
}

function ContactCard({
  bg, Icon, title, value, cta, inkColor = 'var(--liora-uva)', href,
}: {
  bg: string; Icon: Icon; title: string; value: string; cta: string; inkColor?: string; href?: string
}) {
  const style = {
    background: bg, borderRadius: 24, padding: 24, border: 'none', textAlign: 'left' as const,
    cursor: 'pointer', display: 'flex', flexDirection: 'column' as const, gap: 8,
    color: inkColor, width: '100%', textDecoration: 'none',
  }
  const inner = (
    <>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(251,241,226,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: inkColor, fontSize: 22 }}>
        <Icon size={22} weight={'bold' as IconWeight} />
      </div>
      <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.8 }}>{title}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, marginTop: 4 }}>{cta}</div>
    </>
  )
  return href
    ? <a href={href} target="_blank" rel="noopener noreferrer" style={style}>{inner}</a>
    : <button style={style}>{inner}</button>
}

interface Props {
  whatsappNumber: string
  deliveryTime: string
  shippingCostCents: number
  freeShippingThresholdCents: number
  isLoggedIn: boolean
}

export function AyudaClient({ whatsappNumber, deliveryTime, shippingCostCents, freeShippingThresholdCents, isLoggedIn }: Props) {
  const [cat, setCat] = useState('envios')
  const [openIdx, setOpenIdx] = useState<number | null>(0)
  const [query, setQuery] = useState('')

  const waDisplay = (() => {
    const digits = whatsappNumber.replace(/\D/g, '')
    if (digits.startsWith('51') && digits.length === 11) {
      return `+51 ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`
    }
    return digits.startsWith('51') ? `+${digits}` : digits
  })()

  const waLink = `https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent('Hola, necesito ayuda con mi pedido LIORA.')}`
  const waCallLink = `https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent('Hola, quisiera coordinar una llamada con el equipo LIORA.')}`

  const HELP_FAQS = buildFaqs(waDisplay, deliveryTime, shippingCostCents, freeShippingThresholdCents)
  const faqs = HELP_FAQS[cat as keyof typeof HELP_FAQS] ?? []
  const filtered = query
    ? Object.values(HELP_FAQS).flat().filter(f => f.q.toLowerCase().includes(query.toLowerCase()) || f.a.toLowerCase().includes(query.toLowerCase()))
    : faqs

  return (
    <section style={{ background: 'var(--liora-crema)', padding: '32px 48px 96px' }}>
      <Link href="/" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--liora-uva)', fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 24, textDecoration: 'none' }}>
        <ArrowLeft size={16} weight="bold" /> Volver
      </Link>

      <div style={{ textAlign: 'center', maxWidth: 720, margin: '0 auto 48px' }}>
        <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 12, color: 'var(--liora-uva)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>Centro de ayuda</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 64, lineHeight: 1, letterSpacing: '-0.025em', color: 'var(--liora-uva)', margin: 0, fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1" }}>
          ¿Cómo te <span style={{ fontFamily: 'var(--font-script)' }}>ayudamos?</span>
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 17, color: 'var(--liora-uva)', opacity: 0.75, marginTop: 12, marginBottom: 0 }}>
          Busca respuestas sobre tu pedido, pagos, envíos, kits o el cuestionario.
        </p>
        <div style={{ position: 'relative', maxWidth: 520, margin: '32px auto 0' }}>
          <MagnifyingGlass size={20} style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', color: 'var(--liora-uva)' }} />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Busca por envío, pago, devolución, kit..." style={{ width: '100%', background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-arena)', borderRadius: 999, padding: '16px 24px 16px 56px', fontFamily: 'var(--font-body)', fontSize: 16, color: 'var(--liora-uva)', outline: 'none', boxShadow: 'var(--shadow-2)', boxSizing: 'border-box' }} />
        </div>
      </div>

      {!query && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 48, maxWidth: 1280, margin: '0 auto 48px' }}>
          {HELP_CATEGORIES.map(c => {
            const Icon = c.icon
            const active = cat === c.id
            return (
              <button key={c.id} onClick={() => { setCat(c.id); setOpenIdx(0) }} style={{ background: active ? c.color : 'var(--liora-blanco)', border: active ? '2px solid var(--liora-uva)' : '1.5px solid var(--liora-arena)', borderRadius: 20, padding: '18px 12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, transition: 'all 220ms cubic-bezier(0.22,1,0.36,1)', transform: active ? 'translateY(-3px)' : 'none' }}>
                <Icon size={26} weight="bold" color="var(--liora-uva)" />
                <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13, color: 'var(--liora-uva)', whiteSpace: 'nowrap' }}>{c.label}</span>
              </button>
            )
          })}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 32, alignItems: 'flex-start', maxWidth: 1280, margin: '0 auto' }}>
        <div>
          <div style={{ background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-arena)', borderRadius: 28, padding: 12 }}>
            {filtered.length === 0 && (
              <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--liora-uva)', opacity: 0.6 }}>No encontramos resultados para &quot;{query}&quot;</div>
                <a href={waLink} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: 16, fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, color: 'var(--liora-uva)', textDecoration: 'underline' }}>
                  ¿No encontraste lo que buscabas? Escríbenos por WhatsApp →
                </a>
              </div>
            )}
            {filtered.map((f, i) => (
              <div key={i} style={{ borderBottom: i < filtered.length - 1 ? '1.5px solid var(--liora-arena)' : 'none' }}>
                <button onClick={() => setOpenIdx(openIdx === i ? null : i)} style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', padding: '24px', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 19, color: 'var(--liora-uva)', lineHeight: 1.3 }}>{f.q}</span>
                  <span style={{ width: 32, height: 32, borderRadius: 999, background: openIdx === i ? 'var(--liora-uva)' : 'var(--liora-crema)', color: openIdx === i ? 'var(--liora-crema)' : 'var(--liora-uva)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 220ms' }}>
                    {openIdx === i ? <Minus size={18} weight="bold" /> : <Plus size={18} weight="bold" />}
                  </span>
                </button>
                {openIdx === i && (
                  <div style={{ padding: '0 24px 24px', fontFamily: 'var(--font-body)', fontSize: 15, lineHeight: 1.55, color: 'var(--liora-uva)', opacity: 0.85, maxWidth: 720 }}>{f.a}</div>
                )}
              </div>
            ))}
          </div>

          <div style={{ marginTop: 16, background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-arena)', borderRadius: 28, padding: 32 }}>
            <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 12, color: 'var(--liora-uva)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>Ayuda con tu pedido</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, color: 'var(--liora-uva)', margin: 0, fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1" }}>¿Necesitas ayuda con tu pedido?</h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--liora-uva)', opacity: 0.75, marginTop: 8, lineHeight: 1.5 }}>
              Ten a la mano tu código de pedido o el email con el que compraste. Así podremos ayudarte más rápido.
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
              {!isLoggedIn && (
                <Link href="/tracking" style={{ background: 'var(--liora-uva)', color: 'var(--liora-crema)', borderRadius: 999, padding: '12px 20px', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, textDecoration: 'none', display: 'inline-block' }}>
                  Rastrear pedido
                </Link>
              )}
              <a href={waLink} target="_blank" rel="noopener noreferrer" style={{ background: '#25D366', color: '#FBF1E2', borderRadius: 999, padding: '12px 20px', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <WhatsappLogo size={16} weight="bold" /> Escribir por WhatsApp
              </a>
            </div>
          </div>
        </div>

        <aside style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'sticky', top: 100 }}>
          <ContactCard href={waLink} bg="#25D366" Icon={WhatsappLogo} title="WhatsApp" value={waDisplay} cta="Chatear ahora →" inkColor="#FBF1E2" />
          <ContactCard href="mailto:hola@liora.pe" bg="var(--cat-cielo)" Icon={EnvelopeSimple} title="Email" value="hola@liora.pe" cta="Escribir →" />
          <ContactCard href={waCallLink} bg="var(--cat-mostaza)" Icon={Phone} title="Solicita una llamada" value="L–V · 9:00–19:00" cta="Coordinar por WhatsApp →" />
        </aside>
      </div>
    </section>
  )
}
