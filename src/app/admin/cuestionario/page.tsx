import { createAdminClient } from '@/lib/supabase/admin'
import type { Metadata } from 'next'
import { CuestionarioClient, type AdminQuizGroup, type AdminLead, type AdminMiniKit } from '@/components/admin/CuestionarioClient'
import type { AdminTag } from '@/components/admin/TagsClient'

export const metadata: Metadata = { title: 'Cuestionario — Admin LIORA' }

export default async function AdminCuestionarioPage() {
  const admin = createAdminClient()

  const [{ data: groupsRaw }, { data: leadsRaw }, { count: totalProfiles }, { data: miniTemplatesRaw }, { data: tagsRaw }] = await Promise.all([
    // Main quiz groups + questions + options
    (admin as any)
      .from('quiz_question_groups')
      .select('id, title, sort_order, interstitial_text, quiz_questions(id, text, subtext, type, sort_order, conditions, quiz_question_options!question_id(id, text, slug, sort_order, tag_ids))')
      .eq('template_id', '55550001-0000-0000-0000-000000000001')
      .order('sort_order'),

    // Leads list
    admin.from('leads').select('id, email, phone, source, created_at').order('created_at', { ascending: false }),

    // Total quiz profiles count
    admin.from('quiz_profiles').select('*', { count: 'exact', head: true }),

    // Mini-quiz templates linked to kits
    (admin as any)
      .from('quiz_templates')
      .select(`id, name, kit_id,
        kits!kit_id(id, name, slug),
        quiz_question_groups(id, title, sort_order,
          quiz_questions(id, text, subtext, type, sort_order,
            quiz_question_options!question_id(id, text, slug, sort_order)
          )
        )`)
      .not('kit_id', 'is', null),

    // Tags for option tag_ids assignment
    (admin as any).from('tags').select('id, name, slug, group').order('group').order('name'),
  ])

  const groups: AdminQuizGroup[] = (groupsRaw ?? []) as AdminQuizGroup[]
  const leads: AdminLead[] = (leadsRaw ?? []) as AdminLead[]
  const tags: AdminTag[] = ((tagsRaw ?? []) as AdminTag[]).map(t => ({ ...t, product_count: 0 }))

  // Shape mini-kit data for the client
  const miniKits: AdminMiniKit[] = ((miniTemplatesRaw ?? []) as any[]).map(t => ({
    templateId: t.id,
    kitId: t.kit_id,
    kitName: t.kits?.name ?? t.name,
    kitSlug: t.kits?.slug ?? '',
    groups: (t.quiz_question_groups ?? []) as AdminQuizGroup[],
  }))

  // Analytics: top answered options from last 500 profiles
  const { data: profilesRaw } = await (admin as any)
    .from('quiz_profiles')
    .select('answers')
    .limit(500)

  const profiles = (profilesRaw ?? []) as { answers: Record<string, string[]> }[]

  const optionMap: Record<string, { question_text: string; option_text: string }> = {}
  groups.forEach(g => g.quiz_questions.forEach(q =>
    q.quiz_question_options.forEach(o => {
      optionMap[o.id] = { question_text: q.text, option_text: o.text }
    })
  ))

  const counts: Record<string, number> = {}
  profiles.forEach(p =>
    Object.values(p.answers ?? {}).flat().forEach(id => { counts[id] = (counts[id] ?? 0) + 1 })
  )

  const topOptions = Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 12)
    .map(([id, count]) => ({ ...optionMap[id], count }))
    .filter(o => o.question_text)

  return (
    <CuestionarioClient
      groups={groups}
      miniKits={miniKits}
      leads={leads}
      totalProfiles={totalProfiles ?? 0}
      topOptions={topOptions}
      tags={tags}
    />
  )
}
