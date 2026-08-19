import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { hashOpaqueToken } from '@/lib/security/tokens'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  const invalidUrl = new URL('/cuestionario?resultado=invalido', request.url)
  if (!token || token.length < 32 || token.length > 256) {
    return NextResponse.redirect(invalidUrl)
  }

  const admin = createAdminClient()
  const { data: access } = await admin
    .from('quiz_result_tokens')
    .select('quiz_profile_id, expires_at')
    .eq('token_hash', hashOpaqueToken(token))
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (!access) return NextResponse.redirect(invalidUrl)

  const { data: profile } = await admin
    .from('quiz_profiles')
    .select('id, session_token')
    .eq('id', access.quiz_profile_id)
    .maybeSingle()

  if (!profile) return NextResponse.redirect(invalidUrl)

  const destination = new URL('/carrito', request.url)
  destination.searchParams.set('profileId', profile.id)
  const response = NextResponse.redirect(destination)
  response.cookies.set('liora_session', profile.session_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60,
  })
  response.headers.set('Cache-Control', 'private, no-store, max-age=0')
  response.headers.set('Referrer-Policy', 'no-referrer')
  return response
}
