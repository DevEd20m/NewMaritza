'use client'
import { useState, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { MagnifyingGlass, Sparkle } from '@phosphor-icons/react'
import { ProductCard } from '@/components/products/ProductCard'
import { trackSearch } from '@/lib/analytics/events'

const CATEGORY_COLORS: Record<string, string> = {
  piel:          'var(--cat-coral)',
  solar:         'var(--cat-mostaza)',
  bienestar:     'var(--cat-lavanda)',
  gym:           'var(--cat-durazno)',
  viaje:         'var(--cat-cielo)',
  hogar:         'var(--cat-rosa)',
  digestivo:     'var(--cat-menta)',
  'pies-cuerpo': 'var(--cat-durazno)',
}

const PAGE_SIZE = 24

const SORTS = [
  { value: 'recomendados', label: 'Recomendados' },
  { value: 'precio-asc',   label: 'Precio: menor a mayor' },
  { value: 'precio-desc',  label: 'Precio: mayor a menor' },
  { value: 'nuevos',       label: 'Novedades' },
] as const

type SortValue = typeof SORTS[number]['value']

export interface ShopProduct {
  id: string
  name: string
  slug: string
  brand: string | null
  created_at: string
  cover_image_url: string | null
  category_id: string | null
  categories: { slug: string; name?: string } | null
  product_variants: Array<{
    id: string
    name: string
    product_prices: Array<{
      amount_cents: number
      compare_at_cents: number | null
      currency: string
      effective_to: string | null
    }>
  }>
}

interface Props {
  products: ShopProduct[]
  initialCategoria?: string
  initialQ?: string
}

// Pliega acentos: "Kéfir" matchea "kefir"
const fold = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

function currentPrice(p: ShopProduct) {
  return p.product_variants?.[0]?.product_prices?.find((pp) => !pp.effective_to)?.amount_cents ?? 0
}

export function ShopProductsSection({ products, initialCategoria = '', initialQ = '' }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [categoria, setCategoria] = useState(initialCategoria)
  const [q, setQ] = useState(initialQ)
  const [sort, setSort] = useState<SortValue>('recomendados')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  // Sincronizar si el usuario navega back/forward
  useEffect(() => {
    setCategoria(searchParams.get('categoria') ?? '')
    const urlQ = searchParams.get('q')
    if (urlQ !== null) setQ(urlQ)
  }, [searchParams])

  // Al cambiar filtro/búsqueda/orden, reiniciar la paginación
  useEffect(() => { setVisibleCount(PAGE_SIZE) }, [categoria, q, sort])

  // Filtros generados desde el catálogo real (sin categorías vacías)
  const categoryFilters = useMemo(() => {
    const counts = new Map<string, { label: string; count: number }>()
    for (const p of products) {
      const slug = p.categories?.slug
      if (!slug) continue
      const entry = counts.get(slug) ?? { label: p.categories?.name ?? slug, count: 0 }
      entry.count++
      counts.set(slug, entry)
    }
    return [...counts.entries()]
      .map(([slug, { label, count }]) => ({ slug, label, count }))
      .sort((a, b) => b.count - a.count)
  }, [products])

  const handleFilter = (slug: string) => {
    setCategoria(slug)
    const params = new URLSearchParams()
    if (slug) params.set('categoria', slug)
    router.replace(slug ? `/tienda?${params.toString()}#productos-sueltos` : '/tienda#productos-sueltos', { scroll: false })
  }

  // Registrar búsquedas de la tienda en la analítica (con debounce)
  const filtered = useMemo(() => {
    let list = categoria ? products.filter((p) => p.categories?.slug === categoria) : products
    const fq = fold(q.trim())
    if (fq.length >= 2) {
      list = list.filter((p) => fold(`${p.name} ${p.brand ?? ''} ${p.categories?.name ?? ''}`).includes(fq))
    }
    switch (sort) {
      case 'precio-asc':  list = [...list].sort((a, b) => currentPrice(a) - currentPrice(b)); break
      case 'precio-desc': list = [...list].sort((a, b) => currentPrice(b) - currentPrice(a)); break
      case 'nuevos':      list = [...list].sort((a, b) => b.created_at.localeCompare(a.created_at)); break
    }
    return list
  }, [products, categoria, q, sort])

  useEffect(() => {
    if (q.trim().length < 2) return
    const t = setTimeout(() => trackSearch(q.trim(), filtered.length), 900)
    return () => clearTimeout(t)
  }, [q, filtered.length])

  const visible = filtered.slice(0, visibleCount)
  const activeLabel = categoryFilters.find((f) => f.slug === categoria)?.label

  return (
    <section id="productos-sueltos" style={{ borderTop: '1.5px solid var(--liora-arena)', paddingTop: 72 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{
          fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11,
          textTransform: 'uppercase', letterSpacing: '0.12em',
          color: 'var(--liora-uva)', opacity: 0.55, marginBottom: 10,
        }}>
          Para recompras y quien ya sabe lo que quiere
        </div>
        <h2 style={{
          fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 44,
          color: 'var(--liora-uva)', margin: 0, lineHeight: 1.0,
          fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1",
        }}>
          Productos sueltos
          {activeLabel && <span style={{ fontSize: 28, opacity: 0.45 }}> · {activeLabel}</span>}
        </h2>
      </div>

      {/* Toolbar: búsqueda + orden */}
      <div className="liora-shop-toolbar" style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
        <div style={{ flex: 1, minWidth: 240, display: 'flex', alignItems: 'center', gap: 10, background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-arena)', borderRadius: 999, padding: '12px 18px' }}>
          <MagnifyingGlass size={16} weight="bold" color="var(--liora-uva)" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Busca por nombre, marca o necesidad… ej. colágeno, protector, HAAN"
            style={{ border: 'none', outline: 'none', background: 'transparent', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--liora-uva)', width: '100%' }}
          />
          {q && (
            <button onClick={() => setQ('')} aria-label="Limpiar búsqueda" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--liora-uva)', opacity: 0.5, fontSize: 14, fontWeight: 700 }}>✕</button>
          )}
        </div>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-arena)', borderRadius: 999, padding: '10px 18px', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, color: 'var(--liora-uva)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          Ordenar:
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortValue)}
            style={{ border: 'none', outline: 'none', background: 'transparent', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13, color: 'var(--liora-uva)', cursor: 'pointer' }}
          >
            {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </label>
      </div>

      {/* Filtros de categoría con conteo real */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 36, alignItems: 'center' }}>
        <Link
          href="/tienda"
          onClick={(e) => { e.preventDefault(); handleFilter('') }}
          style={{
            fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13,
            padding: '8px 16px', borderRadius: 999, cursor: 'pointer',
            background: !categoria ? 'var(--liora-uva)' : 'var(--liora-blanco)',
            color: !categoria ? 'var(--liora-crema)' : 'var(--liora-uva)',
            border: `1.5px solid ${!categoria ? 'var(--liora-uva)' : 'var(--liora-arena)'}`,
            whiteSpace: 'nowrap', textDecoration: 'none',
          }}
        >
          Todos <span style={{ opacity: 0.5, marginLeft: 4 }}>{products.length}</span>
        </Link>
        {categoryFilters.map(({ slug, label, count }) => {
          const active = categoria === slug
          return (
            <a
              key={slug}
              href={`/tienda?categoria=${slug}`}
              onClick={(e) => { e.preventDefault(); handleFilter(slug) }}
              style={{
                fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13,
                padding: '8px 16px', borderRadius: 999, cursor: 'pointer',
                background: active ? 'var(--liora-uva)' : 'var(--liora-blanco)',
                color: active ? 'var(--liora-crema)' : 'var(--liora-uva)',
                border: `1.5px solid ${active ? 'var(--liora-uva)' : 'var(--liora-arena)'}`,
                transition: 'background 180ms, color 180ms, border-color 180ms',
                whiteSpace: 'nowrap', textDecoration: 'none',
              }}
            >
              {label} <span style={{ opacity: 0.5, marginLeft: 4 }}>{count}</span>
            </a>
          )
        })}
      </div>

      {/* Grid (responsive: 2 columnas en móvil vía .liora-grid-4) */}
      {visible.length > 0 && (
        <div className="liora-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {visible.map((p) => {
            const variant = p.product_variants?.[0]
            const price = variant?.product_prices?.find((pp) => !pp.effective_to)
            if (!variant || !price) return null
            const catSlug = p.categories?.slug ?? ''
            return (
              <ProductCard
                key={p.id}
                variantId={variant.id}
                productId={p.id}
                slug={p.slug}
                name={p.name}
                subname={variant.name}
                priceCents={price.amount_cents}
                compareAtCents={price.compare_at_cents ?? undefined}
                categoryColor={CATEGORY_COLORS[catSlug] ?? 'var(--cat-lavanda)'}
                categoryName={p.categories?.name}
                imageUrl={p.cover_image_url ?? undefined}
              />
            )
          })}
        </div>
      )}

      {/* Cargar más */}
      {filtered.length > visibleCount && (
        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--liora-uva)', opacity: 0.55, marginBottom: 14 }}>
            Mostrando {visible.length} de {filtered.length} productos
          </div>
          <button
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            style={{ background: 'transparent', border: '1.5px solid var(--liora-uva)', color: 'var(--liora-uva)', borderRadius: 999, padding: '14px 36px', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
          >
            Cargar más productos
          </button>
        </div>
      )}

      {/* Estado vacío */}
      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '56px 24px', background: 'var(--liora-blanco)', borderRadius: 28, border: '1.5px dashed var(--liora-arena)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🌿</div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, color: 'var(--liora-uva)', margin: '0 0 8px', fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1" }}>
            {q.trim() ? `No encontramos productos para “${q.trim()}”` : 'No hay productos en esta categoría'}
          </h3>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--liora-uva)', opacity: 0.65, margin: '0 0 20px' }}>
            Prueba con otra palabra — o mejor: deja que nuestra IA arme tu rutina ideal en 45 segundos.
          </p>
          <Link href="/cuestionario" style={{ background: 'var(--liora-uva)', color: 'var(--liora-crema)', borderRadius: 999, padding: '13px 26px', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <Sparkle size={15} weight="fill" /> Hacer mi cuestionario gratis
          </Link>
        </div>
      )}
    </section>
  )
}
