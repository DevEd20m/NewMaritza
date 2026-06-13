import Image from 'next/image'

const PRODUCTS = [
  { src: '/products/gummix-aguaje-fem.jpg',         alt: 'Gummix Aguaje Fem'          },
  { src: '/products/magnesio-sorenu.jpg',            alt: 'Magnesio Sorenu'            },
  { src: '/products/la-roche-posay-anthelios.jpeg',  alt: 'La Roche-Posay Anthelios'   },
  { src: '/products/cerave-hydrating-cleanser.webp', alt: 'CeraVe Hydrating Cleanser'  },
]

const BACK_ROW   = [PRODUCTS[2], PRODUCTS[0], PRODUCTS[3], PRODUCTS[1], PRODUCTS[2], PRODUCTS[0]]
const MIDDLE_ROW = [PRODUCTS[1], PRODUCTS[3], PRODUCTS[0], PRODUCTS[2], PRODUCTS[1]]

function Row({ products, height, opacity, blur, gap = 4 }: {
  products: typeof PRODUCTS
  height: string
  opacity: number
  blur: number
  gap?: number
}) {
  return (
    <div style={{
      position: 'absolute',
      bottom: 0, left: 0, right: 0,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-end',
      gap,
      padding: '0 8px',
      height,
      opacity,
      filter: blur > 0 ? `blur(${blur}px)` : undefined,
      pointerEvents: 'none',
    }}>
      {products.map((p, i) => (
        <Image
          key={`${p.src}-${i}`}
          src={p.src}
          alt={p.alt}
          width={200}
          height={320}
          style={{
            width: 'auto',
            height: '100%',
            objectFit: 'contain',
            mixBlendMode: 'multiply',
            flexShrink: 0,
            display: 'block',
          }}
        />
      ))}
    </div>
  )
}

export function HeroProductsDisplay() {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: 'var(--liora-crema)',
      borderRadius: 'inherit',
      overflow: 'hidden',
      position: 'relative',
    }}>
      <Row products={BACK_ROW}    height="38%" opacity={0.28} blur={3}   gap={2} />
      <Row products={MIDDLE_ROW}  height="62%" opacity={0.55} blur={1.2} gap={4} />

      {/* Front row — real images, no blur, full opacity */}
      <div style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-end',
        gap: 10,
        padding: '0 12px',
        height: '88%',
      }}>
        {PRODUCTS.map((p) => (
          <Image
            key={p.src}
            src={p.src}
            alt={p.alt}
            width={200}
            height={320}
            priority
            style={{
              width: 'auto',
              height: '100%',
              objectFit: 'contain',
              mixBlendMode: 'multiply',
              flexShrink: 0,
              display: 'block',
            }}
          />
        ))}
      </div>
    </div>
  )
}
