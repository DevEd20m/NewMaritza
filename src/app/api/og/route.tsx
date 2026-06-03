import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

const UVA    = '#3D1A3A'
const CREMA  = '#FBF1E2'
const ARENA  = '#E8DDC5'
const LIMA   = '#C9F048'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type  = searchParams.get('type')  // 'product' | 'kit'
  const slug  = searchParams.get('slug')
  const price = searchParams.get('price') // already formatted, e.g. "299"

  let title    = 'Bienestar personalizado'
  let subtitle = 'Tu cuerpo, tu kit, tu rutina.'
  let imageUrl: string | null = null
  let badge    = 'Wellness'
  let priceLabel: string | null = price ? `S/ ${price}` : null

  if (slug) {
    const admin = createAdminClient()

    if (type === 'product') {
      const { data } = await admin
        .from('products')
        .select('name, description, cover_image_url')
        .eq('slug', slug)
        .eq('is_active', true)
        .single()

      if (data) {
        title    = data.name
        subtitle = data.description?.slice(0, 90) ?? subtitle
        imageUrl = data.cover_image_url
        badge    = 'Producto'
      }
    } else if (type === 'kit') {
      const { data } = await admin
        .from('kits')
        .select('name, description, cover_image_url')
        .eq('slug', slug)
        .eq('is_active', true)
        .single()

      if (data) {
        title    = data.name
        subtitle = data.description?.slice(0, 90) ?? subtitle
        imageUrl = data.cover_image_url
        badge    = 'Kit wellness'
      }
    }
  }

  const titleSize = title.length > 45 ? 40 : title.length > 28 ? 48 : 56

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%',
          display: 'flex', flexDirection: 'column',
          background: CREMA, fontFamily: 'sans-serif',
        }}
      >
        {/* Main area */}
        <div style={{ display: 'flex', flex: 1, padding: '56px 64px', gap: 40, alignItems: 'center' }}>

          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between', height: '100%' }}>

            {/* Top: brand + badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <div style={{
                background: UVA, color: CREMA,
                borderRadius: 12, padding: '6px 18px',
                fontSize: 20, fontWeight: 900, letterSpacing: '0.12em',
              }}>
                LIORA
              </div>
              <div style={{
                background: LIMA, color: UVA,
                borderRadius: 999, padding: '5px 16px',
                fontSize: 14, fontWeight: 700, letterSpacing: '0.06em',
              }}>
                {badge}
              </div>
            </div>

            {/* Product title */}
            <div style={{
              fontSize: titleSize, fontWeight: 800,
              color: UVA, lineHeight: 1.1,
              maxWidth: imageUrl ? 520 : 900,
              flex: 1, display: 'flex', alignItems: 'center',
            }}>
              {title}
            </div>

            {/* Subtitle */}
            <div style={{
              fontSize: 18, color: UVA, opacity: 0.6,
              lineHeight: 1.5, maxWidth: imageUrl ? 480 : 800,
              marginTop: 16,
            }}>
              {subtitle.length > 90 ? subtitle.slice(0, 90) + '…' : subtitle}
            </div>

            {/* Price */}
            {priceLabel && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 28 }}>
                <div style={{
                  background: UVA, color: LIMA,
                  borderRadius: 14, padding: '10px 24px',
                  fontSize: 30, fontWeight: 800,
                }}>
                  {priceLabel}
                </div>
                <div style={{ fontSize: 14, color: UVA, opacity: 0.45 }}>
                  Envío a Lima disponible
                </div>
              </div>
            )}
          </div>

          {/* Right: product image */}
          {imageUrl && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 350, height: 350, flexShrink: 0,
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt={title}
                width={340}
                height={340}
                style={{ width: 340, height: 340, objectFit: 'cover', borderRadius: 28 }}
              />
            </div>
          )}
        </div>

        {/* Bottom bar */}
        <div style={{
          display: 'flex', alignItems: 'center',
          background: UVA, padding: '16px 64px',
        }}>
          <div style={{ color: ARENA, fontSize: 15, opacity: 0.7 }}>liora.pe</div>
          <div style={{ flex: 1 }} />
          <div style={{ color: LIMA, fontSize: 14, fontWeight: 700, letterSpacing: '0.04em' }}>
            Bienestar personalizado · Perú
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
