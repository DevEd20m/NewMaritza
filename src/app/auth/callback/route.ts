import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { linkGuestOrdersToUser } from '@/lib/auth/link-guest-orders'
import { linkCurrentAnalyticsSession } from '@/lib/analytics/server'
import { sanitizeNextPath } from '@/lib/auth/next-path'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = sanitizeNextPath(searchParams.get('next'))

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        linkGuestOrdersToUser(user.id, user.email).catch((err) =>
          console.error('[auth/callback] linkGuestOrders error:', err)
        )
      }
      await linkCurrentAnalyticsSession({})
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
