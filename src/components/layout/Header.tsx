'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ShoppingBag, MagnifyingGlass, UserCircle, List, X } from '@phosphor-icons/react'
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
  const [mounted, setMounted] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  useEffect(() => setMounted(true), [])
  const count = mounted ? itemCount() : 0

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  return (
    <>
      <header
        className="liora-header"
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
        {/* Left — desktop nav / mobile hamburger */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <nav className="liora-header-nav" style={{ display: 'flex', gap: 28 }}>
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

          {/* Hamburger — only visible on mobile via CSS */}
          <button
            className="liora-header-menu-btn"
            aria-label="Menú"
            onClick={() => setMenuOpen(true)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--liora-uva)',
              padding: 4,
            }}
          >
            <List size={26} weight="bold" />
          </button>
        </div>

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
              <span className="liora-header-user-name" style={{ fontWeight: 600, fontSize: 14 }}>Hola, {user.name}</span>
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

      {/* Mobile nav overlay */}
      <div className={`liora-mobile-nav${menuOpen ? ' open' : ''}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
          <Logo size={32} inverted />
          <button
            aria-label="Cerrar menú"
            onClick={() => setMenuOpen(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--liora-crema)' }}
          >
            <X size={28} weight="bold" />
          </button>
        </div>

        {NAV_LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="liora-mobile-nav-link"
            onClick={() => setMenuOpen(false)}
          >
            {l.label}
          </Link>
        ))}

        <div style={{ marginTop: 'auto', paddingTop: 32, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {user ? (
            <Link href="/cuenta" onClick={() => setMenuOpen(false)} style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 15, color: 'var(--liora-crema)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 32, height: 32, borderRadius: 999, background: 'var(--cat-lavanda)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, color: 'var(--liora-uva)' }}>
                {user.initial}
              </span>
              Hola, {user.name}
            </Link>
          ) : (
            <Link href="/login" onClick={() => setMenuOpen(false)} style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 15, color: 'var(--liora-crema)', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <UserCircle size={20} weight="regular" /> Iniciar sesión
            </Link>
          )}
        </div>
      </div>
    </>
  )
}
