'use client'

import { useState } from 'react'
import { KitMiniCard, CarouselItem } from './SuggestionCarousel'
import type { RelatedKit } from '@/lib/recommendation/related'

// Sección de kits de /tienda: carrusel horizontal compacto con card final
// "+N ver todos" que expande la lista completa en grid.

const CAROUSEL_COUNT = 7

export function KitsShowcase({ kits }: { kits: RelatedKit[] }) {
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? kits : kits.slice(0, CAROUSEL_COUNT)
  const remaining = kits.length - CAROUSEL_COUNT

  if (expanded) {
    return (
      <div>
        <div className="liora-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {visible.map((k) => (
            <div key={k.id} style={{ display: 'flex' }}>
              <KitMiniCard kit={k} />
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <button
            onClick={() => setExpanded(false)}
            style={{ background: 'transparent', border: '1.5px solid var(--liora-uva)', color: 'var(--liora-uva)', borderRadius: 999, padding: '12px 28px', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
          >
            Ver menos
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', gap: 16, overflowX: 'auto', scrollSnapType: 'x mandatory', paddingBottom: 14, WebkitOverflowScrolling: 'touch' }}>
      {visible.map((k) => (
        <CarouselItem key={k.id} width={280}>
          <KitMiniCard kit={k} />
        </CarouselItem>
      ))}
      {remaining > 0 && (
        <CarouselItem width={280}>
          <button
            onClick={() => setExpanded(true)}
            style={{
              flex: 1, height: 330, background: 'transparent', border: '2px dashed var(--liora-arena)',
              borderRadius: 24, cursor: 'pointer', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 12, color: 'var(--liora-uva)',
            }}
          >
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 40, fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1" }}>+{remaining}</span>
            <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, opacity: 0.7 }}>Ver todos<br />los kits →</span>
          </button>
        </CarouselItem>
      )}
    </div>
  )
}
