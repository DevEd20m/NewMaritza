import type { Metadata } from 'next'
import type { Product, Category, Kit } from '@/types/database'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://liora.pe'
const SITE_NAME = 'LIORA'
const DEFAULT_DESCRIPTION = 'Bienestar personalizado. Tu cuerpo, tu cuestionario, tu kit. Orgánicos, vitaminas, skin care y gym — armados para ti.'

export function buildBaseMetadata(overrides?: Partial<Metadata>): Metadata {
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: `${SITE_NAME} — Bienestar personalizado`, template: `%s | ${SITE_NAME}` },
    description: DEFAULT_DESCRIPTION,
    openGraph: {
      siteName: SITE_NAME,
      locale: 'es_PE',
      type: 'website',
    },
    twitter: { card: 'summary_large_image' },
    robots: { index: true, follow: true },
    ...overrides,
  }
}

export function buildProductMetadata(product: Product, priceCents?: number): Metadata {
  const title = product.name
  const description = product.description ?? DEFAULT_DESCRIPTION
  const imageUrl = product.cover_image_url ?? undefined

  return buildBaseMetadata({
    title,
    description,
    openGraph: {
      title,
      description,
      images: imageUrl ? [{ url: imageUrl, alt: product.name }] : [],
      type: 'website',
    },
    alternates: { canonical: `/tienda/${product.slug}` },
    other: priceCents ? { 'product:price:amount': String(priceCents / 100), 'product:price:currency': 'PEN' } : {},
  })
}

export function buildCategoryMetadata(category: Category): Metadata {
  return buildBaseMetadata({
    title: `${category.name} — Tienda`,
    alternates: { canonical: `/tienda?categoria=${category.slug}` },
  })
}

export function buildProductJsonLd(product: Product, priceCents?: number) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.cover_image_url,
    url: `${SITE_URL}/tienda/${product.slug}`,
    ...(product.brand ? { brand: { '@type': 'Brand', name: product.brand } } : {}),
    ...(priceCents ? {
      offers: {
        '@type': 'Offer',
        price: String(priceCents / 100),
        priceCurrency: 'PEN',
        availability: 'https://schema.org/InStock',
        url: `${SITE_URL}/tienda/${product.slug}`,
        seller: { '@type': 'Organization', name: SITE_NAME },
      },
    } : {}),
  }
}

export function buildKitMetadata(kit: Kit): Metadata {
  return buildBaseMetadata({
    title: kit.name,
    description: kit.description ?? DEFAULT_DESCRIPTION,
    openGraph: {
      title: kit.name,
      description: kit.description ?? DEFAULT_DESCRIPTION,
      images: kit.cover_image_url ? [{ url: kit.cover_image_url, alt: kit.name }] : [],
      type: 'website',
    },
    alternates: { canonical: `/tienda/kit/${kit.slug}` },
  })
}

export function buildKitJsonLd(
  kit: Kit,
  products: Array<{ name: string; slug: string; cover_image_url?: string | null; priceCents?: number }>,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: kit.name,
    description: kit.description,
    url: `${SITE_URL}/tienda/kit/${kit.slug}`,
    numberOfItems: products.length,
    itemListElement: products.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Product',
        name: p.name,
        url: `${SITE_URL}/tienda/${p.slug}`,
        image: p.cover_image_url,
        ...(p.priceCents ? {
          offers: {
            '@type': 'Offer',
            price: String(p.priceCents / 100),
            priceCurrency: 'PEN',
            availability: 'https://schema.org/InStock',
          },
        } : {}),
      },
    })),
  }
}
