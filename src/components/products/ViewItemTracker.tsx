'use client'

import { useEffect } from 'react'
import { trackViewItem } from '@/lib/analytics/events'

interface Props {
  id: string
  name: string
  slug: string
  category?: string
  priceCents: number
  currency?: string
}

export function ViewItemTracker({ id, name, slug, category, priceCents, currency }: Props) {
  useEffect(() => {
    trackViewItem({ id, name, slug, category, priceCents, currency })
    // Solo al montar: una vista por visita a la página
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  return null
}
