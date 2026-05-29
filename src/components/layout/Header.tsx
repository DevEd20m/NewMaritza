'use client'
import Link from 'next/link'
import { ShoppingBag, MagnifyingGlass, UserCircle } from '@phosphor-icons/react'
import { Logo } from './Logo'
import { useCartStore } from '@/lib/store/cart'

interface HeaderProps {
  user?: { name: string; initial: string } | null
}

const NAV_LINKS = [
  { href: '/tienda', label: 'Tienda' },
  { href: '/cuestionario', label: 'Cuestionario' },
  { href: '/nosotros', label: 'Nosotros' },
  { href: '/ayuda', label: 'Ayuda' },
]

export function Header({ user }: HeaderProps) {
  const { itemCount, setIsOpen, isOpen } = useCartStore()
  const count = itemCount()

  return (
    <header
      style={{
        background: 'var(--liora-crema)',
        padding: '18px 48px',
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        gap: 24,
        borderBottom: '1.5px solid var(--liora-arena)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Left nav */}
      <nav style={{ display: 'flex', gap: 28 }}>
        {NAV_LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              fontSize: 14,
              color: 'var(--liora-uva)',
              whiteSpace: 'nowrap',
            }}
          >
            {l.label}
          </Link>
        ))}
      </nav>

      {/* Center logo */}
      <div style={{ textAlign: 'center' }}>
        <Logo size={36} />
      </div>

      {/* Right actions */}
      <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end', alignItems: 'center' }}>
        <button
          aria-label="Buscar"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--liora-uva)', fontSize: 22, display: 'flex' }}
        >
          <MagnifyingGlass size={22} weight="regular" />
        </button>

        {user ? (
          <Link
            href="/cuenta"
            style={{
              background: 'var(--liora-blanco)',
              border: '1.5px solid var(--liora-arena)',
              borderRadius: 999,
              padding: '5px 14px 5px 5px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              fontFamily: 'var(--font-body)',
              color: 'var(--liora-uva)',
              textDecoration: 'none',
            }}
          >
            <span
              style={{
                width: 30,
                height: 30,
                borderRadius: 999,
                background: 'var(--cat-lavanda)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: 13,
                color: 'var(--liora-uva)',
              }}
            >
              {user.initial}
            </span>
            <span style={{ fontWeight: 600, fontSize: 14 }}>Hola, {user.name}</span>
          </Link>
        ) : (
          <Link
            href="/login"
            aria-label="Mi cuenta"
            style={{ color: 'var(--liora-uva)', fontSize: 22, display: 'flex' }}
          >
            <UserCircle size={22} weight="regular" />
          </Link>
        )}

        <button
          aria-label={`Carrito — ${count} productos`}
          onClick={() => setIsOpen(!isOpen)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--liora-uva)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            position: 'relative',
          }}
        >
          <ShoppingBag size={22} weight="regular" />
          {count > 0 && (
            <span
              style={{
                background: 'var(--liora-lima)',
                color: 'var(--liora-uva)',
                fontSize: 11,
                fontWeight: 700,
                fontFamily: 'var(--font-body)',
                borderRadius: 999,
                padding: '2px 7px',
                lineHeight: 1.2,
              }}
            >
              {count}
            </span>
          )}
        </button>
      </div>
    </header>
  )
}
