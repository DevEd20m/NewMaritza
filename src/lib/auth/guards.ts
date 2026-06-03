import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ─── tipos ────────────────────────────────────────────────────────────────────

export type GuardResult =
  | { ok: true;  userId: string; role: string }
  | { ok: false; response: NextResponse }

// ─── requireAdmin ─────────────────────────────────────────────────────────────
// Verifica sesión activa + role === 'admin'.
// Uso: const guard = await requireAdmin(); if (!guard.ok) return guard.response

export async function requireAdmin(): Promise<GuardResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'No autorizado' }, { status: 401 }),
    }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = (profile as { role: string | null } | null)?.role ?? ''

  if (role !== 'admin') {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Acceso denegado' }, { status: 403 }),
    }
  }

  return { ok: true, userId: user.id, role }
}

// ─── requireAuth ──────────────────────────────────────────────────────────────
// Solo verifica sesión activa (sin exigir role específico).

export async function requireAuth(): Promise<GuardResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'No autorizado' }, { status: 401 }),
    }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return { ok: true, userId: user.id, role: (profile as { role: string | null } | null)?.role ?? 'customer' }
}
