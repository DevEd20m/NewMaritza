'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { trackPageView } from '@/lib/analytics/events'

export function PageTracker() {
  const pathname = usePathname()

  useEffect(() => {
    if (!pathname) return
    trackPageView(pathname)
    if (typeof window !== 'undefined' && typeof window.gtag === 'function' && process.env.NEXT_PUBLIC_GA4_ID) {
      window.gtag('event', 'page_view', { page_path: pathname })
    }
  }, [pathname])

  return null
}
