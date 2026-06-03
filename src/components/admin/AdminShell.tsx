'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { SquaresFour, Receipt, Package, Sparkle, UsersThree, Bell, ClipboardText, Ticket, GearSix, Tag, ChartBar } from '@phosphor-icons/react'

const NAV = [
  { href: '/admin',                  label: 'Dashboard',    Icon: SquaresFour },
  { href: '/admin/pedidos',          label: 'Pedidos',      Icon: Receipt },
  { href: '/admin/productos',        label: 'Productos',    Icon: Package },
  { href: '/admin/kits',             label: 'Kits',         Icon: Sparkle },
  { href: '/admin/cupones',          label: 'Cupones',      Icon: Ticket },
  { href: '/admin/cuestionario',     label: 'Cuestionario', Icon: ClipboardText },
  { href: '/admin/tags',             label: 'Tags',         Icon: Tag },
  { href: '/admin/analytics',        label: 'Analítica',    Icon: ChartBar },
  { href: '/admin/clientes',         label: 'Clientes',     Icon: UsersThree },
  { href: '/admin/configuracion',    label: 'Configuración', Icon: GearSix },
]

function getPageTitle(pathname: string) {
  const found = NAV.find(n => pathname === n.href || pathname.startsWith(n.href + '/'))
  return found?.label ?? 'Admin'
}

export function AdminShell({ children, adminName }: { children: React.ReactNode; adminName: string }) {
  const pathname = usePathname()
  const title = getPageTitle(pathname)
  const initials = adminName.slice(0, 2).toUpperCase()

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--liora-crema)' }}>
      {/* Sidebar */}
      <aside style={{ background: 'var(--liora-uva)', width: 240, flexShrink: 0, minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '20px 22px 18px' }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--liora-lima)', color: 'var(--liora-uva)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 18, fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1" }}>L</div>
          <div style={{ lineHeight: 1.1 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17, color: 'var(--liora-crema)', letterSpacing: '0.04em', fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1" }}>LIORA</div>
            <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 9, color: 'var(--liora-lima)', textTransform: 'uppercase', letterSpacing: '0.18em', marginTop: 2 }}>Admin</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '12px 12px 16px' }}>
          <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 10, color: 'var(--liora-crema)', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.16em', padding: '8px 12px 6px' }}>Operación</div>
          {NAV.map(item => {
            const active = pathname === item.href
            const { Icon } = item
            return (
              <Link key={item.href} href={item.href} style={{ background: active ? 'var(--liora-lima)' : 'transparent', color: active ? 'var(--liora-uva)' : 'var(--liora-crema)', border: 'none', borderRadius: 12, padding: '11px 14px', fontFamily: 'var(--font-body)', fontWeight: active ? 700 : 500, fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 12, textDecoration: 'none', transition: 'background 150ms, color 150ms' }}>
                <Icon size={17} weight="bold" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Admin user footer */}
        <div style={{ marginTop: 'auto', padding: '16px 12px', borderTop: '1.5px solid rgba(251,241,226,0.08)' }}>
          <div style={{ background: 'rgba(251,241,226,0.05)', borderRadius: 14, padding: '12px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 999, background: 'var(--cat-mostaza)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--liora-uva)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, flexShrink: 0 }}>{initials}</div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13, color: 'var(--liora-crema)', lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{adminName}</div>
              <div style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 10, color: 'var(--liora-lima)', textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: 2 }}>Admin</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', overflow: 'hidden' }}>
        {/* Topbar */}
        <header style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 32px', background: 'rgba(251,241,226,0.92)', backdropFilter: 'saturate(160%) blur(12px)', borderBottom: '1.5px solid var(--liora-arena)', position: 'sticky', top: 0, zIndex: 20 }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--liora-uva)', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span style={{ opacity: 0.55 }}>Panel</span>
            <span style={{ opacity: 0.4, fontSize: 12 }}>›</span>
            <span style={{ fontWeight: 700 }}>{title}</span>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <button style={{ background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-arena)', color: 'var(--liora-uva)', width: 38, height: 38, borderRadius: 999, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <Bell size={15} weight="bold" />
              <span style={{ position: 'absolute', top: 6, right: 7, width: 8, height: 8, borderRadius: 999, background: 'var(--liora-lima)', border: '1.5px solid var(--liora-blanco)' }} />
            </button>
          </div>
        </header>

        <main style={{ flex: 1, padding: '40px 40px', overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
