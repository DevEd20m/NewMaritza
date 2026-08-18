import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cache } from 'react'
import { redirect } from 'next/navigation'

// ─── tipos ────────────────────────────────────────────────────────────────────

export type GuardResult =
  | { ok: true;  userId: string; role: string }
  | { ok: false; response: NextResponse }

// ─── requireAdmin ─────────────────────────────────────────────────────────────
// Verifica sesión activa + role === 'admin'.
// Uso: const guard = await requireAdmin(); if (!guard.ok) return guard.response

type AdminPrincipal = { userId: string; role: 'admin'; firstName: string | null; email: string | null }
type AdminAccess = { userId: string | null; principal: AdminPrincipal | null }

const getAdminAccess = cache(async (): Promise<AdminAccess> => {
  const startedAt = Date.now()
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()
  const userId = typeof data?.claims?.sub === 'string' ? data.claims.sub : null
  if (error || !userId) return { userId: null, principal: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, first_name')
    .eq('id', userId)
    .single()

  const profileData = profile as { role: string | null; first_name: string | null } | null
  if (profileData?.role !== 'admin') return { userId, principal: null }

  console.info(JSON.stringify({ event: 'admin_auth_ok', durationMs: Date.now() - startedAt }))
  return { userId, principal: {
    userId,
    role: 'admin',
    firstName: profileData.first_name,
    email: typeof data?.claims?.email === 'string' ? data.claims.email : null,
  } }
})

export const getAdminPrincipal = cache(async () => (await getAdminAccess()).principal)

export async function verifyAdminPage(): Promise<AdminPrincipal> {
  const access = await getAdminAccess()
  if (!access.userId) redirect('/login?next=/admin')
  if (!access.principal) redirect('/')
  return access.principal
}

export async function requireAdmin(): Promise<GuardResult> {
  const access = await getAdminAccess()
  if (!access.userId) {
    return { ok: false, response: NextResponse.json({ error: 'No autorizado' }, { status: 401 }) }
  }
  if (!access.principal) return { ok: false, response: NextResponse.json({ error: 'Acceso denegado' }, { status: 403 }) }

  return { ok: true, userId: access.principal.userId, role: access.principal.role }
}

// ─── requireAuth ──────────────────────────────────────────────────────────────
// Solo verifica sesión activa (sin exigir role específico).

export async function requireAuth(): Promise<GuardResult> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = typeof data?.claims?.sub === 'string' ? data.claims.sub : null

  if (!userId) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'No autorizado' }, { status: 401 }),
    }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  return { ok: true, userId, role: (profile as { role: string | null } | null)?.role ?? 'customer' }
}
