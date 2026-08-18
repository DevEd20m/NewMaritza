'use client'

export type AnalyticsPreference = 'accepted' | 'optout' | 'unset'
const COOKIE = 'liora_analytics_preference'

export function getAnalyticsPreference(): AnalyticsPreference {
  if (typeof document === 'undefined') return 'unset'
  const value = document.cookie.split('; ').find(row => row.startsWith(`${COOKIE}=`))?.split('=')[1]
  return value === 'accepted' || value === 'optout' ? value : 'unset'
}

export function analyticsEnabled(): boolean {
  return getAnalyticsPreference() !== 'optout'
}

export function subscribeAnalyticsPreference(onChange: () => void) {
  const listener = () => onChange()
  window.addEventListener('liora:analytics-preference', listener)
  return () => window.removeEventListener('liora:analytics-preference', listener)
}

export function setAnalyticsPreference(value: Exclude<AnalyticsPreference, 'unset'>) {
  document.cookie = `${COOKIE}=${value}; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`
  window.dispatchEvent(new CustomEvent('liora:analytics-preference', { detail: value }))
}

export async function optOutAnalytics() {
  setAnalyticsPreference('optout')
  await fetch('/api/analytics/opt-out', { method: 'POST', credentials: 'same-origin' }).catch(() => undefined)
}
