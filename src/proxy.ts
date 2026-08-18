import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSupabaseSession } from '@/lib/supabase/proxy'

// ─── Rutas que requieren sesión activa (redirect a /login si no) ──────────────
const AUTH_REQUIRED_PREFIXES = ['/cuenta']

// ─── Rutas admin (redirect a / si no es admin → la API retorna 403 igualmente) ─
const ADMIN_PREFIXES = ['/admin']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const { response, userId } = await updateSupabaseSession(request)
  // ── 1. Auth check para rutas protegidas ────────────────────────────────────
  const needsAuth  = AUTH_REQUIRED_PREFIXES.some(p => pathname.startsWith(p))
  const needsAdmin = ADMIN_PREFIXES.some(p => pathname.startsWith(p))

  if (needsAuth || needsAdmin) {
    if (!userId) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('next', pathname)
      const redirectResponse = NextResponse.redirect(loginUrl)
      response.cookies.getAll().forEach(cookie => redirectResponse.cookies.set(cookie))
      for (const header of ['cache-control', 'expires', 'pragma']) {
        const value = response.headers.get(header)
        if (value) redirectResponse.headers.set(header, value)
      }
      return redirectResponse
    }
  }

  // ── 2. Security headers en todas las respuestas ────────────────────────────
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  response.headers.set('X-DNS-Prefetch-Control', 'on')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  // Solo en producción activar HSTS
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  }

  return response
}

export const config = {
  matcher: [
    // Apply middleware to all routes except static files and _next internals
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?)).*)',
  ],
}
