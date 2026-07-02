import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  source: z.string().min(1).default('exit_intent'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, source } = schema.parse(body)

    const admin = createAdminClient()
    await admin.from('leads').upsert(
      { email, source, phone: null, quiz_profile_id: null },
      { onConflict: 'email', ignoreDuplicates: true }
    )

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
}
