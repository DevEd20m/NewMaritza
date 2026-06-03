import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// ─── Rate limiter (API routes públicas sensibles) ─────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function rateLimit(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (entry.count >= limit) return false
  entry.count++
  return true
}

const RATE_LIMITED_PATHS: Record<string, { limit: number; windowMs: number }> = {
  '/api/quiz/submit':           { limit: 10,  windowMs: 60_000 },
  '/api/coupons/validate':      { limit: 15,  windowMs: 60_000 },
  '/api/checkout':              { limit: 5,   windowMs: 60_000 },
  '/api/payment/create-session':{ limit: 5,   windowMs: 60_000 },
}

// ─── Rutas que requieren sesión activa (redirect a /login si no) ──────────────
const AUTH_REQUIRED_PREFIXES = ['/cuenta']

// ─── Rutas admin (redirect a / si no es admin → la API retorna 403 igualmente) ─
const ADMIN_PREFIXES = ['/admin']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'

  // ── 1. Rate limiting en rutas API ──────────────────────────────────────────
  const rlConfig = RATE_LIMITED_PATHS[pathname]
  if (rlConfig) {
    const allowed = rateLimit(`${ip}:${pathname}`, rlConfig.limit, rlConfig.windowMs)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Espera un momento.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      )
    }
  }

  // ── 2. Auth check para rutas protegidas ────────────────────────────────────
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

  // ── 3. Security headers en todas las respuestas ────────────────────────────
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
