'use client'

export function PrivacySettingsButton() {
  return (
    <button type="button" onClick={() => window.dispatchEvent(new Event('liora:privacy-settings'))} style={{ border: '1px solid var(--liora-uva)', borderRadius: 999, padding: '10px 18px', background: 'transparent', color: 'inherit', fontWeight: 700, cursor: 'pointer' }}>
      Abrir preferencias de privacidad
    </button>
  )
}
