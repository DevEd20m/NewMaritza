import type { MetadataRoute } from 'next'
import { createClient as createBrowserClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export const dynamic = 'force-dynamic'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://liora.pe'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const admin = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const [{ data: products }, { data: kits }] = await Promise.all([
    admin.from('products').select('slug, updated_at').eq('is_active', true),
    admin.from('kits').select('slug, created_at').eq('is_active', true),
  ])

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/tienda`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/cuestionario`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/nosotros`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/ayuda`, changeFrequency: 'weekly', priority: 0.6 },
  ]

  const productRoutes: MetadataRoute.Sitemap = (products ?? []).map((p) => ({
    url: `${SITE_URL}/tienda/${p.slug}`,
    lastModified: p.updated_at,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  const kitRoutes: MetadataRoute.Sitemap = (kits ?? []).map((k) => ({
    url: `${SITE_URL}/tienda/kit/${k.slug}`,
    lastModified: k.created_at,
    changeFrequency: 'weekly',
    priority: 0.75,
  }))

  return [...staticRoutes, ...productRoutes, ...kitRoutes]
}
