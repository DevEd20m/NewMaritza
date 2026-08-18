import type { Metadata } from 'next'
import { PrivacySettingsButton } from '@/components/analytics/PrivacySettingsButton'

export const metadata: Metadata = { title: 'Privacidad — LIORA' }

export default function PrivacyPage() {
  return (
    <main style={{ maxWidth: 820, margin: '0 auto', padding: '64px 24px 96px', color: 'var(--liora-uva)' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 44, marginBottom: 20 }}>Privacidad</h1>
      <div style={{ fontFamily: 'var(--font-body)', lineHeight: 1.75, display: 'grid', gap: 18 }}>
        <p>LIORA utiliza datos de navegación para mejorar la tienda, comprender recorridos y atender solicitudes de soporte. Registramos pantallas visitadas, tiempo activo y acciones sobre elementos de la interfaz; no registramos contraseñas, contenido escrito en formularios, datos de tarjeta ni coordenadas del cursor.</p>
        <p>Los datos de identidad solo se vinculan internamente cuando voluntariamente inicias sesión, completas un cuestionario, solicitas información o realizas una compra. Google Analytics y Amplitude reciben eventos sanitizados e identificadores opacos, nunca nombres, emails, teléfonos o direcciones.</p>
        <p>Los recorridos detallados se conservan durante 180 días. Puedes desactivar la analítica cuando quieras desde las preferencias de privacidad.</p>
        <div><PrivacySettingsButton /></div>
      </div>
    </main>
  )
}
