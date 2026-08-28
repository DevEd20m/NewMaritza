'use client'

import { useEffect } from 'react'
import { trackViewItemList } from '@/lib/analytics/events'

// Registra qué productos se le MOSTRARON a la persona en una lista (kits
// destacados, relacionados, sugerencias). Montable desde componentes servidor.
export function ItemListTracker({ list, slugs }: { list: string; slugs: string[] }) {
  useEffect(() => {
    trackViewItemList(list, slugs)
    // Solo al montar: la lista servida no cambia dentro de la misma vista.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}
