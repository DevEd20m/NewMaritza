'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { trackPageView } from '@/lib/analytics/events'
import { beginPageView } from '@/lib/analytics/tracker'

export function PageTracker() {
  const pathname = usePathname()

  useEffect(() => {
    if (!pathname) return
    beginPageView(pathname)
    trackPageView(pathname)
  }, [pathname])

  return null
}
