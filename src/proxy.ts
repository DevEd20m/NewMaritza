import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// ─── Rutas que requieren sesión activa (redirect a /login si no) ──────────────
const AUTH_REQUIRED_PREFIXES = ['/cuenta']

// ─── Rutas admin (redirect a / si no es admin → la API retorna 403 igualmente) ─
const ADMIN_PREFIXES = ['/admin']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  // ── 1. Auth check para rutas protegidas ────────────────────────────────────
  const needsAuth  = AUTH_REQUIRED_PREFIXES.some(p => pathname.startsWith(p))
  const needsAdmin = ADMIN_PREFIXES.some(p => pathname.startsWith(p))

  if (needsAuth || needsAdmin) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: () => {},   // read-only in middleware
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Admin routes: verify role
    if (needsAdmin) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if ((profile as { role: string | null } | null)?.role !== 'admin') {
        return NextResponse.redirect(new URL('/', request.url))
      }
    }
  }

  // ── 2. Security headers en todas las respuestas ────────────────────────────
  const response = NextResponse.next()

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
