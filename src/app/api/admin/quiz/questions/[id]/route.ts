import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  text: z.string().min(1).optional(),
  subtext: z.string().nullable().optional(),
  type: z.enum(['single', 'multi']).optional(),
})

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

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
