'use client'
import { useState } from 'react'
import Link from 'next/link'
import type { Icon, IconWeight } from '@phosphor-icons/react'
import { ArrowLeft, Truck, ArrowUUpLeft, MapPin, CreditCard, Sparkle, ChatCircle, MagnifyingGlass, Plus, Minus, WhatsappLogo, EnvelopeSimple, Phone } from '@phosphor-icons/react'

const HELP_CATEGORIES = [
  { id: 'envios',       label: 'Envíos',       icon: Truck,           color: 'var(--cat-mostaza)' },
  { id: 'devoluciones', label: 'Devoluciones', icon: ArrowUUpLeft,    color: 'var(--cat-coral)' },
  { id: 'tracking',     label: 'Tracking',     icon: MapPin,          color: 'var(--cat-menta)' },
  { id: 'pagos',        label: 'Pagos',        icon: CreditCard,      color: 'var(--cat-cielo)' },
  { id: 'kits',         label: 'Kits & quiz',  icon: Sparkle,         color: 'var(--cat-lavanda)' },
  { id: 'contacto',     label: 'Contacto',     icon: ChatCircle,      color: 'var(--cat-rosa)' },
]

function buildFaqs(whatsappNumber: string, deliveryTime: string, shippingCost: number) {
  const waDisplay = whatsappNumber.startsWith('51') ? `+${whatsappNumber}` : whatsappNumber
  const shippingSoles = `S/${(shippingCost / 100).toFixed(0)}`
  return {
    envios: [
      { q: '¿Cuánto demora el envío en Lima?',              a: `${deliveryTime}. El tracking llega a tu correo y WhatsApp.` },
      { q: '¿El envío es gratis?',                          a: `Sí, en pedidos sobre S/200. Para pedidos menores, el envío es ${shippingSoles} a Lima.` },
      { q: '¿Puedo cambiar mi dirección después de pagar?', a: 'Sí, mientras el pedido no haya salido del taller. Escríbenos por WhatsApp o desde Mi Cuenta → Pedido → Editar dirección.' },
    ],
    devoluciones: [
      { q: '¿Tienen garantía los productos?',           a: '30 días desde la entrega. Si no te funciona o llegó dañado, te devolvemos el 100% o te lo cambiamos. Sin preguntas raras.' },
      { q: '¿Cómo devuelvo un producto?',               a: 'Desde Mi Cuenta → Pedido → "Devolver". Te enviamos un courier a recoger en 24h. Sin costo.' },
      { q: '¿Puedo devolver solo un producto del kit?', a: 'Sí. Te abonamos el valor unitario de ese producto (no el del kit completo, porque los kits tienen descuento por bundle).' },
    ],
    tracking: [
      { q: '¿Dónde veo mi código de tracking?',             a: 'Te lo enviamos por email y WhatsApp apenas tu pedido sale del taller. También está en Mi Cuenta → Pedidos.' },
      { q: '¿Qué hago si dice "Entregado" pero no llegó?',  a: 'Escríbenos en menos de 24h. Verificamos con el repartidor y, si fue extraviado, te enviamos un nuevo kit sin costo.' },
      { q: '¿Puedo coordinar la entrega?',                  a: 'Sí, cuando el pedido esté en estado "En reparto" recibes un SMS para coordinar ventana de entrega con el repartidor.' },
    ],
    pagos: [
      { q: '¿Qué métodos de pago aceptan?',  a: 'Visa, Mastercard y AmEx. Todo procesado con encriptación SSL — no guardamos los datos de tu tarjeta.' },
      { q: '¿Puedo pagar en cuotas?',        a: 'Sí, hasta 6 cuotas sin intereses con tarjetas Visa y Mastercard de bancos peruanos.' },
      { q: '¿Cómo aplico un cupón?',         a: 'En el resumen del carrito, ingresa el código y haz "Aplicar". Verás el descuento reflejado al instante.' },
    ],
    kits: [
      { q: '¿Qué es un kit personalizado?',          a: 'Es una combinación de 3 a 6 productos elegida a partir de tu cuestionario. Siempre más barato que comprar los productos por separado.' },
      { q: '¿Puedo cambiar productos de mi kit?',    a: 'Claro. En la pantalla del kit puedes quitar productos, sumar otros o pedirle a Lía (nuestra asistente) sustituciones equivalentes.' },
      { q: '¿Cada cuánto debo rehacer el cuestionario?', a: 'Recomendamos cada 6 meses, o cuando cambies de rutina (nueva temporada, embarazo, lesión, etc).' },
    ],
    contacto: [
      { q: '¿Cómo escribo al equipo?',              a: `Por WhatsApp al ${waDisplay}, por email a hola@liora.pe, o desde el chat aquí abajo. Respondemos en menos de 2 horas en horario laboral.` },
      { q: '¿Tienen tienda física?',                 a: 'Nuestro taller está en Surquillo y se puede visitar con cita previa. Escríbenos si quieres conocernos.' },
      { q: '¿Trabajan con influencers o afiliados?', a: 'Sí — escríbenos a colab@liora.pe con tu perfil y nos contactamos en 48h.' },
    ],
  }
}

function ContactCard({ bg, Icon, title, value, cta, inkColor = 'var(--liora-uva)' }: { bg: string; Icon: Icon; title: string; value: string; cta: string; inkColor?: string }) {
  return (
    <button style={{ background: bg, borderRadius: 24, padding: 24, border: 'none', textAlign: 'left', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 8, color: inkColor, width: '100%' }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(251,241,226,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: inkColor, fontSize: 22 }}>
        <Icon size={22} weight={'bold' as IconWeight} />
      </div>
      <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.8 }}>{title}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, marginTop: 4 }}>{cta}</div>
    </button>
  )
}

interface Props {
  whatsappNumber: string
  deliveryTime: string
  shippingCostCents: number
}

export function AyudaClient({ whatsappNumber, deliveryTime, shippingCostCents }: Props) {
  const [cat, setCat] = useState('envios')
  const [openIdx, setOpenIdx] = useState<number | null>(0)
  const [query, setQuery] = useState('')

  const HELP_FAQS = buildFaqs(whatsappNumber, deliveryTime, shippingCostCents)
  const faqs = HELP_FAQS[cat as keyof typeof HELP_FAQS] ?? []
  const filtered = query
    ? Object.values(HELP_FAQS).flat().filter(f => f.q.toLowerCase().includes(query.toLowerCase()) || f.a.toLowerCase().includes(query.toLowerCase()))
    : faqs

  const waDisplay = whatsappNumber.startsWith('51') ? `+${whatsappNumber}` : whatsappNumber

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
        <div style={{ position: 'relative', maxWidth: 520, margin: '32px auto 0' }}>
          <MagnifyingGlass size={20} style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', color: 'var(--liora-uva)' }} />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Busca tu pregunta…" style={{ width: '100%', background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-arena)', borderRadius: 999, padding: '16px 24px 16px 56px', fontFamily: 'var(--font-body)', fontSize: 16, color: 'var(--liora-uva)', outline: 'none', boxShadow: 'var(--shadow-2)', boxSizing: 'border-box' }} />
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
        <div style={{ background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-arena)', borderRadius: 28, padding: 12 }}>
          {filtered.length === 0 && (
            <div style={{ padding: '48px 24px', textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--liora-uva)', opacity: 0.6 }}>No encontramos resultados para &quot;{query}&quot;</div>
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

        <aside style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'sticky', top: 100 }}>
          <ContactCard bg="#25D366" Icon={WhatsappLogo} title="WhatsApp" value={waDisplay} cta="Chatear ahora" inkColor="#FBF1E2" />
          <ContactCard bg="var(--cat-cielo)" Icon={EnvelopeSimple} title="Email" value="hola@liora.pe" cta="Escribir →" />
          <ContactCard bg="var(--cat-mostaza)" Icon={Phone} title="Llámanos" value="L–V · 9am–7pm" cta="Solicitar llamada →" />
        </aside>
      </div>
    </section>
  )
}
