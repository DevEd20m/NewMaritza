import type { createAdminClient } from '@/lib/supabase/admin'
import { buildProfileIndex, renderProfile, type ProfileIndex } from './profile-index'
import { detectarBanderasEnTexto, MAX_TEXTO_LIBRE } from './free-text'

type AdminClient = ReturnType<typeof createAdminClient>

export interface LoadedProfile {
  perfil: ProfileIndex
  perfilTexto: string
  allSlugs: string[]
  textoLibre: string
}

// Reconstruye el índice de perfil desde quiz_profiles.answers. Compartido por
// el motor de recomendación y por Lía: ambos deben ver a la misma persona.
export async function loadProfileIndexById(admin: AdminClient, profileId: string): Promise<LoadedProfile | null> {
  const { data: profile } = await admin
    .from('quiz_profiles')
    .select('answers')
    .eq('id', profileId)
    .maybeSingle()
  if (!profile) return null

  const answers = profile.answers as Record<string, string[]>
  const questionIds = Object.keys(answers)
  if (!questionIds.length) return null

  type QuizQ = { id: string; type: string; quiz_question_options: { id: string; slug: string }[] }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: questionsRaw } = await (admin as any)
    .from('quiz_questions')
    .select('id, type, quiz_question_options!question_id(id, slug)')
    .in('id', questionIds)

  const allSlugs: string[] = []
  let textoLibre = ''
  for (const q of ((questionsRaw ?? []) as QuizQ[])) {
    if (q.type === 'text') {
      textoLibre = String((answers[q.id] ?? [])[0] ?? '').trim().slice(0, MAX_TEXTO_LIBRE)
      continue
    }
    for (const o of q.quiz_question_options) {
      if ((answers[q.id] ?? []).includes(o.id)) allSlugs.push(o.slug)
    }
  }

  const slugsConTexto = [...allSlugs, ...detectarBanderasEnTexto(textoLibre)]
  const perfil = buildProfileIndex({ slugs: slugsConTexto, texto: textoLibre })
  return { perfil, perfilTexto: renderProfile(perfil), allSlugs, textoLibre }
}
