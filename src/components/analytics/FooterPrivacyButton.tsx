'use client'

export function FooterPrivacyButton() {
  return <button type="button" onClick={() => window.dispatchEvent(new Event('liora:privacy-settings'))} style={{ border: 0, padding: 0, background: 'transparent', color: 'var(--liora-crema)', font: 'inherit', cursor: 'pointer' }}>Preferencias</button>
}
