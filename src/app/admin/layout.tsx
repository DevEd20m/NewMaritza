import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

const NAV = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/productos', label: 'Productos' },
  { href: '/admin/kits', label: 'Kits' },
  { href: '/admin/pedidos', label: 'Pedidos' },
  { href: '/admin/cupones', label: 'Cupones' },
  { href: '/admin/categorias', label: 'Categorías' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/')

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--liora-crema)' }}>
      {/* Sidebar */}
      <aside style={{ width: 240, background: 'var(--liora-uva-deep)', padding: '32px 0', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '0 24px 32px', fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 24, color: 'var(--liora-crema)', letterSpacing: '-0.03em', fontVariationSettings: "'opsz' 80,'SOFT' 60,'WONK' 0" }}>
          LIORA
          <span style={{ color: 'var(--liora-lima)' }}> *</span>
          <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 10, opacity: 0.5, letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 4 }}>Admin Panel</div>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              style={{ padding: '12px 24px', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, color: 'var(--liora-crema)', opacity: 0.8, display: 'block' }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: '40px 48px', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  )
}
