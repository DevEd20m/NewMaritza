import Link from 'next/link'
import { InstagramLogo, TiktokLogo, WhatsappLogo, EnvelopeSimple } from '@phosphor-icons/react/dist/ssr'
import { Logo } from './Logo'
import { createAdminClient } from '@/lib/supabase/admin'

const STATIC_LINKS = {
  Tienda: [
    { href: '/tienda', label: 'Todos los productos' },
    { href: '/tienda?modo=kits', label: 'Kits' },
    { href: '/cuestionario', label: 'Cuestionario' },
  ],
  Ayuda: [
    { href: '/ayuda', label: 'Preguntas frecuentes' },
    { href: '/ayuda#envios', label: 'Envíos y tracking' },
    { href: '/ayuda#devoluciones', label: 'Devoluciones' },
    { href: '/contacto', label: 'Contacto' },
  ],
  Nosotros: [
    { href: '/nosotros', label: 'Sobre nosotros' },
    { href: '/nosotros#sostenibilidad', label: 'Sostenibilidad' },
    { href: '/privacidad', label: 'Privacidad' },
    { href: '/terminos', label: 'Términos' },
  ],
}

async function getActiveKits() {
  const admin = createAdminClient()
  const { data } = await admin.from('kits').select('name, slug').eq('is_active', true).order('name')
  return (data ?? []) as { name: string; slug: string }[]
}

export async function Footer() {
  const kits = await getActiveKits()
  return (
    <footer
      className="liora-footer-root"
      style={{
        background: 'var(--liora-uva-deep)',
        color: 'var(--liora-crema)',
        padding: '80px 48px 40px',
      }}
    >
      <div className="liora-footer-grid" style={{ display: 'grid', gridTemplateColumns: `1.4fr repeat(${kits.length > 0 ? 4 : 3}, 1fr)`, gap: 48, marginBottom: 64 }}>
        {/* Brand */}
        <div>
          <Logo size={40} inverted />
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 15,
              lineHeight: 1.5,
              opacity: 0.8,
              marginTop: 24,
              maxWidth: 280,
            }}
          >
            Bienestar personalizado. Tu cuerpo no es como el de nadie — tu kit tampoco.
          </p>
          <div style={{ display: 'flex', gap: 14, marginTop: 24 }}>
            {([
              { Icon: InstagramLogo, key: 'ig', href: '#' },
              { Icon: TiktokLogo, key: 'tt', href: '#' },
              { Icon: WhatsappLogo, key: 'wa', href: '#' },
              { Icon: EnvelopeSimple, key: 'em', href: '#' },
            ] as const).map(({ Icon, key, href }) => (
              <Link key={key} href={href} style={{ color: 'var(--liora-crema)', display: 'flex' }}>
                <Icon size={22} />
              </Link>
            ))}
          </div>
        </div>

        {/* Kits column */}
        {kits.length > 0 && (
          <div>
            <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--liora-lima)', marginBottom: 18 }}>
              Kits
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {kits.map((k) => (
                <li key={k.slug}>
                  <Link href={`/tienda/kit/${k.slug}`} style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--liora-crema)', opacity: 0.85 }}>
                    {k.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Static link columns */}
        {Object.entries(STATIC_LINKS).map(([title, links]) => (
          <div key={title}>
            <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--liora-lima)', marginBottom: 18 }}>
              {title}
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--liora-crema)', opacity: 0.85 }}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div
        style={{
          borderTop: '1.5px solid rgba(251,241,226,0.15)',
          paddingTop: 32,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, opacity: 0.6 }}>
          © {new Date().getFullYear()} LIORA — Todos los derechos reservados.
        </span>
        <div style={{ display: 'flex', gap: 20, fontFamily: 'var(--font-body)', fontSize: 13, opacity: 0.7 }}>
          <Link href="/terminos" style={{ color: 'var(--liora-crema)' }}>Términos</Link>
          <Link href="/privacidad" style={{ color: 'var(--liora-crema)' }}>Privacidad</Link>
        </div>
      </div>
    </footer>
  )
}
