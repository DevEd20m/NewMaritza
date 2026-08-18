'use client'

import { track } from './tracker'
import { analyticsEnabled } from './preference'

declare global {
  interface Window {
    dataLayer: unknown[]
    gtag: (...args: unknown[]) => void
  }
}

function push(event: Record<string, unknown> & { event: string; ecommerce?: Record<string, unknown> }) {
  if (typeof window === 'undefined' || !analyticsEnabled()) return
  window.dataLayer = window.dataLayer ?? []
  window.dataLayer.push(event)
  // Con GTM el dataLayer es la única salida para evitar eventos duplicados.
  if (!process.env.NEXT_PUBLIC_GTM_ID && typeof window.gtag === 'function') {
    window.gtag('event', event.event, event.ecommerce ?? Object.fromEntries(Object.entries(event).filter(([key]) => key !== 'event')))
  }
}

export function trackPageView(path: string) {
  push({ event: 'page_view', page_path: path })
}

export function trackViewItem(product: {
  id: string; name: string; category?: string; priceCents: number; currency?: string; slug?: string
}) {
  push({
    event: 'view_item',
    ecommerce: {
      currency: product.currency ?? 'PEN',
      value: product.priceCents / 100,
      items: [{ item_id: product.id, item_name: product.name, item_category: product.category, price: product.priceCents / 100 }],
    },
  })
  track({ event: 'view_item', product_slug: product.slug ?? product.id, value_cents: product.priceCents, metadata: { name: product.name, category: product.category } })
}

export function trackAddToCart(item: {
  variantId: string; name: string; priceCents: number; quantity: number; currency?: string; productSlug?: string
}) {
  push({
    event: 'add_to_cart',
    ecommerce: {
      currency: item.currency ?? 'PEN',
      value: (item.priceCents * item.quantity) / 100,
      items: [{ item_id: item.variantId, item_name: item.name, price: item.priceCents / 100, quantity: item.quantity }],
    },
  })
  track({ event: 'add_to_cart', variant_id: item.variantId, product_slug: item.productSlug, value_cents: item.priceCents * item.quantity, metadata: { name: item.name, quantity: item.quantity } })
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
  track({ event: 'begin_checkout', value_cents: totalCents, metadata: { items: items.map((i) => ({ name: i.name, quantity: i.quantity })) } })
}

export function trackCheckoutError(message: string, totalCents?: number) {
  push({ event: 'checkout_error' })
  track({ event: 'checkout_error', value_cents: totalCents, metadata: { message: message.slice(0, 300) } })
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
  track({ event: 'purchase', value_cents: order.totalCents, metadata: { order_number: order.orderNumber, items: order.items.map((i) => ({ name: i.name, quantity: i.quantity })) } })
}

export function trackSearch(query: string, resultsCount: number) {
  track({
    event: resultsCount === 0 ? 'search_no_results' : 'search',
    metadata: { query: query.slice(0, 120), results: resultsCount },
  })
}

export function trackQuizStart() {
  track({ event: 'quiz_start' })
}

export function trackQuizStep(stepIndex: number, totalSteps: number) {
  track({ event: 'quiz_step', metadata: { step: stepIndex + 1, total: totalSteps } })
}

export function trackQuizComplete() {
  track({ event: 'quiz_complete' })
}
