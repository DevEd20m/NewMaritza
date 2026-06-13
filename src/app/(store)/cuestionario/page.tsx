import { createClient } from '@/lib/supabase/server'
import { QuizClient } from '@/components/quiz/QuizClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cuestionario de bienestar',
  description: 'Responde unas preguntas y la IA arma tu kit personalizado de bienestar — en menos de 2 minutos.',
}

interface QuizTemplate { id: string; name: string; max_questions: number | null }

interface QuizOption {
  id: string; text: string; slug: string; icon_url: string | null
  sort_order: number; tag_ids: string[] | null; next_question_id: string | null
}
interface QuizQuestion {
  id: string; text: string; subtext: string | null; type: string
  sort_order: number; is_required: boolean
  conditions: { if_any_slug?: string[] } | null
  quiz_question_options: QuizOption[]
}
interface QuizGroup {
  id: string; title: string; sort_order: number; interstitial_text: string | null
  quiz_questions: QuizQuestion[]
}

async function getQuizData() {
  const supabase = await createClient()
  const { data: templateRaw } = await supabase
    .from('quiz_templates')
    .select('id, name, max_questions')
    .order('created_at')
    .limit(1)
    .single()
  const template = templateRaw as QuizTemplate | null

  if (!template) return null

  const { data: groupsRaw } = await supabase
    .from('quiz_question_groups')
    .select(`
      id, title, sort_order, interstitial_text,
      quiz_questions (
        id, text, subtext, type, sort_order, is_required, conditions,
        quiz_question_options!question_id ( id, text, slug, icon_url, sort_order, tag_ids, next_question_id )
      )
    `)
    .eq('template_id', template.id)
    .order('sort_order')

  return { template, groups: (groupsRaw as QuizGroup[]) ?? [] }
}

export default async function QuizPage() {
  const supabase = await createClient()
  const [{ data: { user } }, quizData] = await Promise.all([
    supabase.auth.getUser(),
    getQuizData(),
  ])

  let userName: string | undefined
  let userEmail: string | undefined
  if (user) {
    const { data: profile } = await supabase
      .from('profiles').select('first_name').eq('id', user.id).single()
    userName = (profile as { first_name: string | null } | null)?.first_name ?? undefined
    userEmail = user.email ?? undefined
  }

  if (!quizData) {
    return (
      <div style={{ padding: '96px 48px', textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 18, color: 'var(--liora-uva)', opacity: 0.7 }}>
          Cuestionario no disponible en este momento.
        </p>
      </div>
    )
  }

  return (
    <QuizClient
      templateId={quizData.template.id}
      groups={quizData.groups}
      isLoggedIn={!!user}
      userName={userName}
      userEmail={userEmail}
    />
  )
}
