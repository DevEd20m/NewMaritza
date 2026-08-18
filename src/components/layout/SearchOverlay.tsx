'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MagnifyingGlass, Plus, Package, Check } from '@phosphor-icons/react'
import { useCartStore } from '@/lib/store/cart'
import { trackAddToCart, trackSearch } from '@/lib/analytics/events'

interface IndexProduct {
  variantId: string
  productId: string
  name: string
  brand: string | null
  slug: string
  variantName: string
  categoryName: string
  priceCents: number
  currency: string
  imageUrl: string | null
  categoryColor: string
}

interface IndexKit {
  name: string
  slug: string
  coverImageUrl: string | null
  totalCents: number
  productCount: number
}

interface SearchIndex { products: IndexProduct[]; kits: IndexKit[] }

// Cache a nivel de módulo: el overlay se monta/desmonta en cada apertura,
// pero el índice se descarga una sola vez por sesión.
let cachedIndex: SearchIndex | null = null

// Pliega acentos preservando la longitud (para poder resaltar el match sobre
// el texto original): "Kéfir" → "kefir", mismo largo.
function fold(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .normalize('NFC')
}

function Highlight({ text, query }: { text: string; query: string }) {
  const idx = fold(text).indexOf(fold(query))
  if (idx < 0 || !query) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: 'var(--liora-lima)', borderRadius: 4, padding: '0 2px', color: 'inherit' }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  )
}

const SUGGESTIONS = ['colágeno', 'melatonina', 'protector solar', 'kéfir']

interface Props {
  onClose: () => void
}

// Se monta solo mientras está abierto (el Header lo renderiza condicionalmente),
// así cada apertura arranca con el input limpio sin estados sincronizados.
export function SearchOverlay({ onClose }: Props) {
  const router = useRouter()
  const { addItem, isOpen: cartOpen } = useCartStore()
  const cartItems = useCartStore((s) => s.items)
  const [query, setQuery] = useState('')
  const [index, setIndex] = useState<SearchIndex | null>(cachedIndex)
  const inputRef = useRef<HTMLInputElement>(null)
  const trackTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (cachedIndex) return
    fetch('/api/search-index')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data) { cachedIndex = data; setIndex(data) } })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 50)
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(t)
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const q = query.trim()
  const results = useMemo(() => {
    if (!index || q.length < 2) return null
    const fq = fold(q)
    const kits = index.kits.filter((k) => fold(k.name).includes(fq)).slice(0, 3)
    const products = index.products
      .filter((p) => fold(`${p.name} ${p.brand ?? ''} ${p.categoryName}`).includes(fq))
      .slice(0, 8)
    return { kits, products, total: kits.length + products.length }
  }, [index, q])

  // Registrar la búsqueda (con debounce) para la analítica
  useEffect(() => {
    if (trackTimer.current) clearTimeout(trackTimer.current)
    if (!results || q.length < 2) return
    trackTimer.current = setTimeout(() => trackSearch(q, results.total), 900)
    return () => { if (trackTimer.current) clearTimeout(trackTimer.current) }
  }, [q, results])

  const goTo = useCallback((href: string) => {
    onClose()
    router.push(href)
  }, [onClose, router])

  const addProduct = (p: IndexProduct) => {
    addItem({
      variantId: p.variantId,
      productId: p.productId,
      name: p.name,
      variantName: p.variantName,
      priceCents: p.priceCents,
      currency: p.currency,
      imageUrl: p.imageUrl ?? undefined,
      categoryColor: p.categoryColor,
    })
    trackAddToCart({ variantId: p.variantId, name: p.name, priceCents: p.priceCents, quantity: 1, currency: p.currency, productSlug: p.slug })
  }

  if (cartOpen) return null

  const fmt = (cents: number) => `S/${Math.round(cents / 100)}`

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(44,17,41,0.55)', zIndex: 120, backdropFilter: 'blur(3px)' }}
      />
      <div
        role="dialog"
        aria-label="Buscar productos"
        style={{
          position: 'fixed', top: 64, left: '50%', transform: 'translateX(-50%)',
          width: 'min(720px, calc(100vw - 24px))', zIndex: 121,
          background: 'var(--liora-crema)', borderRadius: 28,
          boxShadow: '0 24px 80px rgba(0,0,0,0.45)', overflow: 'hidden',
          display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 96px)',
        }}
      >
        {/* Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '20px 24px', borderBottom: '1.5px solid var(--liora-arena)' }}>
          <MagnifyingGlass size={22} weight="bold" color="var(--liora-uva)" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Busca por nombre, marca o necesidad…"
            style={{
              flex: 1, border: 'none', outline: 'none', background: 'transparent',
              fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 22, color: 'var(--liora-uva)',
            }}
          />
          <button onClick={onClose} aria-label="Cerrar buscador" style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, border: '1.5px solid var(--liora-arena)', background: 'transparent', color: 'var(--liora-uva)', borderRadius: 8, padding: '4px 8px', opacity: 0.6, cursor: 'pointer' }}>
            ESC
          </button>
        </div>

        {/* Cuerpo */}
        <div style={{ overflowY: 'auto', padding: results ? '10px 12px 16px' : 0 }}>
          {!results && (
            <div style={{ padding: '28px 24px', textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--liora-uva)', opacity: 0.6, margin: 0 }}>
                Escribe al menos 2 letras — por ejemplo:
              </p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginTop: 14 }}>
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => setQuery(s)} style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, border: '1.5px solid var(--liora-arena)', background: 'var(--liora-blanco)', color: 'var(--liora-uva)', borderRadius: 999, padding: '7px 14px', cursor: 'pointer' }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {results && results.total === 0 && (
            <div style={{ textAlign: 'center', padding: '38px 28px' }}>
              <div style={{ fontSize: 34, marginBottom: 8 }}>🌿</div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 21, color: 'var(--liora-uva)', margin: '0 0 6px', fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1" }}>
                No tenemos “{q}”… todavía
              </h3>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--liora-uva)', opacity: 0.65, margin: '0 0 18px' }}>
                Pero nuestra IA puede armarte una rutina con lo que tu cuerpo necesita.
              </p>
              <button onClick={() => goTo('/cuestionario')} style={{ background: 'var(--liora-uva)', color: 'var(--liora-crema)', border: 'none', borderRadius: 999, padding: '13px 26px', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                ✨ Hacer mi cuestionario gratis
              </button>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginTop: 18 }}>
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => setQuery(s)} style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, border: '1.5px solid var(--liora-arena)', background: 'var(--liora-blanco)', color: 'var(--liora-uva)', borderRadius: 999, padding: '7px 14px', cursor: 'pointer' }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {results && results.kits.length > 0 && (
            <>
              <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--liora-uva)', opacity: 0.55, padding: '14px 14px 8px' }}>
                Rutinas y kits
              </div>
              {results.kits.map((k) => (
                <Link key={k.slug} href={`/tienda/kit/${k.slug}`} onClick={onClose} style={{ textDecoration: 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'var(--cat-menta)', borderRadius: 18, padding: '12px 16px', margin: '0 4px 6px', cursor: 'pointer' }}>
                    <div style={{ width: 56, height: 56, borderRadius: 12, overflow: 'hidden', background: 'rgba(255,255,255,0.6)', flexShrink: 0 }}>
                      {k.coverImageUrl
                        ? <img src={k.coverImageUrl} alt={k.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package size={22} color="var(--liora-uva)" /></div>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17, lineHeight: 1.15, color: 'var(--liora-uva)' }}>
                        <Highlight text={k.name} query={q} />
                      </div>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--liora-uva)', opacity: 0.7, marginTop: 2 }}>
                        {k.productCount} productos · rutina completa
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <span style={{ background: 'var(--liora-uva)', color: 'var(--liora-crema)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', borderRadius: 999, padding: '3px 8px', fontFamily: 'var(--font-body)' }}>Kit</span>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: 'var(--liora-uva)' }}>{fmt(k.totalCents)}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </>
          )}

          {results && results.products.length > 0 && (
            <>
              <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--liora-uva)', opacity: 0.55, padding: '14px 14px 8px' }}>
                Productos
              </div>
              {results.products.map((p) => {
                const inCart = cartItems.some((i) => i.variantId === p.variantId)
                return (
                  <div key={p.variantId} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 14px', borderRadius: 16 }}>
                    <Link href={`/tienda/${p.slug}`} onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0, textDecoration: 'none' }}>
                      <div style={{ width: 52, height: 52, borderRadius: 12, background: p.categoryColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                        {p.imageUrl
                          ? <img src={p.imageUrl} alt={p.name} style={{ width: '82%', height: '82%', objectFit: 'contain' }} />
                          : <Package size={20} color="var(--liora-uva)" style={{ opacity: 0.5 }} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, lineHeight: 1.2, color: 'var(--liora-uva)' }}>
                          <Highlight text={p.name} query={q} />
                        </div>
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--liora-uva)', opacity: 0.6, marginTop: 2 }}>
                          {[p.brand, p.categoryName, p.variantName].filter(Boolean).join(' · ')}
                        </div>
                      </div>
                    </Link>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: 'var(--liora-uva)' }}>{fmt(p.priceCents)}</span>
                      <button
                        onClick={() => addProduct(p)}
                        aria-label={`Agregar ${p.name}`}
                        style={{ width: 32, height: 32, borderRadius: 999, background: inCart ? 'var(--cat-menta)' : 'var(--liora-uva)', color: inCart ? 'var(--liora-uva)' : 'var(--liora-crema)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                      >
                        {inCart ? <Check size={15} weight="bold" /> : <Plus size={15} weight="bold" />}
                      </button>
                    </div>
                  </div>
                )
              })}
            </>
          )}
        </div>

        {results && results.total > 0 && (
          <button
            onClick={() => goTo(`/tienda?q=${encodeURIComponent(q)}#productos-sueltos`)}
            style={{ textAlign: 'center', padding: 14, fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, border: 'none', borderTop: '1.5px solid var(--liora-arena)', background: 'var(--liora-blanco)', color: 'var(--liora-uva)', cursor: 'pointer', width: '100%' }}
          >
            Ver todos los resultados en la tienda →
          </button>
        )}
      </div>
    </>
  )
}
