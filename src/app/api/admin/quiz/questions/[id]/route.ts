import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth/guards'

const schema = z.object({
  text: z.string().min(1).optional(),
  subtext: z.string().nullable().optional(),
  type: z.enum(['single', 'multi']).optional(),
  conditions: z.object({ if_any_slug: z.array(z.string()) }).nullable().optional(),
})

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response
    const { id } = await params
    const admin = createAdminClient()
    await admin.from('quiz_question_options').delete().eq('question_id', id)
    await admin.from('quiz_questions').delete().eq('id', id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[admin/quiz/questions DELETE]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const guard = await requireAdmin()
    if (!guard.ok) return guard.response

    const { id } = await params
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const admin = createAdminClient()
    await admin.from('quiz_questions').update(parsed.data).eq('id', id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[admin/quiz/questions PATCH]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
