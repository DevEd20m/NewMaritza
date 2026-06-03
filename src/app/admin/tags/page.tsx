import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { TagsClient, type AdminTag } from '@/components/admin/TagsClient'

export const metadata: Metadata = { title: 'Tags — Admin LIORA' }

async function getTags(): Promise<AdminTag[]> {
  const admin = createAdminClient()
  const { data: tags } = await (admin as any)
    .from('tags').select('id, name, slug, group').order('group').order('name')
  const { data: counts } = await (admin as any).from('product_tags').select('tag_id')
  const countMap: Record<string, number> = {}
  for (const row of (counts ?? []) as Array<{ tag_id: string }>) {
    countMap[row.tag_id] = (countMap[row.tag_id] ?? 0) + 1
  }
  return ((tags ?? []) as AdminTag[]).map(t => ({ ...t, product_count: countMap[t.id] ?? 0 }))
}

export default async function TagsPage() {
  const tags = await getTags()
  return <TagsClient initialTags={tags} />
}
