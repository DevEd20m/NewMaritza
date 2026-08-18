import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database'

export async function updateSupabaseSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        encode: 'tokens-only',
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet, headersToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
          Object.entries(headersToSet).forEach(([name, value]) => response.headers.set(name, value))
        },
      },
    },
  )

  const startedAt = Date.now()
  const { data, error } = await supabase.auth.getClaims()
  const userId = typeof data?.claims?.sub === 'string' ? data.claims.sub : null

  if (error && error.name !== 'AuthSessionMissingError') {
    console.warn(JSON.stringify({
      event: 'auth_proxy_claims_failed',
      requestId: request.headers.get('x-vercel-id') ?? request.headers.get('x-request-id') ?? null,
      path: request.nextUrl.pathname,
      error: error.name,
      durationMs: Date.now() - startedAt,
    }))
  }

  return { response, userId }
}
