'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { Barbell, Leaf, Drop, Sun, Moon, Airplane, House, Sneaker, FolderSimple } from '@phosphor-icons/react'

// Fallback config when category has no image
const FALLBACK: Record<string, { bg: string; accent: string; Icon: typeof Leaf }> = {
  piel:         { bg: '#C25240', accent: 'var(--cat-coral)',    Icon: Drop    },
  solar:        { bg: '#B8870A', accent: 'var(--cat-mostaza)', Icon: Sun     },
  bienestar:    { bg: '#6A4DA3', accent: 'var(--cat-lavanda)', Icon: Moon    },
  gym:          { bg: '#C25240', accent: 'var(--cat-coral)',   Icon: Barbell },
  viaje:        { bg: '#2F7CB8', accent: 'var(--cat-cielo)',   Icon: Airplane},
  hogar:        { bg: '#B85278', accent: 'var(--cat-rosa)',    Icon: House   },
  digestivo:    { bg: '#2F8C5A', accent: 'var(--cat-menta)',   Icon: Leaf    },
  'pies-cuerpo':{ bg: '#B87A2A', accent: 'var(--cat-mostaza)',Icon: Sneaker  },
}

export interface CategoryCardData {
  id: string
  slug: string
  name: string
  color: string | null
  image_url: string | null
  count?: number
}

function CategoryCard({ slug, name, color, image_url, count }: CategoryCardData) {
  const [hovered, setHovered] = useState(false)
  const fb = FALLBACK[slug] ?? { bg: 'var(--cat-lavanda)', accent: 'var(--liora-crema)', Icon: FolderSimple }
  const bg = color ?? fb.bg
  const sub = count !== undefined ? `${count} producto${count !== 1 ? 's' : ''}` : ''

  return (
    <Link href={`/tienda?categoria=${slug}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div
        className="liora-category-card"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          position: 'relative',
          borderRadius: 32,
          height: 360,
          background: bg,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          cursor: 'pointer',
          transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
          transition: 'transform 220ms cubic-bezier(0.22,1,0.36,1)',
          padding: '28px 24px',
        }}
      >
        {image_url ? (
          <>
            {/* PNG product image — floating in upper portion */}
            <div style={{
              position: 'absolute',
              top: -10,
              right: 0,
              left: 0,
              height: '72%',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}>
              <Image
                src={image_url}
                alt={name}
                width={220}
                height={240}
                style={{
                  objectFit: 'contain',
                  objectPosition: 'bottom center',
                  width: '75%',
                  height: '100%',
                  transform: hovered ? 'translateY(-8px) scale(1.03)' : 'translateY(0) scale(1)',
                  transition: 'transform 320ms cubic-bezier(0.22,1,0.36,1)',
                  filter: 'drop-shadow(0 16px 28px rgba(0,0,0,0.22))',
                }}
              />
            </div>

            {/* Gradient overlay so text is always readable */}
            <div style={{
              position: 'absolute',
              bottom: 0, left: 0, right: 0,
              height: '45%',
              background: `linear-gradient(to top, ${bg} 55%, transparent)`,
              pointerEvents: 'none',
            }} />
          </>
        ) : (
          <>
            {/* Fallback: colored circle + icon */}
            <div style={{ position: 'absolute', top: 28, right: 28, width: 120, height: 120, borderRadius: 999, background: fb.accent, opacity: 0.55 }} />
            <div style={{ position: 'absolute', top: 60, right: 60, width: 56, height: 56, background: 'var(--liora-crema)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--liora-uva)' }}>
              <fb.Icon size={28} weight="bold" />
            </div>
          </>
        )}

        {/* Text — always at bottom */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <h3
            className="liora-category-title"
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: 30,
              lineHeight: 0.98,
              letterSpacing: '-0.02em',
              color: 'var(--liora-crema)',
              margin: 0,
              whiteSpace: 'pre-line',
              fontVariationSettings: "'opsz' 144,'SOFT' 60,'WONK' 0",
              textShadow: image_url ? '0 1px 8px rgba(0,0,0,0.25)' : 'none',
            }}
          >
            {name}
          </h3>
          {sub && (
            <div style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              fontSize: 12,
              color: 'var(--liora-crema)',
              opacity: 0.8,
              marginTop: 7,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}>
              {sub}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

interface Props { categories: CategoryCardData[] }

export function CategoryGrid({ categories }: Props) {
  return (
    <div className="liora-category-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
      {categories.map(cat => (
        <CategoryCard key={cat.slug} {...cat} />
      ))}
    </div>
  )
}
