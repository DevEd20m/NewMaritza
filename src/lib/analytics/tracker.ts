'use client'

// Tracker first-party: agrupa eventos y los envía a /api/track.
// La sesión vive en localStorage y expira tras 30 min de inactividad.

const SESSION_KEY = 'liora_analytics_session'
const SESSION_TTL_MS = 30 * 60 * 1000
const FLUSH_DELAY_MS = 2000
const MAX_BATCH = 20

export interface TrackedEvent {
  event: string
  path?: string
  referrer?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  product_slug?: string
  variant_id?: string
  value_cents?: number
  metadata?: Record<string, unknown>
}

interface StoredSession {
  id: string
  lastSeen: number
  isNew?: boolean
}

function readSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredSession
    if (!parsed.id || Date.now() - parsed.lastSeen > SESSION_TTL_MS) return null
    return parsed
  } catch {
    return null
  }
}

function getSession(): StoredSession {
  const existing = readSession()
  const session: StoredSession = existing
    ? { id: existing.id, lastSeen: Date.now() }
    : { id: crypto.randomUUID(), lastSeen: Date.now(), isNew: true }
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ id: session.id, lastSeen: session.lastSeen }))
  } catch {}
  return session
}

const queue: (TrackedEvent & { session_id: string; device: string })[] = []
let flushTimer: ReturnType<typeof setTimeout> | null = null
let listenersBound = false

function deviceType(): string {
  return typeof window !== 'undefined' && window.innerWidth < 768 ? 'mobile' : 'desktop'
}

function utmParams(): Pick<TrackedEvent, 'utm_source' | 'utm_medium' | 'utm_campaign'> {
  const params = new URLSearchParams(window.location.search)
  const out: Record<string, string> = {}
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign']) {
    const v = params.get(key)
    if (v) out[key] = v.slice(0, 120)
  }
  return out
}

function flush(useBeacon = false) {
  if (flushTimer) { clearTimeout(flushTimer); flushTimer = null }
  if (queue.length === 0) return
  const events = queue.splice(0, queue.length)
  const body = JSON.stringify({ events })
  const requeue = () => {
    // Reintentar una vez más adelante en vez de perder los eventos
    if (queue.length + events.length <= MAX_BATCH * 2) {
      queue.unshift(...events)
      if (!flushTimer) flushTimer = setTimeout(() => flush(), FLUSH_DELAY_MS * 3)
    }
  }
  try {
    if (useBeacon && navigator.sendBeacon) {
      navigator.sendBeacon('/api/track', new Blob([body], { type: 'application/json' }))
    } else {
      fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).then((res) => { if (!res.ok && res.status !== 204) requeue() }, requeue)
    }
  } catch {}
}

function scheduleFlush() {
  if (queue.length >= MAX_BATCH) { flush(); return }
  if (!flushTimer) flushTimer = setTimeout(() => flush(), FLUSH_DELAY_MS)
}

export function track(event: TrackedEvent) {
  if (typeof window === 'undefined') return
  // No contaminar las estadísticas reales con navegación local de desarrollo
  if (window.location.hostname === 'localhost' && process.env.NEXT_PUBLIC_ANALYTICS_DEBUG !== '1') return
  try {
    const session = getSession()
    if (!listenersBound) {
      listenersBound = true
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') flush(true)
      })
      window.addEventListener('pagehide', () => flush(true))
    }
    queue.push({
      path: window.location.pathname,
      referrer: session.isNew ? (document.referrer || undefined) : undefined,
      ...(session.isNew ? utmParams() : {}),
      ...event,
      session_id: session.id,
      device: deviceType(),
    })
    scheduleFlush()
  } catch {}
}
