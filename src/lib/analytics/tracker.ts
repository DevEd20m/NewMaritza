'use client'

import { analyticsEnabled } from './preference'
import type { AnalyticsEventInput } from './schema'

const FLUSH_DELAY_MS = 2000
const MAX_BATCH = 20
const HEARTBEAT_MS = 15000
const ACTIVE_WINDOW_MS = 30000

export type TrackedEvent = Omit<AnalyticsEventInput, 'event_id' | 'occurred_at' | 'page_view_id'> & { page_view_id?: string }

const queue: AnalyticsEventInput[] = []
let flushTimer: ReturnType<typeof setTimeout> | null = null
let sessionReady: Promise<boolean> | null = null
let listenersBound = false
let currentPage: { id: string; path: string; lastHeartbeat: number } | null = null
let lastActivity = Date.now()

function deviceType(): 'mobile' | 'desktop' {
  return window.innerWidth < 768 ? 'mobile' : 'desktop'
}

function utmParams() {
  const params = new URLSearchParams(window.location.search)
  const output: Record<string, string> = {}
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign']) {
    const value = params.get(key)
    if (value) output[key] = value.slice(0, 120)
  }
  return output
}

async function bootstrapSession(): Promise<boolean> {
  if (!analyticsEnabled()) return false
  if (!sessionReady) {
    sessionReady = fetch('/api/analytics/session', { method: 'POST', credentials: 'same-origin' })
      .then(async response => response.ok && Boolean((await response.json())?.enabled))
      .catch(() => false)
  }
  return sessionReady
}

function safeTargetId(element: HTMLElement): string | null {
  const explicit = element.dataset.analyticsId
  if (explicit) return explicit.slice(0, 160)
  if (element.id && !/^[0-9a-f-]{24,}$/i.test(element.id)) return element.id.slice(0, 160)
  if (element instanceof HTMLAnchorElement) {
    try {
      const url = new URL(element.href, location.origin)
      return `link:${url.origin === location.origin ? url.pathname : url.hostname}`.slice(0, 160)
    } catch {}
  }
  const label = element.getAttribute('aria-label')
  if (label) return `${element.tagName.toLowerCase()}:${label}`.replace(/\s+/g, '-').slice(0, 160)
  if (element instanceof HTMLImageElement && element.alt) return `image:${element.alt}`.replace(/\s+/g, '-').slice(0, 160)
  if (element instanceof HTMLButtonElement || element.getAttribute('role') === 'button') {
    const parent = element.parentElement
    const peers = parent ? [...parent.querySelectorAll<HTMLElement>(':scope > button, :scope > [role="button"]')] : []
    return `button:${element instanceof HTMLButtonElement ? element.type : 'control'}:${Math.max(0, peers.indexOf(element))}`
  }
  if (element instanceof HTMLImageElement) {
    try { return `image:${new URL(element.currentSrc || element.src, location.origin).pathname}`.slice(0, 160) } catch {}
  }
  return null
}

function targetType(element: HTMLElement): AnalyticsEventInput['target_type'] {
  if (element instanceof HTMLAnchorElement) return 'link'
  if (element instanceof HTMLImageElement) return 'image'
  if (element instanceof HTMLButtonElement) return 'button'
  return element.getAttribute('role') === 'button' ? 'control' : 'card'
}

function recordEngagement(pageExit = false) {
  if (!currentPage || document.visibilityState !== 'visible') return
  const now = Date.now()
  if (now - lastActivity > ACTIVE_WINDOW_MS) {
    currentPage.lastHeartbeat = now
    return
  }
  const engagementMs = Math.min(now - currentPage.lastHeartbeat, HEARTBEAT_MS)
  currentPage.lastHeartbeat = now
  if (engagementMs < 1000) return
  track({ event: 'page_engagement', path: currentPage.path, page_view_id: currentPage.id, engagement_ms: engagementMs, page_exit: pageExit })
}

function bindListeners() {
  if (listenersBound) return
  listenersBound = true
  const markActive = () => { lastActivity = Date.now() }
  for (const event of ['pointerdown', 'keydown', 'scroll'] as const) window.addEventListener(event, markActive, { passive: true })
  document.addEventListener('click', event => {
    const origin = event.target
    if (!(origin instanceof Element)) return
    const element = origin.closest<HTMLElement>('[data-analytics-id],a,button,[role="button"],img')
    if (!element || element.closest('[data-analytics-ignore]')) return
    const targetId = safeTargetId(element)
    if (!targetId) return
    track({
      event: element instanceof HTMLAnchorElement ? 'navigation_click' : 'element_click',
      target_id: targetId,
      target_type: targetType(element),
    })
  }, { capture: true })
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      recordEngagement(true)
      void flush(true)
    } else {
      lastActivity = Date.now()
      if (currentPage) currentPage.lastHeartbeat = Date.now()
    }
  })
  window.addEventListener('pagehide', () => { recordEngagement(true); void flush(true) })
  window.setInterval(() => recordEngagement(false), HEARTBEAT_MS)
  window.addEventListener('liora:analytics-preference', event => {
    if ((event as CustomEvent<string>).detail === 'optout') {
      queue.splice(0, queue.length)
      sessionReady = null
    }
  })
}

export function beginPageView(path: string) {
  if (typeof window === 'undefined' || !analyticsEnabled()) return
  bindListeners()
  if (currentPage) recordEngagement(true)
  const page = { id: crypto.randomUUID(), path, lastHeartbeat: Date.now() }
  currentPage = page
  lastActivity = Date.now()
  track({
    event: 'page_view', path, page_view_id: page.id, page_title: document.title.slice(0, 120),
    referrer: document.referrer || undefined, ...utmParams(),
  })
}

async function flush(useBeacon = false) {
  if (flushTimer) { clearTimeout(flushTimer); flushTimer = null }
  if (queue.length === 0 || !analyticsEnabled()) return
  if (!await bootstrapSession()) return
  const events = queue.splice(0, MAX_BATCH)
  const body = JSON.stringify({ events })
  const requeue = () => { if (analyticsEnabled() && queue.length + events.length <= MAX_BATCH * 2) queue.unshift(...events) }
  try {
    if (useBeacon && navigator.sendBeacon) {
      navigator.sendBeacon('/api/track', new Blob([body], { type: 'application/json' }))
    } else {
      const response = await fetch('/api/track', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true, credentials: 'same-origin',
      })
      if (!response.ok && response.status !== 204) requeue()
    }
  } catch { requeue() }
  if (queue.length) scheduleFlush()
}

function scheduleFlush() {
  if (queue.length >= MAX_BATCH) { void flush(); return }
  if (!flushTimer) flushTimer = setTimeout(() => void flush(), FLUSH_DELAY_MS)
}

export function track(event: TrackedEvent) {
  if (typeof window === 'undefined' || !analyticsEnabled()) return
  if (window.location.hostname === 'localhost' && process.env.NEXT_PUBLIC_ANALYTICS_DEBUG !== '1') return
  bindListeners()
  queue.push({
    event_id: crypto.randomUUID(), occurred_at: new Date().toISOString(), path: window.location.pathname,
    page_view_id: event.page_view_id ?? currentPage?.id, device: deviceType(), ...event,
  })
  scheduleFlush()
}
