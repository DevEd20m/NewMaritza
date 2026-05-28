'use client'

declare global {
  interface Window {
    dataLayer: unknown[]
    gtag: (...args: unknown[]) => void
  }
}

function push(event: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  window.dataLayer = window.dataLayer ?? []
  window.dataLayer.push(event)
}

export function trackViewItem(product: {
  id: string; name: string; category?: string; priceCents: number; currency?: string
}) {
  push({
    event: 'view_item',
    ecommerce: {
      currency: product.currency ?? 'PEN',
      value: product.priceCents / 100,
      items: [{ item_id: product.id, item_name: product.name, item_category: product.category, price: product.priceCents / 100 }],
    },
  })
}

export function trackAddToCart(item: {
  variantId: string; name: string; priceCents: number; quantity: number; currency?: string
}) {
  push({
    event: 'add_to_cart',
    ecommerce: {
      currency: item.currency ?? 'PEN',
      value: (item.priceCents * item.quantity) / 100,
      items: [{ item_id: item.variantId, item_name: item.name, price: item.priceCents / 100, quantity: item.quantity }],
    },
  })
}

export function trackBeginCheckout(totalCents: number, items: { variantId: string; name: string; priceCents: number; quantity: number }[], currency = 'PEN') {
  push({
    event: 'begin_checkout',
    ecommerce: {
      currency,
      value: totalCents / 100,
      items: items.map((i) => ({ item_id: i.variantId, item_name: i.name, price: i.priceCents / 100, quantity: i.quantity })),
    },
  })
}

export function trackPurchase(order: {
  orderNumber: string; totalCents: number; currency: string
  items: { variantId: string; name: string; priceCents: number; quantity: number }[]
}) {
  push({
    event: 'purchase',
    ecommerce: {
      transaction_id: order.orderNumber,
      currency: order.currency,
      value: order.totalCents / 100,
      items: order.items.map((i) => ({ item_id: i.variantId, item_name: i.name, price: i.priceCents / 100, quantity: i.quantity })),
    },
  })
}
