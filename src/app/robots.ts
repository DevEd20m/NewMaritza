import type { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://liora.pe'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/cuenta/', '/pagar/', '/confirmado/', '/api/'],
      },
      // AI crawlers — acceso explícito al feed de productos
      { userAgent: 'GPTBot',        allow: ['/api/feed/google', '/'] },
      { userAgent: 'PerplexityBot', allow: '/' },
      { userAgent: 'ClaudeBot',     allow: '/' },
      { userAgent: 'Bingbot',       allow: '/' },
      { userAgent: 'Googlebot',     allow: '/' },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
