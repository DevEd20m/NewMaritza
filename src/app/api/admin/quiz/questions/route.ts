import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth/guards'

const schema = z.object({
  group_id: z.string().uuid(),
  text: z.string().min(1),
  subtext: z.string().nullable().optional(),
  type: z.enum(['single', 'multi']),
  sort_order: z.number().int(),
  is_required: z.boolean().optional(),
  conditions: z.object({ if_any_slug: z.array(z.string()) }).nullable().optional(),
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
      .from('quiz_questions')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert({ ...parsed.data, subtext: parsed.data.subtext ?? null, is_required: parsed.data.is_required ?? false, conditions: (parsed.data.conditions ?? null) as any })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err) {
    console.error('[admin/quiz/questions POST]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
