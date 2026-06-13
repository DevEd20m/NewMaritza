import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth/guards'

const schema = z.object({
  question_id: z.string().uuid(),
  text: z.string().min(1),
  slug: z.string().min(1),
  sort_order: z.number().int(),
})

export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('quiz_question_options')
      .insert({ ...parsed.data, tag_ids: [] as string[], icon_url: null, next_question_id: null })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err) {
    console.error('[admin/quiz/options POST]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
