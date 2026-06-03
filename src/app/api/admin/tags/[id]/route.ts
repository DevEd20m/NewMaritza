import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/guards'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const { id } = await params
  const admin = createAdminClient()

  // Remove from product_tags first
  await (admin as any).from('product_tags').delete().eq('tag_id', id)
  // Remove from quiz option tag_ids — update all options that reference this tag
  const { data: opts } = await (admin as any)
    .from('quiz_question_options')
    .select('id, tag_ids')
    .contains('tag_ids', [id])
  for (const opt of (opts ?? []) as Array<{ id: string; tag_ids: string[] }>) {
    await (admin as any).from('quiz_question_options')
      .update({ tag_ids: opt.tag_ids.filter((t: string) => t !== id) })
      .eq('id', opt.id)
  }

  const { error } = await (admin as any).from('tags').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
