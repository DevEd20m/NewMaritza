import 'server-only'

import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { createOpaqueToken, hashOpaqueToken } from '@/lib/security/tokens'
import type { Json } from '@/types/database'
import type { AnalyticsEventInput } from './schema'

export const ANALYTICS_COOKIE = 'liora_analytics'
export const ANALYTICS_PREFERENCE_COOKIE = 'liora_analytics_preference'
const SESSION_TTL_SECONDS = 30 * 60

type IdentityLinks = { leadId?: string | null; quizProfileId?: string | null; orderId?: string | null }

export async function ensureAnalyticsSession(): Promise<{ id: string; tokenHash: string } | null> {
  const cookieStore = await cookies()
  if (cookieStore.get(ANALYTICS_PREFERENCE_COOKIE)?.value === 'optout') return null

  const admin = createAdminClient()
  let token = cookieStore.get(ANALYTICS_COOKIE)?.value ?? null
  let tokenHash = token ? hashOpaqueToken(token) : null
  let session: { id: string; last_seen_at: string; status: string } | null = null

  if (tokenHash) {
    const { data } = await admin.from('analytics_sessions')
      .select('id, last_seen_at, status').eq('token_hash', tokenHash).maybeSingle()
    session = data
    if (session && Date.now() - new Date(session.last_seen_at).getTime() > SESSION_TTL_SECONDS * 1000) session = null
    if (session?.status === 'opted_out') return null
  }

  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = typeof claimsData?.claims?.sub === 'string' ? claimsData.claims.sub : null

  if (!session) {
    token = createOpaqueToken()
    tokenHash = hashOpaqueToken(token)
    const { data, error } = await admin.from('analytics_sessions').insert({
      token_hash: tokenHash,
      user_id: userId,
      status: userId ? 'identified' : 'anonymous',
      identified_at: userId ? new Date().toISOString() : null,
    }).select('id, last_seen_at, status').single()
    if (error || !data) throw new Error(error?.message ?? 'analytics_session_create_failed')
    session = data
  } else if (userId) {
    await admin.rpc('link_analytics_session', {
      p_token_hash: tokenHash!,
      p_user_id: userId,
      p_lead_id: null,
      p_quiz_profile_id: null,
      p_order_id: null,
    })
  }

  if (token) {
    cookieStore.set(ANALYTICS_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_TTL_SECONDS,
    })
  }

  if (!session) throw new Error('analytics_session_missing')
  return { id: session.id, tokenHash: tokenHash! }
}

export async function linkCurrentAnalyticsSession(links: IdentityLinks): Promise<void> {
  const cookieStore = await cookies()
  const token = cookieStore.get(ANALYTICS_COOKIE)?.value
  if (!token) return

  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = typeof data?.claims?.sub === 'string' ? data.claims.sub : null
  const admin = createAdminClient()
  const { error } = await admin.rpc('link_analytics_session', {
    p_token_hash: hashOpaqueToken(token),
    p_user_id: userId,
    p_lead_id: links.leadId ?? null,
    p_quiz_profile_id: links.quizProfileId ?? null,
    p_order_id: links.orderId ?? null,
  })
  if (error) console.error('[analytics/link]', error.message)
}

export async function ingestAnalyticsEvents(sessionId: string, events: AnalyticsEventInput[]): Promise<number> {
  const admin = createAdminClient()
  const { data, error } = await admin.rpc('ingest_analytics_events', {
    p_session_id: sessionId,
    p_events: events as unknown as Json,
  })
  if (error) throw new Error(error.message)
  return typeof data === 'number' ? data : 0
}

export async function optOutCurrentAnalyticsSession(): Promise<void> {
  const cookieStore = await cookies()
  const token = cookieStore.get(ANALYTICS_COOKIE)?.value
  const admin = createAdminClient()

  if (token) {
    const tokenHash = hashOpaqueToken(token)
    const { data: session } = await admin.from('analytics_sessions')
      .select('id, status').eq('token_hash', tokenHash).maybeSingle()
    if (session?.status === 'anonymous') {
      await admin.from('analytics_sessions').delete().eq('id', session.id)
    } else if (session) {
      await admin.from('analytics_sessions').update({ status: 'opted_out', token_hash: `opted-out:${session.id}` }).eq('id', session.id)
    }
  }

  cookieStore.delete(ANALYTICS_COOKIE)
  cookieStore.set(ANALYTICS_PREFERENCE_COOKIE, 'optout', {
    secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 365 * 24 * 60 * 60,
  })
}
