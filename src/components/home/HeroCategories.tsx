import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from '@phosphor-icons/react/dist/ssr'

interface HeroCat {
  id: string
  name: string
  slug: string
  color: string
  tagline: string
  imageUrl: string | null
}

async function getHeroData(): Promise<HeroCat[]> {
  const admin = createAdminClient()

  const { data: cats } = await (admin as any)
    .from('categories')
    .select('id, name, slug, color, hero_tagline')
    .eq('show_in_hero', true)
    .order('hero_sort_order')

  if (!cats?.length) return []

  const catIds = (cats as any[]).map((c: any) => c.id)

  // Note: products table has no sort_order — use created_at
  const { data: products, error } = await admin
    .from('products')
    .select('category_id, cover_image_url')
    .eq('is_active', true)
    .not('cover_image_url', 'is', null)
    .in('category_id', catIds as string[])
    .order('created_at', { ascending: true })

  if (error) console.error('[HeroCategories] products query error:', error)

  const imageMap: Record<string, string> = {}
  for (const p of (products ?? []) as any[]) {
    if (p.category_id && !imageMap[p.category_id]) {
      imageMap[p.category_id] = p.cover_image_url
    }
  }

  return (cats as any[]).map((c: any) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    color: c.color ?? 'var(--cat-lavanda)',
    tagline: c.hero_tagline ?? '',
    imageUrl: imageMap[c.id] ?? null,
  }))
}

// Positions for product photos (left/center area of the composition)
const IMG_SLOTS = [
  { top: 30,  left: 10,  width: 175, height: 230 },
  { top: -10, left: 155, width: 200, height: 260 },
  { top: 50,  left: 310, width: 170, height: 220 },
  { top: 230, left: 70,  width: 160, height: 200 },
]

// Positions for small floating category cards
const CARD_SLOTS: React.CSSProperties[] = [
  { top: 12,   left: 220  },   // top center-right
  { top: 12,   right: 0   },   // top right
  { bottom: 20, right: 0  },   // bottom right
  { bottom: 40, left: 0   },   // bottom left
]

const CAT_EMOJI: Record<string, string> = {
  piel:          '🧴',
  solar:         '☀️',
  bienestar:     '🌙',
  gym:           '💪',
  viaje:         '🧳',
  hogar:         '🏠',
  digestivo:     '🌿',
  'pies-cuerpo': '👟',
}

export async function HeroCategories() {
  const cats = await getHeroData()
  if (!cats.length) return null

  return (
    <div style={{ position: 'relative', height: 520 }}>

      {/* ── Product photos — main visual ─────────────────────── */}
      {cats.map((cat, i) => {
        const slot = IMG_SLOTS[i]
        if (!slot || !cat.imageUrl) return null
        return (
          <div
            key={`img-${cat.id}`}
            style={{
              position: 'absolute',
              top: slot.top,
              left: slot.left,
              width: slot.width,
              height: slot.height,
              zIndex: i === 1 ? 3 : 2,  // center product on top
            }}
          >
            <Image
              src={cat.imageUrl}
              alt={cat.name}
              width={slot.width}
              height={slot.height}
              style={{ objectFit: 'contain', objectPosition: 'bottom center', width: '100%', height: '100%' }}
              priority={i < 2}
            />
          </div>
        )
      })}

      {/* ── Category cards — floating overlay ────────────────── */}
      {cats.map((cat, i) => {
        const pos = CARD_SLOTS[i]
        if (!pos) return null
        return (
          <Link
            key={`card-${cat.id}`}
            href={`/tienda?categoria=${cat.slug}`}
            style={{
              position: 'absolute',
              ...pos,
              zIndex: 10,
              textDecoration: 'none',
              width: 190,
              display: 'block',
            }}
          >
            <div style={{
              background: 'var(--liora-blanco)',
              border: '1.5px solid var(--liora-arena)',
              borderRadius: 20,
              padding: '14px 16px',
              boxShadow: '0 8px 28px rgba(61,26,58,0.13)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10,
                background: cat.color, flexShrink: 0,
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 16,
              }}>
                {CAT_EMOJI[cat.slug] ?? '✦'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: 'var(--font-display)', fontWeight: 800,
                  fontSize: 14, color: 'var(--liora-uva)', lineHeight: 1.1,
                  marginBottom: 3,
                  fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1",
                }}>
                  {cat.name}
                </div>
                {cat.tagline && (
                  <div style={{
                    fontFamily: 'var(--font-body)', fontSize: 11,
                    color: 'var(--liora-uva)', opacity: 0.6, lineHeight: 1.3,
                  }}>
                    {cat.tagline}
                  </div>
                )}
              </div>
              <ArrowRight size={13} weight="bold" color="var(--liora-uva)"
                style={{ opacity: 0.45, flexShrink: 0, marginTop: 2 }} />
            </div>
          </Link>
        )
      })}
    </div>
  )
}
