import { createAdminClient } from '@/lib/supabase/admin'
import { GuiasClient } from '@/components/admin/GuiasClient'

async function getGuides() {
  const admin = createAdminClient()
  const { data } = await (admin as any)
    .from('kit_guides')
    .select('id, slug, kit_name, tagline, color, matching_keywords, is_active, sort_order, updated_at')
    .order('sort_order', { ascending: true })
  return data ?? []
}

export default async function GuiasPage() {
  const guides = await getGuides()
  return <GuiasClient initialGuides={guides} />
}
