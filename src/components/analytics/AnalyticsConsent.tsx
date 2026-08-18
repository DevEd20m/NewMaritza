'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import { getAnalyticsPreference, optOutAnalytics, setAnalyticsPreference, subscribeAnalyticsPreference } from '@/lib/analytics/preference'

export function AnalyticsConsent() {
  const preference = useSyncExternalStore(subscribeAnalyticsPreference, getAnalyticsPreference, () => 'accepted')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const visible = preference === 'unset' || settingsOpen

  useEffect(() => {
    const open = () => setSettingsOpen(true)
    window.addEventListener('liora:privacy-settings', open)
    return () => window.removeEventListener('liora:privacy-settings', open)
  }, [])

  if (!visible) return null
  return (
    <aside aria-label="Preferencias de analítica" style={{ position: 'fixed', zIndex: 10000, left: 16, right: 16, bottom: 16, maxWidth: 760, margin: '0 auto', background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-arena)', boxShadow: 'var(--shadow-3)', borderRadius: 18, padding: '16px 18px', color: 'var(--liora-uva)', fontFamily: 'var(--font-body)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <p style={{ margin: 0, flex: '1 1 340px', fontSize: 13, lineHeight: 1.5 }}>
          Usamos analítica para entender qué pantallas ayudan y dónde mejorar. No enviamos tu nombre, email ni teléfono a Google o Amplitude. <a href="/privacidad" style={{ color: 'inherit', fontWeight: 700 }}>Ver privacidad</a>.
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {settingsOpen && <button type="button" onClick={() => { void optOutAnalytics(); setSettingsOpen(false) }} style={secondaryButton}>Desactivar</button>}
          {!settingsOpen && <button type="button" onClick={() => setSettingsOpen(true)} style={secondaryButton}>Configurar</button>}
          <button type="button" onClick={() => { setAnalyticsPreference('accepted'); setSettingsOpen(false) }} style={primaryButton}>Aceptar</button>
        </div>
      </div>
    </aside>
  )
}

const primaryButton = { border: 0, borderRadius: 999, padding: '10px 18px', background: 'var(--liora-uva)', color: 'var(--liora-crema)', fontWeight: 700, cursor: 'pointer' }
const secondaryButton = { ...primaryButton, background: 'transparent', color: 'var(--liora-uva)', border: '1px solid var(--liora-arena)' }
