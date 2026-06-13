import Link from 'next/link'
import { ArrowLeft, ArrowRight } from '@phosphor-icons/react/dist/ssr'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Nosotros — LIORA',
  description: 'Conoce LIORA. Kits de autocuidado armados con criterio para que compres con claridad, no a ciegas.',
}

const STATS = [
  ['Kits guiados',    'seleccionados con criterio, no al azar'],
  ['Rutinas simples', 'menos pasos innecesarios en tu día'],
  ['Soporte cercano', 'acompañamiento antes y después de comprar'],
  ['Compra más clara','sabes qué eliges y por qué'],
]

const VALUES = [
  { n: '01', title: 'Tu cuerpo manda.', desc: 'No hay "fórmula universal". Cada kit responde al cuestionario y al historial de cada persona — no a una tendencia.', bg: 'var(--cat-coral)' },
  { n: '02', title: 'Sin redundancia.', desc: 'Si ya usas algo parecido, te ayudamos a evitar duplicados. Preferimos recomendar con cuidado antes que llenar tu rutina de productos.', bg: 'var(--cat-menta)' },
  { n: '03', title: 'Hablamos claro.', desc: 'Sin "déficit", sin "patología", sin promesas mágicas. Te decimos lo que sabemos y lo que no.', bg: 'var(--cat-lavanda)' },
]

const TEAM = [
  { name: 'Andrea', role: 'Founder',  bg: 'var(--cat-coral)' },
  { name: 'Lucía',  role: 'Nutri',    bg: 'var(--cat-menta)' },
  { name: 'Vale',   role: 'Skin',     bg: 'var(--cat-lavanda)' },
  { name: 'Marco',  role: 'Taller',   bg: 'var(--cat-mostaza)' },
  { name: 'Diana',  role: 'CX',       bg: 'var(--cat-cielo)' },
  { name: 'Sofi',   role: 'Brand',    bg: 'var(--cat-rosa)' },
]

export default function NosotrosPage() {
  return (
    <section style={{ background: 'var(--liora-crema)' }}>
      <div style={{ padding: '32px 48px 0' }}>
        <Link href="/" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--liora-uva)', fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', whiteSpace: 'nowrap' }}>
          <ArrowLeft size={16} weight="bold" /> Volver
        </Link>
      </div>

      {/* Hero */}
      <div style={{ padding: '48px 48px 96px' }}>
        <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 12, color: 'var(--liora-uva)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 16 }}>Sobre nosotros</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 96, lineHeight: 1.05, letterSpacing: '-0.03em', color: 'var(--liora-uva)', margin: 0, maxWidth: 1000, paddingBottom: 16, fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1" }}>
          Bienestar que <span style={{ fontFamily: 'var(--font-script)' }}>cabe</span> en tu vida.
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 20, lineHeight: 1.5, color: 'var(--liora-uva)', opacity: 0.85, marginTop: 28, maxWidth: 720 }}>
          Empezamos con una idea simple: nadie debería comprar productos de autocuidado a ciegas.
          Tu piel, tu rutina, tu viaje y tu bienestar no se parecen a los de nadie más.
          Por eso LIORA arma kits guiados según lo que necesitas, cómo vives y qué debes evitar.
        </p>
      </div>

      {/* Stats band */}
      <div style={{ background: 'var(--liora-uva)', color: 'var(--liora-crema)', padding: '64px 48px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32, maxWidth: 1280, margin: '0 auto' }}>
          {STATS.map(([num, label]) => (
            <div key={num}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 72, lineHeight: 0.95, color: 'var(--liora-lima)', letterSpacing: '-0.03em', fontVariationSettings: "'opsz' 144,'SOFT' 60,'WONK' 0" }}>{num}</div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.4, opacity: 0.85, marginTop: 8, maxWidth: 200 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Values */}
      <div style={{ padding: '96px 48px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 12, color: 'var(--liora-uva)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>Nuestros valores</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 56, lineHeight: 1, letterSpacing: '-0.025em', color: 'var(--liora-uva)', margin: 0, marginBottom: 48, fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1" }}>Lo que nos guía.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {VALUES.map(v => (
              <article key={v.n} style={{ background: v.bg, borderRadius: 28, padding: 32, minHeight: 320, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 48, color: 'var(--liora-uva)', lineHeight: 1, fontVariationSettings: "'opsz' 144,'SOFT' 60,'WONK' 0" }}>{v.n}</div>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, color: 'var(--liora-uva)', margin: 0, lineHeight: 1.05, fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1" }}>{v.title}</h3>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, lineHeight: 1.5, color: 'var(--liora-uva)', margin: 0, marginTop: 12 }}>{v.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      {/* Team */}
      <div style={{ padding: '0 48px 96px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-arena)', borderRadius: 32, padding: 48, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 12, color: 'var(--liora-uva)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>Quienes lo hacen</div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 40, color: 'var(--liora-uva)', margin: 0, lineHeight: 1, fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1" }}>14 personas. Un taller en Lima. Cero magia.</h3>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, lineHeight: 1.5, color: 'var(--liora-uva)', opacity: 0.85, marginTop: 20 }}>
              Diseñamos cada kit con información clara, reglas de seguridad y guías de uso.
              Cuando una respuesta requiere atención profesional, lo decimos.
              Las personas detrás de cada kit trabajan desde Lima para que llegue armado y listo.
            </p>
            <Link href="/cuestionario" style={{ background: 'var(--liora-uva)', color: 'var(--liora-crema)', border: 'none', borderRadius: 999, padding: '14px 24px', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 15, cursor: 'pointer', marginTop: 28, display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
              Hacer mi cuestionario <ArrowRight size={16} weight="bold" />
            </Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {TEAM.map(p => (
              <div key={p.name} style={{ background: p.bg, borderRadius: 20, aspectRatio: '1/1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, padding: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 999, background: 'var(--liora-crema)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: 'var(--liora-uva)' }}>{p.name.charAt(0)}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: 'var(--liora-uva)' }}>{p.name}</div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--liora-uva)', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{p.role}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
