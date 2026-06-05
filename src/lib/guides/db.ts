import { createAdminClient } from '@/lib/supabase/admin'
import type { KitGuide } from './index'

function rowToGuide(row: Record<string, unknown>): KitGuide {
  return {
    slug: row.slug as string,
    kitName: row.kit_name as string,
    tagline: row.tagline as string,
    description: row.description as string,
    color: row.color as string,
    schedule: row.schedule as KitGuide['schedule'],
    timeline: row.timeline as KitGuide['timeline'],
    tips: row.tips as KitGuide['tips'],
    faqs: row.faqs as KitGuide['faqs'],
    recipe: (row.recipe as KitGuide['recipe']) ?? undefined,
    warnings: (row.warnings as string[]) ?? undefined,
  }
}

export async function getGuideBySlugDB(slug: string): Promise<KitGuide | undefined> {
  const admin = createAdminClient()
  const { data } = await (admin as any)
    .from('kit_guides')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()
  return data ? rowToGuide(data) : undefined
}

export async function detectKitFromItemsDB(productNames: string[]): Promise<KitGuide | undefined> {
  const admin = createAdminClient()
  const { data: guides } = await (admin as any)
    .from('kit_guides')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
  if (!guides?.length) return undefined

  const names = productNames.join(' ').toLowerCase()
  for (const row of guides) {
    const keywords = (row.matching_keywords as string[]) ?? []
    if (keywords.some((kw: string) => names.includes(kw.toLowerCase()))) {
      return rowToGuide(row)
    }
  }
  return undefined
}

export async function getAllGuideSlugsDB(): Promise<string[]> {
  const admin = createAdminClient()
  const { data } = await (admin as any)
    .from('kit_guides')
    .select('slug')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
  return (data ?? []).map((r: { slug: string }) => r.slug)
}

export async function getAllGuidesDB(): Promise<KitGuide[]> {
  const admin = createAdminClient()
  const { data } = await (admin as any)
    .from('kit_guides')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
  return (data ?? []).map(rowToGuide)
}
